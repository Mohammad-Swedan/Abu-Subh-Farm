// Cross-cutting reporting types — shared by the dashboard, reports, and their
// client components. Type-only imports so this file is safe to import from
// "use client" components (it pulls in no server/prisma code).
import type { Direction, LedgerSource, Unit } from "@/lib/enums";

/** Scope filter for a report. "ALL" includes both farm and household cash. */
export type ReportScope = "FARM" | "PERSONAL" | "ALL";

export type ReportRange = { start: Date; end: Date };

export type ReportFilter = {
  range: ReportRange;
  scope: ReportScope;
  /** Optional single-category narrowing (applies to the whole report). */
  categoryId?: string;
  /** Optional single-crop narrowing (applies to the whole report). */
  cropId?: string;
};

/** One slice of the OUT (spending) breakdown. `key` is a categoryId, or the
 *  synthetic "SALARY" / "UNCATEGORIZED" bucket. */
export type BreakdownSlice = {
  key: string;
  label: string;
  fils: number;
  /** Share of total OUT in the report's scope, 0–100 (rounded). */
  pct: number;
};

/** One slice of income grouped by crop (only present when sales are crop-tagged). */
export type CropSlice = {
  cropId: string;
  label: string;
  fils: number;
};

/**
 * Aggregated report for a range + filter combination. All money is integer fils.
 *
 * Profit is a FARM concept: `profitFils = farmIn − farmOut`. PERSONAL cash never
 * enters profit, but stays visible via the personal/total fields below.
 */
export type ReportData = {
  /** Farm cash in (IN ∧ FARM) within the filtered set. */
  incomeFils: number;
  /** Farm non-salary spend (OUT ∧ FARM ∧ ¬SALARY). */
  expenseFils: number;
  /** Farm labor cost (OUT ∧ FARM ∧ SALARY) — salaries, daily crews, advances. */
  salaryFils: number;
  /** incomeFils − (expenseFils + salaryFils) ≡ farmIn − farmOut. */
  profitFils: number;
  /** Household cash in/out (PERSONAL) — shown separately, excluded from profit. */
  personalInFils: number;
  personalOutFils: number;
  /** All-scope cash flow (the family-business reality). */
  totalCashInFils: number;
  totalCashOutFils: number;
  /** OUT grouped by category within the report scope, sorted desc. */
  categoryBreakdown: BreakdownSlice[];
  /** IN (sales) grouped by crop, sorted desc. Empty ⇒ no crops tagged ⇒ hide. */
  cropBreakdown: CropSlice[];
};

/** One month bucket for the dashboard cash-flow trend. */
export type MonthlyCashFlow = {
  key: string; // "2026-06"
  label: string; // short Arabic month
  inFils: number;
  outFils: number;
};

/** An inventory item at or below its low-stock threshold. */
export type LowStockItem = {
  id: string;
  nameAr: string;
  unit: Unit;
  quantityOnHand: number;
  lowStockThreshold: number;
};

/** A human-readable recent ledger movement for the activity feed. */
export type ActivityItem = {
  id: string;
  date: Date;
  direction: Direction;
  source: LedgerSource;
  /** Best human label: note → category/crop name → source label. */
  label: string;
  amountFils: number;
};
