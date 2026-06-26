import { requireUser } from "@/lib/auth";
import { PERIODS, type Period, getRange, type DateRange } from "@/lib/dates";
import { PageHeader } from "@/components/shared";
import {
  listSales,
  sumSalesNetFils,
  listActiveCrops,
} from "@/features/income/server/income.repository";
import { IncomeScreen } from "@/features/income/components/income-screen";
import { DEFAULT_PERIOD, COPY, QP } from "@/features/income/constants";
import type { SaleFilter } from "@/features/income/types";

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

/** Income (sales) screen — server component. Reads the period/crop filter from the
 *  URL, loads the matching sales + period total + crops from the repository, and
 *  renders the client shell. Money flows as integer fils throughout. */
export default async function IncomePage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  await requireUser();
  const sp = await searchParams;

  const period = parsePeriod(first(sp[QP.period]));
  const cropId = first(sp[QP.crop]);
  const autoOpenAdd = first(sp[QP.new]) === "1";

  let custom: DateRange | undefined;
  if (period === "custom") {
    const from = parseDate(first(sp[QP.from]));
    const to = parseDate(first(sp[QP.to]));
    if (from && to) custom = { start: from, end: to };
  }

  const { start, end } = getRange(period, new Date(), custom);
  const filter: SaleFilter = { start, end, cropId };

  const [sales, totalFils, crops] = await Promise.all([
    listSales(filter),
    sumSalesNetFils(filter),
    listActiveCrops(),
  ]);

  return (
    <div className="space-y-4">
      <PageHeader title={COPY.title} description={COPY.subtitle} />
      <IncomeScreen
        sales={sales}
        totalFils={totalFils}
        crops={crops}
        period={period}
        cropId={cropId}
        autoOpenAdd={autoOpenAdd}
      />
    </div>
  );
}
