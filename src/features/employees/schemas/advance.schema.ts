// Zod schemas for advances (سلف). Money is integer fils. Optional feature.
import { z } from "zod";

/** Record an advance given to an employee (real labor cash out). */
export const createAdvanceSchema = z.object({
  employeeId: z.string().min(1, "اختر العامل"),
  amountFils: z
    .number({ error: "أدخل المبلغ" })
    .int("أدخل مبلغاً صحيحاً")
    .positive("المبلغ يجب أن يكون أكبر من صفر"),
  date: z.coerce.date(),
  note: z.string().trim().max(500).nullable().optional(),
});
export type CreateAdvanceInput = z.infer<typeof createAdvanceSchema>;

/** Reference an advance by id (delete). */
export const advanceIdSchema = z.object({ id: z.string().min(1) });
export type AdvanceIdInput = z.infer<typeof advanceIdSchema>;
