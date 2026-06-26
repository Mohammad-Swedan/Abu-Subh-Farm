/**
 * SHARED LEDGER SERVICE
 * =====================
 *
 * This is the single shared write surface for money movements in
 * "مزارع أبو صبح" (Abu Subh Farms).
 *
 * CORE RULE: Every money movement posts EXACTLY ONE `LedgerEntry`, and it does
 * so ATOMICALLY. A feature (Expense, Sale, SalaryPayment, Adjustment, ...) opens
 * a single `prisma.$transaction(...)` and, inside it, creates its own domain row
 * AND calls `postLedgerEntry(tx, ...)` so the domain row and its ledger entry are
 * committed together or not at all.
 *
 * DEPENDENCY RULE: Features depend ONLY on this service for ledger writes/reads —
 * never on each other. This keeps the ledger the single source of truth for cash
 * and prevents cross-feature coupling.
 *
 * MONEY: All amounts are integer minor units ("fils"). There are no floats in the
 * money path. `amountFils` is always a non-negative integer; `direction`
 * ("IN" | "OUT") carries the sign semantics for balance computation.
 *
 * SCHEMA NOTE (cascade): Expense, Sale, and SalaryPayment each own a REQUIRED
 * unique `ledgerEntryId` relation with `onDelete: Cascade`. Deleting a
 * `LedgerEntry` therefore cascade-deletes its owning domain row. This is the
 * intended behavior for a full reversal/delete via `reverseLedgerForRef`.
 */

import { prisma } from "@/lib/db/prisma";
import { Prisma } from "@prisma/client";
import type { Direction, Scope, LedgerSource } from "@/lib/enums";

/** Input for posting a single ledger entry. `amountFils` must be a non-negative integer. */
export type PostLedgerInput = {
  date: Date;
  direction: Direction;
  amountFils: number;
  scope: Scope;
  source: LedgerSource;
  refId?: string | null;
  categoryId?: string | null;
  cropId?: string | null;
  note?: string | null;
};

/**
 * Post exactly ONE ledger entry inside a caller-provided transaction.
 *
 * Takes the transaction client (`tx`) so it composes inside a feature's
 * `prisma.$transaction(...)`, guaranteeing the domain row and its ledger entry
 * commit atomically together.
 *
 * Throws if `amountFils` is not a non-negative integer (money must be integer fils).
 */
export async function postLedgerEntry(
  tx: Prisma.TransactionClient,
  input: PostLedgerInput
) {
  if (!Number.isInteger(input.amountFils) || input.amountFils < 0) {
    throw new Error(
      "amountFils must be a non-negative integer (money is integer fils)."
    );
  }

  return tx.ledgerEntry.create({
    data: {
      date: input.date,
      direction: input.direction,
      amountFils: input.amountFils,
      scope: input.scope,
      source: input.source,
      refId: input.refId ?? null,
      categoryId: input.categoryId ?? null,
      cropId: input.cropId ?? null,
      note: input.note ?? null,
    },
  });
}

/**
 * Reverse (delete) the ledger entry/-ies matching `{ source, refId }` inside a
 * caller-provided transaction. Returns the number of entries deleted.
 *
 * IMPORTANT: For EXPENSE / SALE / SALARY sources the owning domain row holds a
 * REQUIRED unique `ledgerEntryId` with `onDelete: Cascade`, so deleting the
 * `LedgerEntry` here cascade-deletes the owning domain row as well. This is the
 * intended behavior for a full delete/reversal.
 */
export async function reverseLedgerForRef(
  tx: Prisma.TransactionClient,
  source: LedgerSource,
  refId: string
): Promise<number> {
  const result = await tx.ledgerEntry.deleteMany({
    where: { source, refId },
  });
  return result.count;
}

/**
 * Current cash balance in integer fils.
 *
 * Computed as sum(amountFils where direction = "IN") − sum(amountFils where
 * direction = "OUT"). Uses the singleton `prisma` (a read on its own connection).
 */
export async function getCashBalanceFils(): Promise<number> {
  const [inAgg, outAgg] = await Promise.all([
    prisma.ledgerEntry.aggregate({
      _sum: { amountFils: true },
      where: { direction: "IN" satisfies Direction },
    }),
    prisma.ledgerEntry.aggregate({
      _sum: { amountFils: true },
      where: { direction: "OUT" satisfies Direction },
    }),
  ]);

  const inFils = inAgg._sum.amountFils ?? 0;
  const outFils = outAgg._sum.amountFils ?? 0;
  return inFils - outFils;
}

/** Filter for querying ledger entries. All fields optional; only provided fields constrain the query. */
export type LedgerFilter = {
  start?: Date;
  end?: Date;
  direction?: Direction;
  scope?: Scope;
  source?: LedgerSource;
  categoryId?: string;
  cropId?: string;
};

/**
 * Read ledger entries matching `filter`, ordered by `date` desc then
 * `createdAt` desc. Uses the singleton `prisma`.
 */
export async function getLedgerEntries(filter: LedgerFilter = {}) {
  const where: Prisma.LedgerEntryWhereInput = {};

  if (filter.start !== undefined || filter.end !== undefined) {
    const dateFilter: Prisma.DateTimeFilter = {};
    if (filter.start !== undefined) dateFilter.gte = filter.start;
    if (filter.end !== undefined) dateFilter.lte = filter.end;
    where.date = dateFilter;
  }

  if (filter.direction !== undefined) where.direction = filter.direction;
  if (filter.scope !== undefined) where.scope = filter.scope;
  if (filter.source !== undefined) where.source = filter.source;
  if (filter.categoryId !== undefined) where.categoryId = filter.categoryId;
  if (filter.cropId !== undefined) where.cropId = filter.cropId;

  return prisma.ledgerEntry.findMany({
    where,
    orderBy: [{ date: "desc" }, { createdAt: "desc" }],
  });
}
