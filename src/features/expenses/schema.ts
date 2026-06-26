// Zod schemas for the Expenses feature. Money is integer fils; enums reuse @/lib/enums.
// Messages are plain Arabic (surface to the owner via FormError + toast).
import { z } from "zod";
import { ScopeSchema } from "@/lib/enums";

/** Create one expense. `amountFils` is integer minor units (fils). */
export const createExpenseSchema = z.object({
  date: z.coerce.date(),
  amountFils: z
    .number({ error: "أدخل مبلغاً صحيحاً" })
    .int("أدخل مبلغاً صحيحاً")
    .positive("المبلغ يجب أن يكون أكبر من صفر"),
  categoryId: z.string().min(1, "اختر التصنيف"),
  scope: ScopeSchema,
  cropId: z.string().min(1).nullable().optional(),
  vendor: z.string().trim().max(120).nullable().optional(),
  note: z.string().trim().max(500).nullable().optional(),
});
export type CreateExpenseInput = z.infer<typeof createExpenseSchema>;

/** Edit an existing expense (same fields + id). */
export const updateExpenseSchema = createExpenseSchema.extend({
  id: z.string().min(1),
});
export type UpdateExpenseInput = z.infer<typeof updateExpenseSchema>;

/** Reference an expense by id (delete). */
export const expenseIdSchema = z.object({ id: z.string().min(1) });
export type ExpenseIdInput = z.infer<typeof expenseIdSchema>;

// ── Custom categories (kind = "EXPENSE", isSystem = false) ───────────────────

export const createCategorySchema = z.object({
  nameAr: z.string().trim().min(1, "أدخل اسم التصنيف").max(60),
});
export type CreateCategoryInput = z.infer<typeof createCategorySchema>;

export const renameCategorySchema = z.object({
  id: z.string().min(1),
  nameAr: z.string().trim().min(1, "أدخل اسم التصنيف").max(60),
});
export type RenameCategoryInput = z.infer<typeof renameCategorySchema>;

export const categoryIdSchema = z.object({ id: z.string().min(1) });
export type CategoryIdInput = z.infer<typeof categoryIdSchema>;

// ── Recurring expense templates (optional; off by default) ───────────────────

export const recurringExpenseSchema = z.object({
  nameAr: z.string().trim().min(1, "أدخل اسم المصروف الثابت").max(80),
  amountFils: z
    .number({ error: "أدخل مبلغاً صحيحاً" })
    .int("أدخل مبلغاً صحيحاً")
    .positive("المبلغ يجب أن يكون أكبر من صفر"),
  categoryId: z.string().min(1, "اختر التصنيف"),
  scope: ScopeSchema,
  dayOfMonth: z
    .number({ error: "أدخل يوماً من 1 إلى 31" })
    .int()
    .min(1, "أدخل يوماً من 1 إلى 31")
    .max(31, "أدخل يوماً من 1 إلى 31"),
  isActive: z.boolean().optional().default(false),
});
export type RecurringExpenseInput = z.infer<typeof recurringExpenseSchema>;

export const updateRecurringSchema = recurringExpenseSchema.extend({
  id: z.string().min(1),
});
export type UpdateRecurringInput = z.infer<typeof updateRecurringSchema>;

export const recurringIdSchema = z.object({ id: z.string().min(1) });
export type RecurringIdInput = z.infer<typeof recurringIdSchema>;
