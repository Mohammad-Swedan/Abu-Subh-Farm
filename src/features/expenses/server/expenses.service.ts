// Expenses service — business logic, transactions, ledger writes. Returns Result<T>.
// NO "use server" here; the actions layer is the server boundary.
import { Prisma } from "@prisma/client";
import type { Expense, Category, RecurringExpense } from "@prisma/client";
import { prisma } from "@/lib/db/prisma";
import {
  postLedgerEntry,
  reverseLedgerForRef,
} from "@/lib/ledger/ledger.service";
import { ok, err, type Result } from "@/lib/result";
import type {
  CreateExpenseInput,
  UpdateExpenseInput,
  CreateCategoryInput,
  RenameCategoryInput,
  RecurringExpenseInput,
  UpdateRecurringInput,
} from "../schema";
import type { PostDueResult } from "../types";
import {
  countExpensesForCategory,
  countLedgerForCategory,
} from "./expenses.repository";

// ── Expenses ─────────────────────────────────────────────────────────────────

/**
 * Create one expense + its single OUT ledger entry, atomically.
 * The ledger entry is created first, the expense links to it, then we backfill
 * the entry's refId so reverseLedgerForRef can find/cascade it later.
 */
export async function createExpense(
  input: CreateExpenseInput,
): Promise<Result<Expense>> {
  try {
    const expense = await prisma.$transaction(async (tx) => {
      const ledger = await postLedgerEntry(tx, {
        date: input.date,
        direction: "OUT",
        amountFils: input.amountFils,
        scope: input.scope,
        source: "EXPENSE",
        categoryId: input.categoryId,
        cropId: input.cropId ?? null,
        note: input.note ?? null,
      });
      const created = await tx.expense.create({
        data: {
          date: input.date,
          amountFils: input.amountFils,
          categoryId: input.categoryId,
          scope: input.scope,
          cropId: input.cropId ?? null,
          vendor: input.vendor ?? null,
          note: input.note ?? null,
          ledgerEntryId: ledger.id,
        },
      });
      await tx.ledgerEntry.update({
        where: { id: ledger.id },
        data: { refId: created.id },
      });
      return created;
    });
    return ok(expense);
  } catch {
    return err("CREATE_FAILED", "تعذّر حفظ المصروف، حاول مرة أخرى");
  }
}

/**
 * Edit an expense and update its LINKED ledger entry IN PLACE.
 * We must NOT use reverseLedgerForRef here: deleting the ledger row would
 * cascade-delete the expense we're trying to update.
 */
export async function updateExpense(
  input: UpdateExpenseInput,
): Promise<Result<Expense>> {
  // Guard money ourselves — ledger.update won't validate (postLedgerEntry would).
  if (!Number.isInteger(input.amountFils) || input.amountFils <= 0) {
    return err("UPDATE_FAILED", "تعذّر تعديل المصروف");
  }
  try {
    const result = await prisma.$transaction(async (tx) => {
      const existing = await tx.expense.findUnique({
        where: { id: input.id },
      });
      if (!existing) return null;

      await tx.ledgerEntry.update({
        where: { id: existing.ledgerEntryId },
        data: {
          date: input.date,
          amountFils: input.amountFils,
          scope: input.scope,
          categoryId: input.categoryId,
          cropId: input.cropId ?? null,
          note: input.note ?? null,
        },
      });

      return tx.expense.update({
        where: { id: input.id },
        data: {
          date: input.date,
          amountFils: input.amountFils,
          categoryId: input.categoryId,
          scope: input.scope,
          cropId: input.cropId ?? null,
          vendor: input.vendor ?? null,
          note: input.note ?? null,
        },
      });
    });

    if (result === null) return err("NOT_FOUND", "المصروف غير موجود");
    return ok(result);
  } catch {
    return err("UPDATE_FAILED", "تعذّر تعديل المصروف");
  }
}

/**
 * Delete an expense by reversing its ledger entry. Deleting the LedgerEntry
 * (matched by source+refId) cascade-deletes the owning expense.
 */
export async function deleteExpense(id: string): Promise<Result<true>> {
  try {
    const count = await prisma.$transaction((tx) =>
      reverseLedgerForRef(tx, "EXPENSE", id),
    );
    if (count === 0) return err("NOT_FOUND", "المصروف غير موجود");
    return ok(true);
  } catch {
    return err("DELETE_FAILED", "تعذّر حذف المصروف");
  }
}

// ── Categories ───────────────────────────────────────────────────────────────

/** Add a custom expense category (kind EXPENSE, not system), appended at the end. */
export async function addExpenseCategory(
  input: CreateCategoryInput,
): Promise<Result<Category>> {
  try {
    const top = await prisma.category.aggregate({ _max: { sortOrder: true } });
    const nextSortOrder = (top._max.sortOrder ?? 0) + 1;
    const category = await prisma.category.create({
      data: {
        nameAr: input.nameAr,
        kind: "EXPENSE",
        isSystem: false,
        sortOrder: nextSortOrder,
      },
    });
    return ok(category);
  } catch {
    return err("CREATE_FAILED", "تعذّر إضافة التصنيف");
  }
}

/** Rename a category; system categories are protected. */
export async function renameExpenseCategory(
  input: RenameCategoryInput,
): Promise<Result<Category>> {
  try {
    const existing = await prisma.category.findUnique({
      where: { id: input.id },
    });
    if (!existing) return err("NOT_FOUND", "التصنيف غير موجود");
    if (existing.isSystem) {
      return err("SYSTEM_CATEGORY", "لا يمكن تعديل تصنيف افتراضي");
    }
    const category = await prisma.category.update({
      where: { id: input.id },
      data: { nameAr: input.nameAr },
    });
    return ok(category);
  } catch {
    return err("UPDATE_FAILED", "تعذّر تعديل التصنيف");
  }
}

/** Delete a category; protected if system or in use by any expense/ledger entry. */
export async function deleteExpenseCategory(id: string): Promise<Result<true>> {
  try {
    const existing = await prisma.category.findUnique({ where: { id } });
    if (!existing) return err("NOT_FOUND", "التصنيف غير موجود");
    if (existing.isSystem) {
      return err("SYSTEM_CATEGORY", "لا يمكن حذف تصنيف افتراضي");
    }
    const [expenseCount, ledgerCount] = await Promise.all([
      countExpensesForCategory(id),
      countLedgerForCategory(id),
    ]);
    if (expenseCount > 0 || ledgerCount > 0) {
      return err("CATEGORY_IN_USE", "لا يمكن حذف تصنيف مستخدم في مصاريف");
    }
    await prisma.category.delete({ where: { id } });
    return ok(true);
  } catch {
    return err("DELETE_FAILED", "تعذّر حذف التصنيف");
  }
}

// ── Recurring templates (do NOT post a ledger entry themselves) ──────────────

export async function createRecurring(
  input: RecurringExpenseInput,
): Promise<Result<RecurringExpense>> {
  try {
    const recurring = await prisma.recurringExpense.create({
      data: {
        nameAr: input.nameAr,
        amountFils: input.amountFils,
        categoryId: input.categoryId,
        scope: input.scope,
        dayOfMonth: input.dayOfMonth,
        isActive: input.isActive,
      },
    });
    return ok(recurring);
  } catch {
    return err("CREATE_FAILED", "تعذّر إضافة المصروف الثابت");
  }
}

export async function updateRecurring(
  input: UpdateRecurringInput,
): Promise<Result<RecurringExpense>> {
  try {
    const recurring = await prisma.recurringExpense.update({
      where: { id: input.id },
      data: {
        nameAr: input.nameAr,
        amountFils: input.amountFils,
        categoryId: input.categoryId,
        scope: input.scope,
        dayOfMonth: input.dayOfMonth,
        isActive: input.isActive,
      },
    });
    return ok(recurring);
  } catch {
    return err("UPDATE_FAILED", "تعذّر تعديل المصروف الثابت");
  }
}

export async function deleteRecurring(id: string): Promise<Result<true>> {
  try {
    await prisma.recurringExpense.delete({ where: { id } });
    return ok(true);
  } catch {
    return err("DELETE_FAILED", "تعذّر حذف المصروف الثابت");
  }
}

/**
 * Post an expense + its OUT ledger entry inside an existing transaction.
 * Shared by createExpense's pattern and postDueRecurring so the
 * create-expense-with-ledger logic lives in one place.
 */
async function postExpenseWithLedger(
  tx: Prisma.TransactionClient,
  data: {
    date: Date;
    amountFils: number;
    categoryId: string;
    scope: "FARM" | "PERSONAL";
    cropId?: string | null;
    vendor?: string | null;
    note?: string | null;
  },
): Promise<Expense> {
  const ledger = await postLedgerEntry(tx, {
    date: data.date,
    direction: "OUT",
    amountFils: data.amountFils,
    scope: data.scope,
    source: "EXPENSE",
    categoryId: data.categoryId,
    cropId: data.cropId ?? null,
    note: data.note ?? null,
  });
  const expense = await tx.expense.create({
    data: {
      date: data.date,
      amountFils: data.amountFils,
      categoryId: data.categoryId,
      scope: data.scope,
      cropId: data.cropId ?? null,
      vendor: data.vendor ?? null,
      note: data.note ?? null,
      ledgerEntryId: ledger.id,
    },
  });
  await tx.ledgerEntry.update({
    where: { id: ledger.id },
    data: { refId: expense.id },
  });
  return expense;
}

/** True when `lastPostedOn` is null or falls in an earlier month/year than `ref`. */
function isDueThisMonth(lastPostedOn: Date | null, ref: Date): boolean {
  if (lastPostedOn === null) return true;
  if (lastPostedOn.getFullYear() < ref.getFullYear()) return true;
  if (lastPostedOn.getFullYear() > ref.getFullYear()) return false;
  return lastPostedOn.getMonth() < ref.getMonth();
}

/**
 * Post every active recurring template that is due this calendar month and whose
 * dayOfMonth has been reached. Each fires an Expense + ledger entry and stamps
 * lastPostedOn = ref. Idempotent within a month.
 */
export async function postDueRecurring(
  ref: Date = new Date(),
): Promise<Result<PostDueResult>> {
  try {
    const dayOfMonth = ref.getDate();
    const templates = await prisma.recurringExpense.findMany({
      where: { isActive: true, dayOfMonth: { lte: dayOfMonth } },
    });

    let postedCount = 0;
    for (const template of templates) {
      if (!isDueThisMonth(template.lastPostedOn, ref)) continue;
      await prisma.$transaction(async (tx) => {
        await postExpenseWithLedger(tx, {
          date: ref,
          amountFils: template.amountFils,
          categoryId: template.categoryId,
          scope: template.scope as "FARM" | "PERSONAL",
          note: `تلقائي: ${template.nameAr}`,
        });
        await tx.recurringExpense.update({
          where: { id: template.id },
          data: { lastPostedOn: ref },
        });
      });
      postedCount += 1;
    }

    return ok({ postedCount });
  } catch {
    return err("POST_DUE_FAILED", "تعذّر ترحيل المصاريف الثابتة المستحقة");
  }
}
