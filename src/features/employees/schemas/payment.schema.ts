// Zod schemas for salary payments. Money is integer fils.
// Named payments: amountFils is the GROSS pay; deductFils is an optional advance
// deduction (netting). Lump entries (seasonal crew) carry workersCount, no employee.
import { z } from "zod";

/** Named payment to a specific employee. amountFils = gross; deductFils = advance netting. */
export const namedPaymentSchema = z.object({
  employeeId: z.string().min(1, "اختر العامل"),
  amountFils: z
    .number({ error: "أدخل المبلغ" })
    .int("أدخل مبلغاً صحيحاً")
    .positive("المبلغ يجب أن يكون أكبر من صفر"),
  date: z.coerce.date(),
  periodLabel: z.string().trim().max(120).nullable().optional(),
  note: z.string().trim().max(500).nullable().optional(),
  deductFils: z
    .number({ error: "أدخل مبلغاً صحيحاً" })
    .int("أدخل مبلغاً صحيحاً")
    .min(0, "لا يمكن أن يكون الخصم سالباً")
    .nullable()
    .optional(),
});
export type NamedPaymentInput = z.infer<typeof namedPaymentSchema>;

/** Lump seasonal entry: a day's crew labor cost, no named employee. */
export const lumpPaymentSchema = z.object({
  workersCount: z
    .number({ error: "أدخل عدد العمال" })
    .int("أدخل عدداً صحيحاً")
    .positive("عدد العمال يجب أن يكون أكبر من صفر"),
  amountFils: z
    .number({ error: "أدخل المبلغ" })
    .int("أدخل مبلغاً صحيحاً")
    .positive("المبلغ يجب أن يكون أكبر من صفر"),
  date: z.coerce.date(),
  periodLabel: z.string().trim().min(1, "أدخل وصف العمل").max(120),
  note: z.string().trim().max(500).nullable().optional(),
});
export type LumpPaymentInput = z.infer<typeof lumpPaymentSchema>;

/** Edit a payment in place (named or lump). No advance netting on edit. */
export const updatePaymentSchema = z.object({
  id: z.string().min(1),
  amountFils: z
    .number({ error: "أدخل المبلغ" })
    .int("أدخل مبلغاً صحيحاً")
    .positive("المبلغ يجب أن يكون أكبر من صفر"),
  date: z.coerce.date(),
  periodLabel: z.string().trim().max(120).nullable().optional(),
  note: z.string().trim().max(500).nullable().optional(),
});
export type UpdatePaymentInput = z.infer<typeof updatePaymentSchema>;

/** Reference a payment by id (delete). */
export const paymentIdSchema = z.object({ id: z.string().min(1) });
export type PaymentIdInput = z.infer<typeof paymentIdSchema>;
