import { requireUser } from "@/lib/auth";
import { PERIODS, type Period, getRange, type DateRange } from "@/lib/dates";
import { Scope } from "@/lib/enums";
import { parsePage, parseSearch, pageSlice, pageCountOf } from "@/lib/pagination";
import { PageHeader } from "@/components/shared";
import {
  listExpenses,
  countExpenses,
  sumExpensesFils,
  listExpenseCategories,
  listActiveCrops,
  listRecurring,
} from "@/features/expenses/server/expenses.repository";
import { ExpensesScreen } from "@/features/expenses/components/expenses-screen";
import { DEFAULT_PERIOD, COPY, QP } from "@/features/expenses/constants";
import type { ExpenseFilter } from "@/features/expenses/types";

type SearchParams = Record<string, string | string[] | undefined>;

function first(value: string | string[] | undefined): string | undefined {
  return Array.isArray(value) ? value[0] : value;
}

function parsePeriod(value: string | undefined): Period {
  return value && (PERIODS as readonly string[]).includes(value)
    ? (value as Period)
    : DEFAULT_PERIOD;
}

function parseScope(value: string | undefined): Scope | undefined {
  return value && (Scope as readonly string[]).includes(value)
    ? (value as Scope)
    : undefined;
}

function parseDate(value: string | undefined): Date | undefined {
  if (!value) return undefined;
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? undefined : d;
}

/** Expenses screen — server component. Reads the period/filters from the URL, loads
 *  the matching expenses + period total + pickers from the repository, and renders
 *  the client shell. Money flows as integer fils throughout. */
export default async function ExpensesPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  await requireUser();
  const sp = await searchParams;

  const period = parsePeriod(first(sp[QP.period]));
  const categoryId = first(sp[QP.category]);
  const scope = parseScope(first(sp[QP.scope]));
  const q = parseSearch(first(sp.q));
  const requestedPage = parsePage(first(sp.page));
  const autoOpenAdd = first(sp[QP.new]) === "1";

  let custom: DateRange | undefined;
  if (period === "custom") {
    const from = parseDate(first(sp[QP.from]));
    const to = parseDate(first(sp[QP.to]));
    if (from && to) custom = { start: from, end: to };
  }

  const { start, end } = getRange(period, new Date(), custom);
  const filter: ExpenseFilter = { start, end, categoryId, scope, q };

  const [total, totalFils, categories, crops, recurring] = await Promise.all([
    countExpenses(filter),
    sumExpensesFils(filter),
    listExpenseCategories(),
    listActiveCrops(),
    listRecurring(),
  ]);

  const { page, skip, take } = pageSlice(requestedPage, total);
  const pageCount = pageCountOf(total);
  const expenses = await listExpenses(filter, { skip, take });

  return (
    <div className="space-y-4">
      <PageHeader title={COPY.title} description={COPY.subtitle} />
      <ExpensesScreen
        expenses={expenses}
        totalFils={totalFils}
        categories={categories}
        crops={crops}
        recurring={recurring}
        period={period}
        categoryId={categoryId}
        scope={scope}
        page={page}
        pageCount={pageCount}
        autoOpenAdd={autoOpenAdd}
      />
    </div>
  );
}
