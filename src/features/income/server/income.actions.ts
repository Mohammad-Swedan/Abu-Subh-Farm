"use server";

// Income (Sales) server actions — thin boundary. Each: requireUser → Zod parse →
// service call → revalidate on success. No business logic lives here.
import { revalidatePath } from "next/cache";
import type { Sale } from "@prisma/client";
import { requireUser } from "@/lib/auth";
import { fromZodError, type Result } from "@/lib/result";
import { REVALIDATE_PATHS } from "../constants";
import {
  createSaleSchema,
  updateSaleSchema,
  saleIdSchema,
} from "../schemas/sale.schema";
import { createSale, updateSale, deleteSale } from "./income.service";

/** Revalidate every route affected by a sales write (list total + header balance). */
function revalidateSalePaths(): void {
  for (const path of REVALIDATE_PATHS) revalidatePath(path);
}

export async function createSaleAction(raw: unknown): Promise<Result<Sale>> {
  await requireUser();
  const parsed = createSaleSchema.safeParse(raw);
  if (!parsed.success) return { ok: false, error: fromZodError(parsed.error) };
  const result = await createSale(parsed.data);
  if (result.ok) revalidateSalePaths();
  return result;
}

export async function updateSaleAction(raw: unknown): Promise<Result<Sale>> {
  await requireUser();
  const parsed = updateSaleSchema.safeParse(raw);
  if (!parsed.success) return { ok: false, error: fromZodError(parsed.error) };
  const result = await updateSale(parsed.data);
  if (result.ok) revalidateSalePaths();
  return result;
}

export async function deleteSaleAction(raw: unknown): Promise<Result<true>> {
  await requireUser();
  const parsed = saleIdSchema.safeParse(raw);
  if (!parsed.success) return { ok: false, error: fromZodError(parsed.error) };
  const result = await deleteSale(parsed.data.id);
  if (result.ok) revalidateSalePaths();
  return result;
}
