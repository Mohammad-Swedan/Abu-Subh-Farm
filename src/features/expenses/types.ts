// Shared types for the Expenses feature. Prisma row shapes + view-model helpers.
import type { Expense, Category, Crop, RecurringExpense } from "@prisma/client";
import type { Scope } from "@/lib/enums";

/** An expense row with the relations the list/item UI needs. */
export type ExpenseWithRelations = Expense & {
  category: Category;
  crop: Crop | null;
};

/** Minimal option shapes passed from the server page into client pickers. */
export type CategoryOption = { id: string; nameAr: string; isSystem: boolean };
export type CropOption = { id: string; nameAr: string };

/** Filter used by the repository reads. `start`/`end` come from getRange(). */
export type ExpenseFilter = {
  start: Date;
  end: Date;
  categoryId?: string;
  scope?: Scope;
  /** Free-text search over vendor + note (and category name). */
  q?: string;
};

/** Expenses bucketed by calendar day (newest day first) for the grouped list. */
export type ExpenseDayGroup = {
  dayKey: string; // yyyy-MM-dd (local)
  date: Date;
  totalFils: number;
  items: ExpenseWithRelations[];
};

/** A recurring template with its category, for the manager UI. */
export type RecurringWithCategory = RecurringExpense & { category: Category };

/** Result of "post due recurring": how many templates fired this run. */
export type PostDueResult = { postedCount: number };
