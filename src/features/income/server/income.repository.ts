// Income (Sales) repository — pure Prisma reads.
// NO ledger logic, NO Result wrapping, NO "use server". Business rules live in the service.
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/db/prisma";
import type { SaleWithRelations, CropOption, SaleFilter } from "../types";

/** Build the shared Prisma where clause from a SaleFilter (DRY between list + sum + count). */
function buildSaleWhere(filter: SaleFilter): Prisma.SaleWhereInput {
  const where: Prisma.SaleWhereInput = {
    date: { gte: filter.start, lte: filter.end },
  };
  if (filter.cropId !== undefined) where.cropId = filter.cropId;
  if (filter.q) {
    where.OR = [
      { marketName: { contains: filter.q } },
      { buyer: { contains: filter.q } },
      { note: { contains: filter.q } },
      { crop: { is: { nameAr: { contains: filter.q } } } },
    ];
  }
  return where;
}

/** List sales in range (+ optional crop/search), newest first, with relations. */
export async function listSales(
  filter: SaleFilter,
  opts?: { skip?: number; take?: number },
): Promise<SaleWithRelations[]> {
  return prisma.sale.findMany({
    where: buildSaleWhere(filter),
    include: { crop: true },
    orderBy: [{ date: "desc" }, { createdAt: "desc" }],
    skip: opts?.skip,
    take: opts?.take,
  });
}

/** Count sales matching the filter — drives pagination. */
export async function countSales(filter: SaleFilter): Promise<number> {
  return prisma.sale.count({ where: buildSaleWhere(filter) });
}

/** Sum netFils for the matching sales. Returns 0 when there are none. */
export async function sumSalesNetFils(filter: SaleFilter): Promise<number> {
  const agg = await prisma.sale.aggregate({
    _sum: { netFils: true },
    where: buildSaleWhere(filter),
  });
  return agg._sum.netFils ?? 0;
}

/** Load a single sale with its relations, or null. */
export async function getSaleById(
  id: string,
): Promise<SaleWithRelations | null> {
  return prisma.sale.findUnique({
    where: { id },
    include: { crop: true },
  });
}

/** Active crops for the optional crop picker. */
export async function listActiveCrops(): Promise<CropOption[]> {
  return prisma.crop.findMany({
    where: { isActive: true },
    orderBy: { nameAr: "asc" },
    select: { id: true, nameAr: true },
  });
}
