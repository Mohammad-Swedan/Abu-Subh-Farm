// Shared types for the Employees & Payroll feature. Prisma row shapes + view models.
import type {
  Employee,
  SalaryPayment,
  Advance,
} from "@prisma/client";
import type { PayType } from "./schemas/employee.schema";

export type { PayType };

/** A salary payment with its (optional) named employee. Lump entries have null. */
export type PaymentWithEmployee = SalaryPayment & {
  employee: Employee | null;
};

/** An advance with its owning employee (advances always have an employee). */
export type AdvanceWithEmployee = Advance & {
  employee: Employee;
};

/** Minimal employee option for the pay/advance pickers, with outstanding advances. */
export type EmployeeOption = {
  id: string;
  name: string;
  payType: PayType;
  monthlySalaryFils: number | null;
  dailyRateFils: number | null;
  outstandingFils: number;
};

/** Outstanding advance balance keyed by employee id. */
export type OutstandingByEmployee = Record<string, number>;

/** Filter used by the payments reads. `start`/`end` come from getRange(). */
export type PaymentFilter = {
  start: Date;
  end: Date;
  /** Free-text search over employee name + period label + note. */
  q?: string;
};
