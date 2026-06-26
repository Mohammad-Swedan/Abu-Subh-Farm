// Employees & Payroll service — business logic, transactions, ledger writes. Returns Result<T>.
// NO "use server" here; the actions layer is the server boundary. Money is integer fils.
import type { Employee, SalaryPayment, Advance } from "@prisma/client";
import { prisma } from "@/lib/db/prisma";
import {
  postLedgerEntry,
  reverseLedgerForRef,
} from "@/lib/ledger/ledger.service";
import { ok, err, type Result } from "@/lib/result";
import type {
  CreateEmployeeInput,
  UpdateEmployeeInput,
  SetEmployeeActiveInput,
} from "../schemas/employee.schema";
import type {
  NamedPaymentInput,
  LumpPaymentInput,
  UpdatePaymentInput,
} from "../schemas/payment.schema";
import type { CreateAdvanceInput } from "../schemas/advance.schema";

// ── Employees ────────────────────────────────────────────────────────────────

/** Create an employee. The irrelevant rate for the chosen pay type stays null. */
export async function createEmployee(
  input: CreateEmployeeInput,
): Promise<Result<Employee>> {
  try {
    const employee = await prisma.employee.create({
      data: {
        name: input.name,
        payType: input.payType,
        monthlySalaryFils: input.monthlySalaryFils ?? null,
        dailyRateFils: input.dailyRateFils ?? null,
        phone: input.phone ?? null,
        note: input.note ?? null,
        isActive: true,
      },
    });
    return ok(employee);
  } catch {
    return err("CREATE_FAILED", "تعذّر حفظ العامل");
  }
}

/**
 * Edit an employee. We force the rate that does not match the pay type to null
 * (MONTHLY keeps monthlySalaryFils, DAILY keeps dailyRateFils).
 */
export async function updateEmployee(
  input: UpdateEmployeeInput,
): Promise<Result<Employee>> {
  try {
    const existing = await prisma.employee.findUnique({
      where: { id: input.id },
    });
    if (!existing) return err("NOT_FOUND", "العامل غير موجود");

    const isMonthly = input.payType === "MONTHLY";
    const employee = await prisma.employee.update({
      where: { id: input.id },
      data: {
        name: input.name,
        payType: input.payType,
        monthlySalaryFils: isMonthly ? input.monthlySalaryFils ?? null : null,
        dailyRateFils: isMonthly ? null : input.dailyRateFils ?? null,
        phone: input.phone ?? null,
        note: input.note ?? null,
      },
    });
    return ok(employee);
  } catch {
    return err("UPDATE_FAILED", "تعذّر تعديل العامل");
  }
}

/** Toggle an employee's active flag. */
export async function setEmployeeActive(
  input: SetEmployeeActiveInput,
): Promise<Result<Employee>> {
  try {
    const employee = await prisma.employee.update({
      where: { id: input.id },
      data: { isActive: input.isActive },
    });
    return ok(employee);
  } catch {
    return err("UPDATE_FAILED", "تعذّر تحديث حالة العامل");
  }
}

// ── Payments ─────────────────────────────────────────────────────────────────

/**
 * Pay a named employee. `amountFils` is the GROSS pay; `deductFils` nets unsettled
 * advances oldest-first. The ledger entry + SalaryPayment record the NET only.
 */
export async function payNamed(
  input: NamedPaymentInput,
): Promise<Result<SalaryPayment>> {
  try {
    const result = await prisma.$transaction(async (tx) => {
      const emp = await tx.employee.findUnique({
        where: { id: input.employeeId },
      });
      if (!emp) return "NOT_FOUND" as const;

      // Outstanding unsettled advances, oldest-first for allocation.
      const advances = await tx.advance.findMany({
        where: { employeeId: emp.id, isSettled: false },
        orderBy: [{ date: "asc" }, { id: "asc" }],
      });
      const outstanding = advances.reduce(
        (s, a) => s + (a.amountFils - a.settledAmountFils),
        0,
      );

      const deduct = Math.max(0, input.deductFils ?? 0);
      if (deduct > Math.min(input.amountFils, outstanding)) {
        return "BAD_DEDUCT" as const;
      }
      const net = input.amountFils - deduct;

      // Allocate the deduction oldest-first, settling advances as they fill.
      let left = deduct;
      for (const a of advances) {
        if (left <= 0) break;
        const take = Math.min(a.amountFils - a.settledAmountFils, left);
        const settled = a.settledAmountFils + take;
        await tx.advance.update({
          where: { id: a.id },
          data: { settledAmountFils: settled, isSettled: settled === a.amountFils },
        });
        left -= take;
      }

      // Note: append a fils breakdown when a deduction was applied.
      const note = input.note?.trim() || null;
      const fullNote =
        deduct > 0
          ? `${note ? note + " · " : ""}إجمالي ${input.amountFils} − سلف ${deduct} = صافي ${net} (فلس)`
          : note;

      const ledger = await postLedgerEntry(tx, {
        date: input.date,
        direction: "OUT",
        amountFils: net,
        scope: "FARM",
        source: "SALARY",
        note: fullNote,
      });
      const payment = await tx.salaryPayment.create({
        data: {
          employeeId: emp.id,
          date: input.date,
          amountFils: net,
          periodLabel: input.periodLabel ?? null,
          workersCount: null,
          note: fullNote,
          ledgerEntryId: ledger.id,
        },
      });
      await tx.ledgerEntry.update({
        where: { id: ledger.id },
        data: { refId: payment.id },
      });
      return payment;
    });

    if (result === "NOT_FOUND") return err("NOT_FOUND", "العامل غير موجود");
    if (result === "BAD_DEDUCT") return err("BAD_DEDUCT", "قيمة الخصم غير صحيحة");
    return ok(result);
  } catch {
    return err("PAY_FAILED", "تعذّر حفظ الدفعة");
  }
}

/** Record a lump seasonal-crew payment (no named employee). */
export async function payLump(
  input: LumpPaymentInput,
): Promise<Result<SalaryPayment>> {
  try {
    const payment = await prisma.$transaction(async (tx) => {
      const ledger = await postLedgerEntry(tx, {
        date: input.date,
        direction: "OUT",
        amountFils: input.amountFils,
        scope: "FARM",
        source: "SALARY",
        note: input.note ?? null,
      });
      const created = await tx.salaryPayment.create({
        data: {
          employeeId: null,
          date: input.date,
          amountFils: input.amountFils,
          periodLabel: input.periodLabel,
          workersCount: input.workersCount,
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
    return ok(payment);
  } catch {
    return err("PAY_FAILED", "تعذّر حفظ الدفعة");
  }
}

/**
 * Edit a payment and update its LINKED ledger entry IN PLACE. No advance netting
 * on edit. We must NOT reverse the ledger here (cascade would delete the payment).
 */
export async function updatePayment(
  input: UpdatePaymentInput,
): Promise<Result<SalaryPayment>> {
  // Guard money ourselves — ledger.update won't validate (postLedgerEntry would).
  if (!Number.isInteger(input.amountFils) || input.amountFils <= 0) {
    return err("UPDATE_FAILED", "تعذّر تعديل الدفعة");
  }
  try {
    const result = await prisma.$transaction(async (tx) => {
      const existing = await tx.salaryPayment.findUnique({
        where: { id: input.id },
      });
      if (!existing) return null;

      await tx.ledgerEntry.update({
        where: { id: existing.ledgerEntryId },
        data: {
          date: input.date,
          amountFils: input.amountFils,
          note: input.note ?? null,
        },
      });

      return tx.salaryPayment.update({
        where: { id: input.id },
        data: {
          date: input.date,
          amountFils: input.amountFils,
          periodLabel: input.periodLabel ?? null,
          note: input.note ?? null,
        },
      });
    });

    if (result === null) return err("NOT_FOUND", "الدفعة غير موجودة");
    return ok(result);
  } catch {
    return err("UPDATE_FAILED", "تعذّر تعديل الدفعة");
  }
}

/** Delete a payment by reversing its ledger entry (cascade-deletes the payment). */
export async function deletePayment(id: string): Promise<Result<true>> {
  try {
    const count = await prisma.$transaction((tx) =>
      reverseLedgerForRef(tx, "SALARY", id),
    );
    if (count === 0) return err("NOT_FOUND", "الدفعة غير موجودة");
    return ok(true);
  } catch {
    return err("DELETE_FAILED", "تعذّر حذف الدفعة");
  }
}

// ── Advances ─────────────────────────────────────────────────────────────────

/**
 * Record an advance (real labor cash out). The Advance row does NOT link the
 * ledger; we create the advance first, then post the OUT entry with refId = advance.id.
 */
export async function createAdvance(
  input: CreateAdvanceInput,
): Promise<Result<Advance>> {
  try {
    const result = await prisma.$transaction(async (tx) => {
      const emp = await tx.employee.findUnique({
        where: { id: input.employeeId },
      });
      if (!emp) return null;

      const advance = await tx.advance.create({
        data: {
          employeeId: emp.id,
          date: input.date,
          amountFils: input.amountFils,
          settledAmountFils: 0,
          isSettled: false,
          note: input.note ?? null,
        },
      });
      await postLedgerEntry(tx, {
        date: input.date,
        direction: "OUT",
        amountFils: input.amountFils,
        scope: "FARM",
        source: "SALARY",
        refId: advance.id,
        note: `سلفة: ${emp.name}${input.note ? " · " + input.note : ""}`,
      });
      return advance;
    });

    if (result === null) return err("NOT_FOUND", "العامل غير موجود");
    return ok(result);
  } catch {
    return err("CREATE_FAILED", "تعذّر تسجيل السلفة");
  }
}

/** Delete an unsettled advance, reversing its ledger entry. Settled advances are protected. */
export async function deleteAdvance(id: string): Promise<Result<true>> {
  try {
    const result = await prisma.$transaction(async (tx) => {
      const advance = await tx.advance.findUnique({ where: { id } });
      if (!advance) return "NOT_FOUND" as const;
      if (advance.settledAmountFils !== 0) return "SETTLED" as const;
      await reverseLedgerForRef(tx, "SALARY", id);
      await tx.advance.delete({ where: { id } });
      return "OK" as const;
    });

    if (result === "NOT_FOUND") return err("NOT_FOUND", "السلفة غير موجودة");
    if (result === "SETTLED") {
      return err("ADVANCE_SETTLED", "لا يمكن حذف سلفة مسدّدة");
    }
    return ok(true);
  } catch {
    return err("DELETE_FAILED", "تعذّر حذف السلفة");
  }
}
