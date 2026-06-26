// Zod schemas for the Income / Sales feature. Money is integer fils.
// netFils (الصافي) is the only REQUIRED money field; the breakdown is optional.
// Messages are plain Arabic (surfaced to the owner via FormError + toast).
import { z } from "zod";

/** Optional non-negative integer fils field (gross/commission/deductions). */
const optionalMoneyFils = z
  .number({ error: "أدخل مبلغاً صحيحاً" })
  .int("أدخل مبلغاً صحيحاً")
  .min(0, "لا يمكن أن يكون المبلغ سالباً")
  .nullable()
  .optional();

/** Create one sale. `netFils` is integer minor units (fils) and required. */
export const createSaleSchema = z.object({
  date: z.coerce.date(),
  netFils: z
    .number({ error: "أدخل مبلغ الصافي" })
    .int("أدخل مبلغاً صحيحاً")
    .positive("المبلغ يجب أن يكون أكبر من صفر"),
  cropId: z.string().min(1).nullable().optional(),
  marketName: z.string().trim().max(120).nullable().optional(),
  quantityKg: z
    .number({ error: "أدخل كمية صحيحة" })
    .positive("الكمية يجب أن تكون أكبر من صفر")
    .nullable()
    .optional(),
  grossFils: optionalMoneyFils,
  commissionFils: optionalMoneyFils,
  otherDeductionsFils: optionalMoneyFils,
  buyer: z.string().trim().max(120).nullable().optional(),
  note: z.string().trim().max(500).nullable().optional(),
});
export type CreateSaleInput = z.infer<typeof createSaleSchema>;

/** Edit an existing sale (same fields + id). */
export const updateSaleSchema = createSaleSchema.extend({
  id: z.string().min(1),
});
export type UpdateSaleInput = z.infer<typeof updateSaleSchema>;

/** Reference a sale by id (delete). */
export const saleIdSchema = z.object({ id: z.string().min(1) });
export type SaleIdInput = z.infer<typeof saleIdSchema>;
