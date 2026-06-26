// Shared, offset-based pagination helpers for the server-rendered list screens.
// Lists are driven by URL search params (?page=N, ?q=...) exactly like the
// existing period/category filters, so paging is a plain server re-render.

/** Rows per page across all lists. Tuned for the mobile, one-column layout. */
export const PAGE_SIZE = 20;

/** A page of rows plus the metadata the <Pagination> control needs. */
export type Page<T> = {
  items: T[];
  total: number;
  /** 1-based, already clamped to [1, pageCount]. */
  page: number;
  pageSize: number;
  pageCount: number;
};

/** Parse a 1-based page from a raw query value, defaulting to 1. */
export function parsePage(value: string | undefined): number {
  const n = value ? Number(value) : 1;
  if (!Number.isFinite(n) || n < 1) return 1;
  return Math.floor(n);
}

/** Total pages for a row count (always at least 1 so the UI has a "page 1"). */
export function pageCountOf(total: number, pageSize = PAGE_SIZE): number {
  return Math.max(1, Math.ceil(total / pageSize));
}

/**
 * Clamp a requested page to the valid range and return the Prisma skip/take for
 * that page. Clamping keeps the user on the last page after rows are deleted
 * instead of showing an empty list.
 */
export function pageSlice(
  requestedPage: number,
  total: number,
  pageSize = PAGE_SIZE,
): { page: number; skip: number; take: number } {
  const pageCount = pageCountOf(total, pageSize);
  const page = Math.min(Math.max(1, requestedPage), pageCount);
  return { page, skip: (page - 1) * pageSize, take: pageSize };
}

/** Read a single search term from a raw query value (trimmed, empty → undefined). */
export function parseSearch(value: string | undefined): string | undefined {
  const q = value?.trim();
  return q ? q : undefined;
}
