// Shared types for the Income / Sales feature. Prisma row shapes + view-model helpers.
import type { Sale, Crop } from "@prisma/client";

/** A sale row with the relations the list/item UI needs. */
export type SaleWithRelations = Sale & {
  crop: Crop | null;
};

/** Minimal crop option passed from the server page into the client pickers. */
export type CropOption = { id: string; nameAr: string };

/** Filter used by the repository reads. `start`/`end` come from getRange(). */
export type SaleFilter = {
  start: Date;
  end: Date;
  cropId?: string;
  /** Free-text search over market name + buyer + note (and crop name). */
  q?: string;
};

/** Sales bucketed by calendar day (newest day first) for the grouped list. */
export type SaleDayGroup = {
  dayKey: string; // yyyy-MM-dd (local)
  date: Date;
  totalFils: number; // sum of netFils in the day
  items: SaleWithRelations[];
};
