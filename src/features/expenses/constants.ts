// Constants for the Expenses feature: URL query-param keys + small UI copy.
import type { Period } from "@/lib/dates";

/** Default reporting period when none is in the URL. */
export const DEFAULT_PERIOD: Period = "month";

/** Query-string keys driving the server-rendered list + totals. */
export const QP = {
  period: "period",
  category: "category",
  scope: "scope",
  from: "from",
  to: "to",
  /** When "1", the page auto-opens the add-expense sheet (home quick-add lands here). */
  new: "new",
} as const;

/** Sentinel option value meaning "no filter" in the category/scope selects. */
export const ALL_VALUE = "__all__";

/** Routes the feature revalidates after a write (list total + header balance). */
export const REVALIDATE_PATHS = ["/expenses", "/"] as const;

export const COPY = {
  title: "المصاريف",
  subtitle: "مصاريف المزرعة: أسمدة، محروقات، مياه، وغيرها.",
  add: "إضافة مصروف",
  addShort: "مصروف جديد",
  manageCategories: "إدارة التصنيفات",
  recurring: "المصاريف الثابتة",
  periodTotal: "إجمالي الفترة",
  emptyTitle: "لا توجد مصاريف في هذه الفترة",
  emptyDescription: "ابدأ بتسجيل أول مصروف لتتابع أين تذهب نقودك.",
  allCategories: "كل التصنيفات",
  allScopes: "الكل",
} as const;
