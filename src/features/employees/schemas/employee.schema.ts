// Zod schemas for employees. Money is integer fils. Messages are plain Arabic.
import { z } from "zod";

/** Pay type — local to this feature (not a shared enum). */
export const PAY_TYPE = ["MONTHLY", "DAILY"] as const;
export type PayType = (typeof PAY_TYPE)[number];
export const PayTypeSchema = z.enum(PAY_TYPE);

const optionalRateFils = z
  .number({ error: "أدخل مبلغاً صحيحاً" })
  .int("أدخل مبلغاً صحيحاً")
  .positive("المبلغ يجب أن يكون أكبر من صفر")
  .nullable()
  .optional();

/**
 * Create an employee. MONTHLY workers must have a monthly salary; DAILY workers
 * must have a daily rate (validated by the refine).
 */
export const createEmployeeSchema = z
  .object({
    name: z.string().trim().min(1, "أدخل اسم العامل").max(120),
    payType: PayTypeSchema,
    monthlySalaryFils: optionalRateFils,
    dailyRateFils: optionalRateFils,
    phone: z.string().trim().max(40).nullable().optional(),
    note: z.string().trim().max(500).nullable().optional(),
  })
  .refine(
    (v) => v.payType !== "MONTHLY" || (v.monthlySalaryFils ?? 0) > 0,
    { message: "أدخل الراتب الشهري", path: ["monthlySalaryFils"] },
  )
  .refine(
    (v) => v.payType !== "DAILY" || (v.dailyRateFils ?? 0) > 0,
    { message: "أدخل الأجر اليومي", path: ["dailyRateFils"] },
  );
export type CreateEmployeeInput = z.infer<typeof createEmployeeSchema>;

/** Edit an existing employee (same fields + id). */
export const updateEmployeeSchema = z
  .object({
    id: z.string().min(1),
    name: z.string().trim().min(1, "أدخل اسم العامل").max(120),
    payType: PayTypeSchema,
    monthlySalaryFils: optionalRateFils,
    dailyRateFils: optionalRateFils,
    phone: z.string().trim().max(40).nullable().optional(),
    note: z.string().trim().max(500).nullable().optional(),
  })
  .refine(
    (v) => v.payType !== "MONTHLY" || (v.monthlySalaryFils ?? 0) > 0,
    { message: "أدخل الراتب الشهري", path: ["monthlySalaryFils"] },
  )
  .refine(
    (v) => v.payType !== "DAILY" || (v.dailyRateFils ?? 0) > 0,
    { message: "أدخل الأجر اليومي", path: ["dailyRateFils"] },
  );
export type UpdateEmployeeInput = z.infer<typeof updateEmployeeSchema>;

/** Toggle an employee's active flag (soft enable/disable). */
export const setEmployeeActiveSchema = z.object({
  id: z.string().min(1),
  isActive: z.boolean(),
});
export type SetEmployeeActiveInput = z.infer<typeof setEmployeeActiveSchema>;

/** Reference an employee by id. */
export const employeeIdSchema = z.object({ id: z.string().min(1) });
export type EmployeeIdInput = z.infer<typeof employeeIdSchema>;
