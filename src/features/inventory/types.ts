// Shared types for the Inventory feature. Prisma row shapes + view-model helpers.
import type {
  InventoryItem,
  InventoryTransaction,
  Expense,
} from "@prisma/client";
import type { Unit } from "@/lib/enums";

/** A single transaction with the linked purchase (if any) for history display. */
export type TransactionWithExpense = InventoryTransaction & {
  relatedExpense: Expense | null;
};

/** An item plus its recent IN/OUT transactions (for the history sheet). */
export type ItemWithHistory = InventoryItem & {
  transactions: TransactionWithExpense[];
};

/** Minimal item option passed into the buy/use pickers. */
export type ItemOption = {
  id: string;
  nameAr: string;
  unit: Unit;
  quantityOnHand: number;
};

/** Convenience alias for the unit union ("KG" | "L"). */
export type UnitValue = Unit;
