// Crops service — business logic for managing crop names. Returns Result<T>.
// Crops carry no money and no ledger entries of their own, so these are plain
// Prisma writes (the ledger references crops by id, never the reverse).
import type { Crop } from "@prisma/client";
import { prisma } from "@/lib/db/prisma";
import { ok, err, type Result } from "@/lib/result";
import type {
  CreateCropInput,
  UpdateCropInput,
  SetCropActiveInput,
} from "../schemas/crop.schema";

export async function createCrop(
  input: CreateCropInput,
): Promise<Result<Crop>> {
  try {
    const crop = await prisma.crop.create({
      data: { nameAr: input.nameAr },
    });
    return ok(crop);
  } catch {
    return err("CREATE_FAILED", "تعذّر حفظ المحصول، حاول مرة أخرى");
  }
}

export async function updateCrop(
  input: UpdateCropInput,
): Promise<Result<Crop>> {
  try {
    const crop = await prisma.crop.update({
      where: { id: input.id },
      data: { nameAr: input.nameAr },
    });
    return ok(crop);
  } catch {
    return err("UPDATE_FAILED", "تعذّر تعديل المحصول");
  }
}

export async function setCropActive(
  input: SetCropActiveInput,
): Promise<Result<Crop>> {
  try {
    const crop = await prisma.crop.update({
      where: { id: input.id },
      data: { isActive: input.isActive },
    });
    return ok(crop);
  } catch {
    return err("UPDATE_FAILED", "تعذّر تحديث حالة المحصول");
  }
}
