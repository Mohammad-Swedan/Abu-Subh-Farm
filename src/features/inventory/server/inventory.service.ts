// Inventory service — business logic, transactions, ledger writes. Returns Result<T>.
// NO "use server" here; the actions layer is the server boundary.
import type { InventoryItem } from "@prisma/client";
import { prisma } from "@/lib/db/prisma";
import { postLedgerEntry } from "@/lib/ledger/ledger.service";
import { ok, err, type Result } from "@/lib/result";
import { FERTILIZER_CATEGORY_NAME } from "../constants";
import type {
  BuyInputInput,
  UseInputInput,
  CreateItemInput,
  UpdateItemInput,
  SetItemActiveInput,
} from "../schemas/inventory.schema";

/**
 * Buy an input (شراء), atomically: book it as an Expense + its OUT ledger entry,
 * record an IN inventory transaction, and bump the item's quantity on hand.
 * If `newItem` is given we create the item inline; otherwise we use `itemId`.
 */
export async function buyInput(
  input: BuyInputInput,
): Promise<Result<InventoryItem>> {
  try {
    const item = await prisma.$transaction(async (tx) => {
      // Resolve the booking category inside the tx to keep everything atomic.
      const byName = await tx.category.findFirst({
        where: { nameAr: FERTILIZER_CATEGORY_NAME },
      });
      const category =
        byName ??
        (await tx.category.findFirst({
          where: { kind: { in: ["EXPENSE", "BOTH"] } },
          orderBy: { sortOrder: "asc" },
        }));
      if (!category) throw new Error("no category");
      const categoryId = category.id;

      // Either create the item inline or use the provided id (schema-guaranteed).
      let itemId: string;
      if (input.newItem) {
        const created = await tx.inventoryItem.create({
          data: {
            nameAr: input.newItem.nameAr,
            unit: input.newItem.unit,
            lowStockThreshold: input.newItem.lowStockThreshold ?? null,
            quantityOnHand: 0,
            isActive: true,
          },
        });
        itemId = created.id;
      } else {
        itemId = input.itemId as string;
      }

      // Money movement: ledger entry first, then the expense links to it, then
      // backfill the entry's refId so reversals can find/cascade it later.
      const ledger = await postLedgerEntry(tx, {
        date: input.date,
        direction: "OUT",
        amountFils: input.amountFils,
        scope: "FARM",
        source: "EXPENSE",
        categoryId,
        cropId: null,
        note: input.note ?? null,
      });
      const expense = await tx.expense.create({
        data: {
          date: input.date,
          amountFils: input.amountFils,
          categoryId,
          scope: "FARM",
          cropId: null,
          vendor: input.vendor ?? null,
          note: input.note ?? null,
          ledgerEntryId: ledger.id,
        },
      });
      await tx.ledgerEntry.update({
        where: { id: ledger.id },
        data: { refId: expense.id },
      });

      // Stock movement: IN transaction linked to the purchase, then bump quantity.
      await tx.inventoryTransaction.create({
        data: {
          itemId,
          type: "IN",
          quantity: input.quantity,
          date: input.date,
          note: input.note ?? null,
          relatedExpenseId: expense.id,
        },
      });
      return tx.inventoryItem.update({
        where: { id: itemId },
        data: { quantityOnHand: { increment: input.quantity } },
      });
    });
    return ok(item);
  } catch {
    return err("CREATE_FAILED", "تعذّر حفظ عملية الشراء، حاول مرة أخرى");
  }
}

/**
 * Use/consume stock (صرف) — strict OUT tracking, NO money movement.
 * Re-reads the item inside the tx to guard against over-consumption.
 */
export async function recordUsage(
  input: UseInputInput,
): Promise<Result<InventoryItem>> {
  try {
    const result = await prisma.$transaction(async (tx) => {
      const item = await tx.inventoryItem.findUnique({
        where: { id: input.itemId },
      });
      if (!item) return "NOT_FOUND" as const;
      if (input.quantity > item.quantityOnHand) {
        return "INSUFFICIENT_STOCK" as const;
      }

      await tx.inventoryTransaction.create({
        data: {
          itemId: input.itemId,
          type: "OUT",
          quantity: input.quantity,
          date: input.date,
          note: input.note ?? null,
        },
      });
      return tx.inventoryItem.update({
        where: { id: input.itemId },
        data: { quantityOnHand: { decrement: input.quantity } },
      });
    });

    if (result === "NOT_FOUND") return err("NOT_FOUND", "الصنف غير موجود");
    if (result === "INSUFFICIENT_STOCK") {
      return err("INSUFFICIENT_STOCK", "الكمية المطلوبة أكبر من المتوفّر");
    }
    return ok(result);
  } catch {
    return err("USE_FAILED", "تعذّر تسجيل الصرف");
  }
}

/** Create an inventory item (stock starts at 0; only transactions move quantity). */
export async function createItem(
  input: CreateItemInput,
): Promise<Result<InventoryItem>> {
  try {
    const item = await prisma.inventoryItem.create({
      data: {
        nameAr: input.nameAr,
        unit: input.unit,
        lowStockThreshold: input.lowStockThreshold ?? null,
        quantityOnHand: 0,
        isActive: true,
      },
    });
    return ok(item);
  } catch {
    return err("CREATE_FAILED", "تعذّر حفظ الصنف");
  }
}

/** Edit an item's definition only — never touches quantityOnHand or isActive. */
export async function updateItem(
  input: UpdateItemInput,
): Promise<Result<InventoryItem>> {
  try {
    const existing = await prisma.inventoryItem.findUnique({
      where: { id: input.id },
    });
    if (!existing) return err("NOT_FOUND", "الصنف غير موجود");
    const item = await prisma.inventoryItem.update({
      where: { id: input.id },
      data: {
        nameAr: input.nameAr,
        unit: input.unit,
        lowStockThreshold: input.lowStockThreshold ?? null,
      },
    });
    return ok(item);
  } catch {
    return err("UPDATE_FAILED", "تعذّر تعديل الصنف");
  }
}

/** Toggle an item's active flag (soft enable/disable). */
export async function setItemActive(
  input: SetItemActiveInput,
): Promise<Result<InventoryItem>> {
  try {
    const item = await prisma.inventoryItem.update({
      where: { id: input.id },
      data: { isActive: input.isActive },
    });
    return ok(item);
  } catch {
    return err("UPDATE_FAILED", "تعذّر تحديث حالة الصنف");
  }
}
