"use server";

// Employees & Payroll server actions — thin boundary. Each: requireUser → Zod parse →
// service call → revalidate on success. No business logic lives here.
import { revalidatePath } from "next/cache";
import type { Employee, SalaryPayment, Advance } from "@prisma/client";
import { requireUser } from "@/lib/auth";
import { fromZodError, type Result } from "@/lib/result";
import { REVALIDATE_PATHS } from "../constants";
import {
  createEmployeeSchema,
  updateEmployeeSchema,
  setEmployeeActiveSchema,
} from "../schemas/employee.schema";
import {
  namedPaymentSchema,
  lumpPaymentSchema,
  updatePaymentSchema,
  paymentIdSchema,
} from "../schemas/payment.schema";
import {
  createAdvanceSchema,
  advanceIdSchema,
} from "../schemas/advance.schema";
import {
  createEmployee,
  updateEmployee,
  setEmployeeActive,
  payNamed,
  payLump,
  updatePayment,
  deletePayment,
  createAdvance,
  deleteAdvance,
} from "./employees.service";

/** Revalidate every route affected by a payroll write (lists + header balance). */
function revalidate(): void {
  for (const path of REVALIDATE_PATHS) revalidatePath(path);
}

// ── Employees ────────────────────────────────────────────────────────────────

export async function createEmployeeAction(
  raw: unknown,
): Promise<Result<Employee>> {
  await requireUser();
  const parsed = createEmployeeSchema.safeParse(raw);
  if (!parsed.success) return { ok: false, error: fromZodError(parsed.error) };
  const result = await createEmployee(parsed.data);
  if (result.ok) revalidate();
  return result;
}

export async function updateEmployeeAction(
  raw: unknown,
): Promise<Result<Employee>> {
  await requireUser();
  const parsed = updateEmployeeSchema.safeParse(raw);
  if (!parsed.success) return { ok: false, error: fromZodError(parsed.error) };
  const result = await updateEmployee(parsed.data);
  if (result.ok) revalidate();
  return result;
}

export async function setEmployeeActiveAction(
  raw: unknown,
): Promise<Result<Employee>> {
  await requireUser();
  const parsed = setEmployeeActiveSchema.safeParse(raw);
  if (!parsed.success) return { ok: false, error: fromZodError(parsed.error) };
  const result = await setEmployeeActive(parsed.data);
  if (result.ok) revalidate();
  return result;
}

// ── Payments ─────────────────────────────────────────────────────────────────

export async function payNamedAction(
  raw: unknown,
): Promise<Result<SalaryPayment>> {
  await requireUser();
  const parsed = namedPaymentSchema.safeParse(raw);
  if (!parsed.success) return { ok: false, error: fromZodError(parsed.error) };
  const result = await payNamed(parsed.data);
  if (result.ok) revalidate();
  return result;
}

export async function payLumpAction(
  raw: unknown,
): Promise<Result<SalaryPayment>> {
  await requireUser();
  const parsed = lumpPaymentSchema.safeParse(raw);
  if (!parsed.success) return { ok: false, error: fromZodError(parsed.error) };
  const result = await payLump(parsed.data);
  if (result.ok) revalidate();
  return result;
}

export async function updatePaymentAction(
  raw: unknown,
): Promise<Result<SalaryPayment>> {
  await requireUser();
  const parsed = updatePaymentSchema.safeParse(raw);
  if (!parsed.success) return { ok: false, error: fromZodError(parsed.error) };
  const result = await updatePayment(parsed.data);
  if (result.ok) revalidate();
  return result;
}

export async function deletePaymentAction(
  raw: unknown,
): Promise<Result<true>> {
  await requireUser();
  const parsed = paymentIdSchema.safeParse(raw);
  if (!parsed.success) return { ok: false, error: fromZodError(parsed.error) };
  const result = await deletePayment(parsed.data.id);
  if (result.ok) revalidate();
  return result;
}

// ── Advances ─────────────────────────────────────────────────────────────────

export async function createAdvanceAction(
  raw: unknown,
): Promise<Result<Advance>> {
  await requireUser();
  const parsed = createAdvanceSchema.safeParse(raw);
  if (!parsed.success) return { ok: false, error: fromZodError(parsed.error) };
  const result = await createAdvance(parsed.data);
  if (result.ok) revalidate();
  return result;
}

export async function deleteAdvanceAction(
  raw: unknown,
): Promise<Result<true>> {
  await requireUser();
  const parsed = advanceIdSchema.safeParse(raw);
  if (!parsed.success) return { ok: false, error: fromZodError(parsed.error) };
  const result = await deleteAdvance(parsed.data.id);
  if (result.ok) revalidate();
  return result;
}
