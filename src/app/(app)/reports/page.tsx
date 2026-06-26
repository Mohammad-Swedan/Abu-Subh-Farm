import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/db/prisma";
import { PERIODS, type Period, getRange, type DateRange } from "@/lib/dates";
import { PageHeader } from "@/components/shared";
import { getReport } from "@/server/reporting.service";
import type { ReportScope } from "@/server/reporting.types";
import { ReportScreen } from "@/components/shared/reports";

type SearchParams = Record<string, string | string[] | undefined>;

const DEFAULT_PERIOD: Period = "month";
const DEFAULT_SCOPE: ReportScope = "ALL";
const SCOPES: readonly ReportScope[] = ["FARM", "PERSONAL", "ALL"];

function first(value: string | string[] | undefined): string | undefined {
  return Array.isArray(value) ? value[0] : value;
}

function parsePeriod(value: string | undefined): Period {
  return value && (PERIODS as readonly string[]).includes(value)
    ? (value as Period)
    : DEFAULT_PERIOD;
}

function parseScope(value: string | undefined): ReportScope {
  return value && (SCOPES as readonly string[]).includes(value)
    ? (value as ReportScope)
    : DEFAULT_SCOPE;
}

function parseDate(value: string | undefined): Date | undefined {
  if (!value) return undefined;
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? undefined : d;
}

/**
 * Reports screen — server component. Reads the period/scope/category/crop filter
 * from the URL, aggregates the report straight from the ledger via the reporting
 * service, loads the filter options, and renders the client shell. All money is
 * integer fils.
 */
export default async function ReportsPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  await requireUser();
  const sp = await searchParams;

  const period = parsePeriod(first(sp.period));
  const scope = parseScope(first(sp.scope));
  const categoryId = first(sp.category);
  const cropId = first(sp.crop);
  const fromRaw = first(sp.from);
  const toRaw = first(sp.to);

  let custom: DateRange | undefined;
  if (period === "custom") {
    const from = parseDate(fromRaw);
    const to = parseDate(toRaw);
    if (from && to) custom = { start: from, end: to };
  }

  const range = getRange(period, new Date(), custom);

  const [report, categories, crops] = await Promise.all([
    getReport({ range, scope, categoryId, cropId }),
    prisma.category.findMany({
      where: { kind: { in: ["EXPENSE", "BOTH"] } },
      orderBy: { sortOrder: "asc" },
      select: { id: true, nameAr: true },
    }),
    prisma.crop.findMany({
      where: { isActive: true },
      orderBy: { nameAr: "asc" },
      select: { id: true, nameAr: true },
    }),
  ]);

  return (
    <div className="space-y-4">
      <PageHeader
        title="التقارير"
        description="ملخّص الدخل والمصاريف والأرباح حسب الفترة."
      />
      <ReportScreen
        report={report}
        period={period}
        scope={scope}
        categoryId={categoryId}
        cropId={cropId}
        from={fromRaw}
        to={toRaw}
        categories={categories}
        crops={crops}
      />
    </div>
  );
}
