"use server";

// Inventory server actions — thin boundary. Each: requireUser → Zod parse →
// service call → revalidate on success. No business logic lives here.
import { revalidatePath } from "next/cache";
import type { InventoryItem } from "@prisma/client";
import { requireUser } from "@/lib/auth";
import { fromZodError, type Result } from "@/lib/result";
import { REVALIDATE_PATHS_BUY, REVALIDATE_PATHS_ITEM } from "../constants";
import {
  buyInputSchema,
  useInputSchema,
  createItemSchema,
  updateItemSchema,
  setItemActiveSchema,
} from "../schemas/inventory.schema";
import {
  buyInput,
  recordUsage,
  createItem,
  updateItem,
  setItemActive,
} from "./inventory.service";

/** Revalidate every route affected by a buy (inventory, expenses, header balance). */
function revalidateBuyPaths(): void {
  for (const path of REVALIDATE_PATHS_BUY) revalidatePath(path);
}

/** Revalidate the inventory screen (item CRUD / use-input). */
function revalidateItemPaths(): void {
  for (const path of REVALIDATE_PATHS_ITEM) revalidatePath(path);
}

export async function buyInputAction(
  raw: unknown,
): Promise<Result<InventoryItem>> {
  await requireUser();
  const parsed = buyInputSchema.safeParse(raw);
  if (!parsed.success) return { ok: false, error: fromZodError(parsed.error) };
  const result = await buyInput(parsed.data);
  if (result.ok) revalidateBuyPaths();
  return result;
}

export async function recordUsageAction(
  raw: unknown,
): Promise<Result<InventoryItem>> {
  await requireUser();
  const parsed = useInputSchema.safeParse(raw);
  if (!parsed.success) return { ok: false, error: fromZodError(parsed.error) };
  const result = await recordUsage(parsed.data);
  if (result.ok) revalidateItemPaths();
  return result;
}

export async function createItemAction(
  raw: unknown,
): Promise<Result<InventoryItem>> {
  await requireUser();
  const parsed = createItemSchema.safeParse(raw);
  if (!parsed.success) return { ok: false, error: fromZodError(parsed.error) };
  const result = await createItem(parsed.data);
  if (result.ok) revalidateItemPaths();
  return result;
}

export async function updateItemAction(
  raw: unknown,
): Promise<Result<InventoryItem>> {
  await requireUser();
  const parsed = updateItemSchema.safeParse(raw);
  if (!parsed.success) return { ok: false, error: fromZodError(parsed.error) };
  const result = await updateItem(parsed.data);
  if (result.ok) revalidateItemPaths();
  return result;
}

export async function setItemActiveAction(
  raw: unknown,
): Promise<Result<InventoryItem>> {
  await requireUser();
  const parsed = setItemActiveSchema.safeParse(raw);
  if (!parsed.success) return { ok: false, error: fromZodError(parsed.error) };
  const result = await setItemActive(parsed.data);
  if (result.ok) revalidateItemPaths();
  return result;
}
