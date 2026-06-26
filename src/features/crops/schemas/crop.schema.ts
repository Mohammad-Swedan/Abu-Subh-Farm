// Zod schemas for managing crops (المحاصيل). A crop is just a named tag used by
// sales/expenses, so the only editable field is its Arabic name.
import { z } from "zod";

/** Create one crop. */
export const createCropSchema = z.object({
  nameAr: z
    .string({ error: "أدخل اسم المحصول" })
    .trim()
    .min(1, "أدخل اسم المحصول")
    .max(60, "الاسم طويل جداً"),
});
export type CreateCropInput = z.infer<typeof createCropSchema>;

/** Rename an existing crop. */
export const updateCropSchema = createCropSchema.extend({
  id: z.string().min(1),
});
export type UpdateCropInput = z.infer<typeof updateCropSchema>;

/** Activate / deactivate a crop (crops are never hard-deleted — they're
 *  referenced by sales/expenses, so we keep them and just hide inactive ones). */
export const setCropActiveSchema = z.object({
  id: z.string().min(1),
  isActive: z.boolean(),
});
export type SetCropActiveInput = z.infer<typeof setCropActiveSchema>;
