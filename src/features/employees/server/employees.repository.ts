// Employees repository — pure Prisma reads.
// NO ledger logic, NO Result wrapping, NO "use server". Business rules live in the service.
import type { Employee } from "@prisma/client";
import { prisma } from "@/lib/db/prisma";
import type {
  PaymentWithEmployee,
  AdvanceWithEmployee,
  EmployeeOption,
  OutstandingByEmployee,
  PaymentFilter,
  PayType,
} from "../types";

/** All employees, active first, then alphabetical. */
export async function listEmployees(): Promise<Employee[]> {
  return prisma.employee.findMany({
    orderBy: [{ isActive: "desc" }, { name: "asc" }],
  });
}

/** Load a single employee, or null. */
export async function getEmployeeById(id: string): Promise<Employee | null> {
  return prisma.employee.findUnique({ where: { id } });
}

/**
 * Outstanding (unsettled) advance balance per employee, keyed by employee id.
 * Sums (amountFils − settledAmountFils) over unsettled advances; only positive remainders kept.
 */
export async function outstandingByEmployee(): Promise<OutstandingByEmployee> {
  const advances = await prisma.advance.findMany({
    where: { isSettled: false },
    select: { employeeId: true, amountFils: true, settledAmountFils: true },
  });
  return advances.reduce<OutstandingByEmployee>((acc, a) => {
    const remaining = a.amountFils - a.settledAmountFils;
    if (remaining > 0) {
      acc[a.employeeId] = (acc[a.employeeId] ?? 0) + remaining;
    }
    return acc;
  }, {});
}

/** Active employees as pay/advance picker options, with their outstanding advance balance. */
export async function listEmployeeOptions(): Promise<EmployeeOption[]> {
  const [employees, outstanding] = await Promise.all([
    prisma.employee.findMany({
      where: { isActive: true },
      orderBy: { name: "asc" },
      select: {
        id: true,
        name: true,
        payType: true,
        monthlySalaryFils: true,
        dailyRateFils: true,
      },
    }),
    outstandingByEmployee(),
  ]);
  return employees.map((e) => ({
    id: e.id,
    name: e.name,
    payType: e.payType as PayType,
    monthlySalaryFils: e.monthlySalaryFils,
    dailyRateFils: e.dailyRateFils,
    outstandingFils: outstanding[e.id] ?? 0,
  }));
}

/** Salary payments in range (newest first), each with its (optional) named employee. */
export async function listPayments(
  filter: PaymentFilter,
): Promise<PaymentWithEmployee[]> {
  return prisma.salaryPayment.findMany({
    where: { date: { gte: filter.start, lte: filter.end } },
    include: { employee: true },
    orderBy: [{ date: "desc" }, { createdAt: "desc" }],
  });
}

/** Sum amountFils for payments in range. Returns 0 when there are none. */
export async function sumPaymentsFils(filter: PaymentFilter): Promise<number> {
  const agg = await prisma.salaryPayment.aggregate({
    _sum: { amountFils: true },
    where: { date: { gte: filter.start, lte: filter.end } },
  });
  return agg._sum.amountFils ?? 0;
}

/** Load a single payment with its (optional) employee, or null. */
export async function getPaymentById(
  id: string,
): Promise<PaymentWithEmployee | null> {
  return prisma.salaryPayment.findUnique({
    where: { id },
    include: { employee: true },
  });
}

/**
 * All advances with their owning employee — unsettled first, then newest.
 * NOTE: the Advance model has no `createdAt`, so `id` is the stable tiebreaker.
 */
export async function listAdvances(): Promise<AdvanceWithEmployee[]> {
  return prisma.advance.findMany({
    include: { employee: true },
    orderBy: [{ isSettled: "asc" }, { date: "desc" }, { id: "desc" }],
  });
}

/** Remaining unsettled advance balance for one employee. */
export async function getEmployeeOutstanding(
  employeeId: string,
): Promise<number> {
  const advances = await prisma.advance.findMany({
    where: { employeeId, isSettled: false },
    select: { amountFils: true, settledAmountFils: true },
  });
  return advances.reduce(
    (sum, a) => sum + (a.amountFils - a.settledAmountFils),
    0,
  );
}
