// Inventory repository — pure Prisma reads.
// NO ledger logic, NO Result wrapping, NO "use server". Business rules live in the service.
import type { InventoryItem } from "@prisma/client";
import { prisma } from "@/lib/db/prisma";
import type { Unit } from "@/lib/enums";
import { FERTILIZER_CATEGORY_NAME, HISTORY_LIMIT } from "../constants";
import type { ItemWithHistory, ItemOption } from "../types";

/** Active items, alphabetical, each with its recent IN/OUT history (+ linked purchase). */
export async function listItems(): Promise<ItemWithHistory[]> {
  return prisma.inventoryItem.findMany({
    where: { isActive: true },
    orderBy: { nameAr: "asc" },
    include: {
      transactions: {
        orderBy: [{ date: "desc" }, { createdAt: "desc" }],
        take: HISTORY_LIMIT,
        include: { relatedExpense: true },
      },
    },
  });
}

/** Minimal active-item options for the buy/use pickers. */
export async function listItemOptions(): Promise<ItemOption[]> {
  const items = await prisma.inventoryItem.findMany({
    where: { isActive: true },
    orderBy: { nameAr: "asc" },
    select: { id: true, nameAr: true, unit: true, quantityOnHand: true },
  });
  return items.map((item) => ({ ...item, unit: item.unit as Unit }));
}

/** Load a single item by id, or null. */
export async function getItemById(id: string): Promise<InventoryItem | null> {
  return prisma.inventoryItem.findUnique({ where: { id } });
}

/**
 * Resolve the category id used to book input purchases. Prefer the "أسمدة"
 * category by name; otherwise fall back to the first usable EXPENSE/BOTH category.
 * Returns null when no suitable category exists.
 */
export async function getFertilizerCategoryId(): Promise<string | null> {
  const byName = await prisma.category.findFirst({
    where: { nameAr: FERTILIZER_CATEGORY_NAME },
  });
  if (byName) return byName.id;
  const fallback = await prisma.category.findFirst({
    where: { kind: { in: ["EXPENSE", "BOTH"] } },
    orderBy: { sortOrder: "asc" },
  });
  return fallback?.id ?? null;
}
