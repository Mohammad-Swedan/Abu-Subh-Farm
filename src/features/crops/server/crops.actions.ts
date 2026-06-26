"use server";

// Crops server actions — thin boundary: requireUser → Zod parse → service →
// revalidate on success. No business logic here.
import { revalidatePath } from "next/cache";
import type { Crop } from "@prisma/client";
import { requireUser } from "@/lib/auth";
import { fromZodError, type Result } from "@/lib/result";
import { REVALIDATE_PATHS } from "../constants";
import {
  createCropSchema,
  updateCropSchema,
  setCropActiveSchema,
} from "../schemas/crop.schema";
import { createCrop, updateCrop, setCropActive } from "./crops.service";

function revalidateCropPaths(): void {
  for (const path of REVALIDATE_PATHS) revalidatePath(path);
}

export async function createCropAction(raw: unknown): Promise<Result<Crop>> {
  await requireUser();
  const parsed = createCropSchema.safeParse(raw);
  if (!parsed.success) return { ok: false, error: fromZodError(parsed.error) };
  const result = await createCrop(parsed.data);
  if (result.ok) revalidateCropPaths();
  return result;
}

export async function updateCropAction(raw: unknown): Promise<Result<Crop>> {
  await requireUser();
  const parsed = updateCropSchema.safeParse(raw);
  if (!parsed.success) return { ok: false, error: fromZodError(parsed.error) };
  const result = await updateCrop(parsed.data);
  if (result.ok) revalidateCropPaths();
  return result;
}

export async function setCropActiveAction(
  raw: unknown,
): Promise<Result<Crop>> {
  await requireUser();
  const parsed = setCropActiveSchema.safeParse(raw);
  if (!parsed.success) return { ok: false, error: fromZodError(parsed.error) };
  const result = await setCropActive(parsed.data);
  if (result.ok) revalidateCropPaths();
  return result;
}
