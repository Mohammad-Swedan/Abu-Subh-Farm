// Cross-cutting REPORTING SERVICE — the single aggregation surface for the
// dashboard and the reports screen.
//
// It depends ONLY on the shared Prisma client + the shared ledger service. It
// imports NO feature code: every money number is derived from `LedgerEntry`, the
// single source of truth, so the dashboard and reports always agree with each
// feature's own totals. All money is integer fils.
import { endOfMonth, format, startOfMonth, subMonths } from "date-fns";
import { ar } from "date-fns/locale";

import { prisma } from "@/lib/db/prisma";
import { getLedgerEntries } from "@/lib/ledger/ledger.service";
import { ledgerSourceLabels } from "@/lib/enums";
import type { Direction, LedgerSource, Unit } from "@/lib/enums";

import type {
  ActivityItem,
  BreakdownSlice,
  CropSlice,
  LowStockItem,
  MonthlyCashFlow,
  ReportData,
  ReportFilter,
} from "./reporting.types";

// Synthetic breakdown buckets for OUT entries that carry no categoryId.
const SALARY_BUCKET_KEY = "SALARY";
const UNCATEGORIZED_KEY = "UNCATEGORIZED";
const SALARY_LABEL = "الأجور";
const UNCATEGORIZED_LABEL = "أخرى";

/**
 * Aggregate a full report for a range + filter combination, driven entirely by
 * the ledger. Scope/category/crop filters narrow the underlying entry set, so the
 * totals and profit are correct for ANY combination.
 */
export async function getReport(filter: ReportFilter): Promise<ReportData> {
  const { range, scope, categoryId, cropId } = filter;

  const entries = await getLedgerEntries({
    start: range.start,
    end: range.end,
    scope: scope === "ALL" ? undefined : scope,
    categoryId,
    cropId,
  });

  let farmIn = 0;
  let farmOut = 0;
  let personalIn = 0;
  let personalOut = 0;
  let salary = 0;

  const catTotals = new Map<string, number>(); // OUT only, by category/bucket key
  const cropTotals = new Map<string, number>(); // IN ∧ SALE only, by cropId

  for (const e of entries) {
    const isFarm = e.scope === "FARM";

    if (e.direction === "IN") {
      if (isFarm) farmIn += e.amountFils;
      else personalIn += e.amountFils;

      if (e.source === "SALE" && e.cropId) {
        cropTotals.set(e.cropId, (cropTotals.get(e.cropId) ?? 0) + e.amountFils);
      }
      continue;
    }

    // OUT
    if (isFarm) farmOut += e.amountFils;
    else personalOut += e.amountFils;
    if (isFarm && e.source === "SALARY") salary += e.amountFils;

    const key =
      e.categoryId ??
      (e.source === "SALARY" ? SALARY_BUCKET_KEY : UNCATEGORIZED_KEY);
    catTotals.set(key, (catTotals.get(key) ?? 0) + e.amountFils);
  }

  // Resolve Arabic names for the real categories/crops that appeared.
  const realCategoryIds = [...catTotals.keys()].filter(
    (k) => k !== SALARY_BUCKET_KEY && k !== UNCATEGORIZED_KEY,
  );
  const cropIds = [...cropTotals.keys()];

  const [cats, crops] = await Promise.all([
    realCategoryIds.length
      ? prisma.category.findMany({
          where: { id: { in: realCategoryIds } },
          select: { id: true, nameAr: true },
        })
      : Promise.resolve([] as { id: string; nameAr: string }[]),
    cropIds.length
      ? prisma.crop.findMany({
          where: { id: { in: cropIds } },
          select: { id: true, nameAr: true },
        })
      : Promise.resolve([] as { id: string; nameAr: string }[]),
  ]);

  const catName = new Map(cats.map((c) => [c.id, c.nameAr]));
  const cropName = new Map(crops.map((c) => [c.id, c.nameAr]));

  const totalOut = [...catTotals.values()].reduce((a, b) => a + b, 0);

  const categoryBreakdown: BreakdownSlice[] = [...catTotals.entries()]
    .map(([key, fils]) => ({
      key,
      label:
        key === SALARY_BUCKET_KEY
          ? SALARY_LABEL
          : key === UNCATEGORIZED_KEY
            ? UNCATEGORIZED_LABEL
            : (catName.get(key) ?? UNCATEGORIZED_LABEL),
      fils,
      pct: totalOut > 0 ? Math.round((fils / totalOut) * 100) : 0,
    }))
    .sort((a, b) => b.fils - a.fils);

  const cropBreakdown: CropSlice[] = [...cropTotals.entries()]
    .map(([cropId2, fils]) => ({
      cropId: cropId2,
      label: cropName.get(cropId2) ?? UNCATEGORIZED_LABEL,
      fils,
    }))
    .sort((a, b) => b.fils - a.fils);

  return {
    incomeFils: farmIn,
    expenseFils: farmOut - salary,
    salaryFils: salary,
    profitFils: farmIn - farmOut,
    personalInFils: personalIn,
    personalOutFils: personalOut,
    totalCashInFils: farmIn + personalIn,
    totalCashOutFils: farmOut + personalOut,
    categoryBreakdown,
    cropBreakdown,
  };
}

/**
 * Cash IN vs OUT bucketed by month for the last `months` months (default 12),
 * oldest → newest, for the dashboard trend chart. One ledger query.
 */
export async function getMonthlyCashFlow(
  months = 12,
): Promise<MonthlyCashFlow[]> {
  const now = new Date();
  const start = startOfMonth(subMonths(now, months - 1));
  const end = endOfMonth(now);

  const entries = await getLedgerEntries({ start, end });

  const buckets = new Map<string, { date: Date; inFils: number; outFils: number }>();
  for (let i = 0; i < months; i++) {
    const d = startOfMonth(subMonths(now, months - 1 - i));
    buckets.set(format(d, "yyyy-MM"), { date: d, inFils: 0, outFils: 0 });
  }

  for (const e of entries) {
    const bucket = buckets.get(format(e.date, "yyyy-MM"));
    if (!bucket) continue;
    if (e.direction === "IN") bucket.inFils += e.amountFils;
    else bucket.outFils += e.amountFils;
  }

  return [...buckets.entries()].map(([key, b]) => ({
    key,
    label: format(b.date, "MMM", { locale: ar }),
    inFils: b.inFils,
    outFils: b.outFils,
  }));
}

/** Active inventory items at or below their low-stock threshold (alphabetical). */
export async function getLowStockItems(): Promise<LowStockItem[]> {
  const items = await prisma.inventoryItem.findMany({
    where: { isActive: true, lowStockThreshold: { not: null } },
    select: {
      id: true,
      nameAr: true,
      unit: true,
      quantityOnHand: true,
      lowStockThreshold: true,
    },
    orderBy: { nameAr: "asc" },
  });

  return items
    .filter(
      (i) => i.lowStockThreshold != null && i.quantityOnHand <= i.lowStockThreshold,
    )
    .map((i) => ({
      id: i.id,
      nameAr: i.nameAr,
      unit: i.unit as Unit,
      quantityOnHand: i.quantityOnHand,
      lowStockThreshold: i.lowStockThreshold as number,
    }));
}

/** Latest ledger movements mapped to a human-readable activity feed. */
export async function getRecentActivity(limit = 8): Promise<ActivityItem[]> {
  const entries = await prisma.ledgerEntry.findMany({
    orderBy: [{ date: "desc" }, { createdAt: "desc" }],
    take: limit,
    include: {
      category: { select: { nameAr: true } },
      crop: { select: { nameAr: true } },
    },
  });

  return entries.map((e) => {
    const source = e.source as LedgerSource;
    const label =
      e.note?.trim() ||
      e.category?.nameAr ||
      e.crop?.nameAr ||
      ledgerSourceLabels[source];
    return {
      id: e.id,
      date: e.date,
      direction: e.direction as Direction,
      source,
      label,
      amountFils: e.amountFils,
    };
  });
}
