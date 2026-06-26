// Expenses repository — pure Prisma reads/writes.
// NO ledger logic, NO Result wrapping, NO "use server". Business rules live in the service.
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/db/prisma";
import type {
  ExpenseWithRelations,
  CategoryOption,
  CropOption,
  ExpenseFilter,
  RecurringWithCategory,
} from "../types";

/** Build the shared Prisma where clause from an ExpenseFilter (DRY between list + sum + count). */
function buildExpenseWhere(filter: ExpenseFilter): Prisma.ExpenseWhereInput {
  const where: Prisma.ExpenseWhereInput = {
    date: { gte: filter.start, lte: filter.end },
  };
  if (filter.categoryId !== undefined) where.categoryId = filter.categoryId;
  if (filter.scope !== undefined) where.scope = filter.scope;
  if (filter.q) {
    where.OR = [
      { vendor: { contains: filter.q } },
      { note: { contains: filter.q } },
      { category: { is: { nameAr: { contains: filter.q } } } },
    ];
  }
  return where;
}

/** List expenses in range (+ optional category/scope/search), newest first, with relations. */
export async function listExpenses(
  filter: ExpenseFilter,
  opts?: { skip?: number; take?: number },
): Promise<ExpenseWithRelations[]> {
  return prisma.expense.findMany({
    where: buildExpenseWhere(filter),
    include: { category: true, crop: true },
    orderBy: [{ date: "desc" }, { createdAt: "desc" }],
    skip: opts?.skip,
    take: opts?.take,
  });
}

/** Count expenses matching the filter — drives pagination. */
export async function countExpenses(filter: ExpenseFilter): Promise<number> {
  return prisma.expense.count({ where: buildExpenseWhere(filter) });
}

/** Sum amountFils for the matching expenses. Returns 0 when there are none. */
export async function sumExpensesFils(filter: ExpenseFilter): Promise<number> {
  const agg = await prisma.expense.aggregate({
    _sum: { amountFils: true },
    where: buildExpenseWhere(filter),
  });
  return agg._sum.amountFils ?? 0;
}

/** Load a single expense with its relations, or null. */
export async function getExpenseById(
  id: string,
): Promise<ExpenseWithRelations | null> {
  return prisma.expense.findUnique({
    where: { id },
    include: { category: true, crop: true },
  });
}

/** Categories usable for expenses (kind EXPENSE or BOTH). */
export async function listExpenseCategories(): Promise<CategoryOption[]> {
  return prisma.category.findMany({
    where: { kind: { in: ["EXPENSE", "BOTH"] } },
    orderBy: [{ sortOrder: "asc" }, { nameAr: "asc" }],
    select: { id: true, nameAr: true, isSystem: true },
  });
}

/** Active crops for the optional crop picker. */
export async function listActiveCrops(): Promise<CropOption[]> {
  return prisma.crop.findMany({
    where: { isActive: true },
    orderBy: { nameAr: "asc" },
    select: { id: true, nameAr: true },
  });
}

/** Number of expenses referencing a category — guards category delete. */
export async function countExpensesForCategory(
  categoryId: string,
): Promise<number> {
  return prisma.expense.count({ where: { categoryId } });
}

/** Number of ledger entries referencing a category — guards category delete. */
export async function countLedgerForCategory(
  categoryId: string,
): Promise<number> {
  return prisma.ledgerEntry.count({ where: { categoryId } });
}

/** All recurring templates with their category — active first, then by day-of-month. */
export async function listRecurring(): Promise<RecurringWithCategory[]> {
  return prisma.recurringExpense.findMany({
    include: { category: true },
    orderBy: [{ isActive: "desc" }, { dayOfMonth: "asc" }],
  });
}
