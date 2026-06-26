// Income (Sales) service — business logic, transactions, ledger writes. Returns Result<T>.
// NO "use server" here; the actions layer is the server boundary.
// Sales are always FARM income, so the ledger entry's scope is the constant "FARM".
import type { Sale } from "@prisma/client";
import { prisma } from "@/lib/db/prisma";
import {
  postLedgerEntry,
  reverseLedgerForRef,
} from "@/lib/ledger/ledger.service";
import { ok, err, type Result } from "@/lib/result";
import type { CreateSaleInput, UpdateSaleInput } from "../schemas/sale.schema";

/**
 * Create one sale + its single IN ledger entry, atomically.
 * The ledger entry is created first, the sale links to it, then we backfill
 * the entry's refId so reverseLedgerForRef can find/cascade it later.
 */
export async function createSale(
  input: CreateSaleInput,
): Promise<Result<Sale>> {
  try {
    const sale = await prisma.$transaction(async (tx) => {
      const ledger = await postLedgerEntry(tx, {
        date: input.date,
        direction: "IN",
        amountFils: input.netFils,
        scope: "FARM",
        source: "SALE",
        cropId: input.cropId ?? null,
        note: input.note ?? null,
      });
      const created = await tx.sale.create({
        data: {
          date: input.date,
          cropId: input.cropId ?? null,
          marketName: input.marketName ?? null,
          quantityKg: input.quantityKg ?? null,
          grossFils: input.grossFils ?? null,
          commissionFils: input.commissionFils ?? null,
          otherDeductionsFils: input.otherDeductionsFils ?? null,
          netFils: input.netFils,
          buyer: input.buyer ?? null,
          note: input.note ?? null,
          ledgerEntryId: ledger.id,
        },
      });
      await tx.ledgerEntry.update({
        where: { id: ledger.id },
        data: { refId: created.id },
      });
      return created;
    });
    return ok(sale);
  } catch {
    return err("CREATE_FAILED", "تعذّر حفظ الدفعة، حاول مرة أخرى");
  }
}

/**
 * Edit a sale and update its LINKED ledger entry IN PLACE.
 * We must NOT use reverseLedgerForRef here: deleting the ledger row would
 * cascade-delete the sale we're trying to update.
 */
export async function updateSale(
  input: UpdateSaleInput,
): Promise<Result<Sale>> {
  // Guard money ourselves — ledger.update won't validate (postLedgerEntry would).
  if (!Number.isInteger(input.netFils) || input.netFils <= 0) {
    return err("UPDATE_FAILED", "تعذّر تعديل الدفعة");
  }
  try {
    const result = await prisma.$transaction(async (tx) => {
      const existing = await tx.sale.findUnique({
        where: { id: input.id },
      });
      if (!existing) return null;

      await tx.ledgerEntry.update({
        where: { id: existing.ledgerEntryId },
        data: {
          date: input.date,
          amountFils: input.netFils,
          scope: "FARM",
          cropId: input.cropId ?? null,
          note: input.note ?? null,
        },
      });

      return tx.sale.update({
        where: { id: input.id },
        data: {
          date: input.date,
          cropId: input.cropId ?? null,
          marketName: input.marketName ?? null,
          quantityKg: input.quantityKg ?? null,
          grossFils: input.grossFils ?? null,
          commissionFils: input.commissionFils ?? null,
          otherDeductionsFils: input.otherDeductionsFils ?? null,
          netFils: input.netFils,
          buyer: input.buyer ?? null,
          note: input.note ?? null,
        },
      });
    });

    if (result === null) return err("NOT_FOUND", "الدفعة غير موجودة");
    return ok(result);
  } catch {
    return err("UPDATE_FAILED", "تعذّر تعديل الدفعة");
  }
}

/**
 * Delete a sale by reversing its ledger entry. Deleting the LedgerEntry
 * (matched by source+refId) cascade-deletes the owning sale.
 */
export async function deleteSale(id: string): Promise<Result<true>> {
  try {
    const count = await prisma.$transaction((tx) =>
      reverseLedgerForRef(tx, "SALE", id),
    );
    if (count === 0) return err("NOT_FOUND", "الدفعة غير موجودة");
    return ok(true);
  } catch {
    return err("DELETE_FAILED", "تعذّر حذف الدفعة");
  }
}
