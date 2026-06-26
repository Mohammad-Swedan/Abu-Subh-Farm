import { cookies } from "next/headers";
import { requireUser } from "@/lib/auth";
import { PERIODS, type Period, getRange, type DateRange } from "@/lib/dates";
import { PageHeader } from "@/components/shared";
import {
  listEmployees,
  listEmployeeOptions,
  outstandingByEmployee,
  listPayments,
  sumPaymentsFils,
  listAdvances,
} from "@/features/employees/server/employees.repository";
import { EmployeesScreen } from "@/features/employees/components/employees-screen";
import { DEFAULT_PERIOD, QP, ADVANCES_COOKIE, COPY } from "@/features/employees/constants";
import type { PaymentFilter } from "@/features/employees/types";

type SearchParams = Record<string, string | string[] | undefined>;

function first(value: string | string[] | undefined): string | undefined {
  return Array.isArray(value) ? value[0] : value;
}

function parsePeriod(value: string | undefined): Period {
  return value && (PERIODS as readonly string[]).includes(value)
    ? (value as Period)
    : DEFAULT_PERIOD;
}

function parseDate(value: string | undefined): Date | undefined {
  if (!value) return undefined;
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? undefined : d;
}

/** Employees & Payroll screen — server component. Reads the period filter + the
 *  advances toggle (cookie) from the request, loads employees, payments, totals,
 *  and advances, and renders the client shell. Money flows as integer fils. */
export default async function EmployeesPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  await requireUser();
  const sp = await searchParams;

  const cookieStore = await cookies();
  const advancesEnabled = cookieStore.get(ADVANCES_COOKIE)?.value === "1";

  const period = parsePeriod(first(sp[QP.period]));
  const autoOpenAdd = first(sp[QP.new]) === "1";

  let custom: DateRange | undefined;
  if (period === "custom") {
    const from = parseDate(first(sp[QP.from]));
    const to = parseDate(first(sp[QP.to]));
    if (from && to) custom = { start: from, end: to };
  }

  const { start, end } = getRange(period, new Date(), custom);
  const filter: PaymentFilter = { start, end };

  const [
    employees,
    employeeOptions,
    outstanding,
    payments,
    paymentsTotalFils,
    advances,
  ] = await Promise.all([
    listEmployees(),
    listEmployeeOptions(),
    outstandingByEmployee(),
    listPayments(filter),
    sumPaymentsFils(filter),
    listAdvances(),
  ]);

  return (
    <div className="space-y-4">
      <PageHeader title={COPY.title} description={COPY.subtitle} />
      <EmployeesScreen
        employees={employees}
        employeeOptions={employeeOptions}
        outstanding={outstanding}
        payments={payments}
        paymentsTotalFils={paymentsTotalFils}
        advances={advances}
        period={period}
        advancesEnabled={advancesEnabled}
        autoOpenAdd={autoOpenAdd}
      />
    </div>
  );
}
