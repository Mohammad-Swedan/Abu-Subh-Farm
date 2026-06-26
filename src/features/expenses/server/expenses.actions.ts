"use server";

// Expenses server actions — thin boundary. Each: requireUser → Zod parse →
// service call → revalidate on success. No business logic lives here.
import { revalidatePath } from "next/cache";
import type { Expense, Category, RecurringExpense } from "@prisma/client";
import { requireUser } from "@/lib/auth";
import { fromZodError, type Result } from "@/lib/result";
import { REVALIDATE_PATHS } from "../constants";
import {
  createExpenseSchema,
  updateExpenseSchema,
  expenseIdSchema,
  createCategorySchema,
  renameCategorySchema,
  categoryIdSchema,
  recurringExpenseSchema,
  updateRecurringSchema,
  recurringIdSchema,
} from "../schema";
import type { PostDueResult } from "../types";
import {
  createExpense,
  updateExpense,
  deleteExpense,
  addExpenseCategory,
  renameExpenseCategory,
  deleteExpenseCategory,
  createRecurring,
  updateRecurring,
  deleteRecurring,
  postDueRecurring,
} from "./expenses.service";

/** Revalidate every route affected by an expenses write (list total + header balance). */
function revalidateExpensePaths(): void {
  for (const path of REVALIDATE_PATHS) revalidatePath(path);
}

export async function createExpenseAction(
  raw: unknown,
): Promise<Result<Expense>> {
  await requireUser();
  const parsed = createExpenseSchema.safeParse(raw);
  if (!parsed.success) return { ok: false, error: fromZodError(parsed.error) };
  const result = await createExpense(parsed.data);
  if (result.ok) revalidateExpensePaths();
  return result;
}

export async function updateExpenseAction(
  raw: unknown,
): Promise<Result<Expense>> {
  await requireUser();
  const parsed = updateExpenseSchema.safeParse(raw);
  if (!parsed.success) return { ok: false, error: fromZodError(parsed.error) };
  const result = await updateExpense(parsed.data);
  if (result.ok) revalidateExpensePaths();
  return result;
}

export async function deleteExpenseAction(raw: unknown): Promise<Result<true>> {
  await requireUser();
  const parsed = expenseIdSchema.safeParse(raw);
  if (!parsed.success) return { ok: false, error: fromZodError(parsed.error) };
  const result = await deleteExpense(parsed.data.id);
  if (result.ok) revalidateExpensePaths();
  return result;
}

export async function createCategoryAction(
  raw: unknown,
): Promise<Result<Category>> {
  await requireUser();
  const parsed = createCategorySchema.safeParse(raw);
  if (!parsed.success) return { ok: false, error: fromZodError(parsed.error) };
  const result = await addExpenseCategory(parsed.data);
  if (result.ok) revalidateExpensePaths();
  return result;
}

export async function renameCategoryAction(
  raw: unknown,
): Promise<Result<Category>> {
  await requireUser();
  const parsed = renameCategorySchema.safeParse(raw);
  if (!parsed.success) return { ok: false, error: fromZodError(parsed.error) };
  const result = await renameExpenseCategory(parsed.data);
  if (result.ok) revalidateExpensePaths();
  return result;
}

export async function deleteCategoryAction(raw: unknown): Promise<Result<true>> {
  await requireUser();
  const parsed = categoryIdSchema.safeParse(raw);
  if (!parsed.success) return { ok: false, error: fromZodError(parsed.error) };
  const result = await deleteExpenseCategory(parsed.data.id);
  if (result.ok) revalidateExpensePaths();
  return result;
}

export async function createRecurringAction(
  raw: unknown,
): Promise<Result<RecurringExpense>> {
  await requireUser();
  const parsed = recurringExpenseSchema.safeParse(raw);
  if (!parsed.success) return { ok: false, error: fromZodError(parsed.error) };
  const result = await createRecurring(parsed.data);
  if (result.ok) revalidateExpensePaths();
  return result;
}

export async function updateRecurringAction(
  raw: unknown,
): Promise<Result<RecurringExpense>> {
  await requireUser();
  const parsed = updateRecurringSchema.safeParse(raw);
  if (!parsed.success) return { ok: false, error: fromZodError(parsed.error) };
  const result = await updateRecurring(parsed.data);
  if (result.ok) revalidateExpensePaths();
  return result;
}

export async function deleteRecurringAction(
  raw: unknown,
): Promise<Result<true>> {
  await requireUser();
  const parsed = recurringIdSchema.safeParse(raw);
  if (!parsed.success) return { ok: false, error: fromZodError(parsed.error) };
  const result = await deleteRecurring(parsed.data.id);
  if (result.ok) revalidateExpensePaths();
  return result;
}

export async function postDueRecurringAction(): Promise<Result<PostDueResult>> {
  await requireUser();
  const result = await postDueRecurring();
  if (result.ok) revalidateExpensePaths();
  return result;
}
