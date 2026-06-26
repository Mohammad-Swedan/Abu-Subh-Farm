// Zod schemas for the Inventory feature. Money is integer fils; quantities are floats.
// Messages are plain Arabic (surfaced to the owner via FormError + toast).
import { z } from "zod";
import { UnitSchema } from "@/lib/enums";

/** Fields for creating a brand-new item inline from the buy form. */
const newItemSchema = z.object({
  nameAr: z.string().trim().min(1, "أدخل اسم الصنف").max(120),
  unit: UnitSchema,
  lowStockThreshold: z
    .number({ error: "أدخل رقماً صحيحاً" })
    .min(0, "لا يمكن أن يكون الحدّ سالباً")
    .nullable()
    .optional(),
});
export type NewItemInput = z.infer<typeof newItemSchema>;

/**
 * Buy an input (شراء). Either an existing `itemId` OR an inline `newItem` must be
 * provided — exactly one. `amountFils` is the money paid (integer fils).
 */
export const buyInputSchema = z
  .object({
    itemId: z.string().min(1).nullable().optional(),
    newItem: newItemSchema.nullable().optional(),
    quantity: z
      .number({ error: "أدخل الكمية" })
      .positive("الكمية يجب أن تكون أكبر من صفر"),
    amountFils: z
      .number({ error: "أدخل المبلغ المدفوع" })
      .int("أدخل مبلغاً صحيحاً")
      .positive("المبلغ يجب أن يكون أكبر من صفر"),
    date: z.coerce.date(),
    vendor: z.string().trim().max(120).nullable().optional(),
    note: z.string().trim().max(500).nullable().optional(),
  })
  .refine(
    (v) => (v.itemId ? !v.newItem : !!v.newItem),
    { message: "اختر صنفاً أو أضف صنفاً جديداً", path: ["itemId"] },
  );
export type BuyInputInput = z.infer<typeof buyInputSchema>;

/** Use/consume stock (صرف / استخدام) — strict OUT tracking, no money movement. */
export const useInputSchema = z.object({
  itemId: z.string().min(1, "اختر الصنف"),
  quantity: z
    .number({ error: "أدخل الكمية" })
    .positive("الكمية يجب أن تكون أكبر من صفر"),
  date: z.coerce.date(),
  note: z.string().trim().max(500).nullable().optional(),
});
export type UseInputInput = z.infer<typeof useInputSchema>;

/** Create an inventory item (stock starts at 0; only transactions move quantity). */
export const createItemSchema = z.object({
  nameAr: z.string().trim().min(1, "أدخل اسم الصنف").max(120),
  unit: UnitSchema,
  lowStockThreshold: z
    .number({ error: "أدخل رقماً صحيحاً" })
    .min(0, "لا يمكن أن يكون الحدّ سالباً")
    .nullable()
    .optional(),
});
export type CreateItemInput = z.infer<typeof createItemSchema>;

/** Edit an existing item (same fields + id). */
export const updateItemSchema = createItemSchema.extend({
  id: z.string().min(1),
});
export type UpdateItemInput = z.infer<typeof updateItemSchema>;

/** Toggle an item's active flag (soft enable/disable). */
export const setItemActiveSchema = z.object({
  id: z.string().min(1),
  isActive: z.boolean(),
});
export type SetItemActiveInput = z.infer<typeof setItemActiveSchema>;

/** Reference an item by id. */
export const itemIdSchema = z.object({ id: z.string().min(1) });
export type ItemIdInput = z.infer<typeof itemIdSchema>;
