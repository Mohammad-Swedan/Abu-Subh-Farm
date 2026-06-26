// Crops repository — pure Prisma reads. No Result wrapping, no "use server".
import type { Crop } from "@prisma/client";
import { prisma } from "@/lib/db/prisma";

/** All crops, active first, then alphabetical — for the management list. */
export async function listAllCrops(): Promise<Crop[]> {
  return prisma.crop.findMany({
    orderBy: [{ isActive: "desc" }, { nameAr: "asc" }],
  });
}
