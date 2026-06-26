// Constants for the Income / Sales feature: URL query-param keys + small UI copy.
import type { Period } from "@/lib/dates";

/** Default reporting period when none is in the URL. */
export const DEFAULT_PERIOD: Period = "month";

/** Query-string keys driving the server-rendered list + totals. */
export const QP = {
  period: "period",
  crop: "crop",
  from: "from",
  to: "to",
  /** When "1", the page auto-opens the add-sale sheet (home quick-add lands here). */
  new: "new",
} as const;

/** Sentinel option value meaning "no filter" in the crop select. */
export const ALL_VALUE = "__all__";

/** Sentinel option value meaning "no crop" in the form crop picker. */
export const CROP_NONE = "__none__";

/** Routes the feature revalidates after a write (list total + header balance). */
export const REVALIDATE_PATHS = ["/income", "/"] as const;

export const COPY = {
  title: "المبيعات",
  subtitle: "دفعات بيع المحصول في الحسبة وما تبقّى بعد العمولة.",
  add: "تسجيل دفعة مبيع",
  addShort: "دفعة مبيع",
  editTitle: "تعديل الدفعة",
  createTitle: "تسجيل دفعة مبيع",
  formDescription: "سجّل الصافي الذي وصلك. أضف التفاصيل إذا توفّر بيان الحسبة.",
  net: "الصافي الواصل",
  details: "تفاصيل (اختياري)",
  crop: "المحصول",
  marketName: "الحسبة / الدلال",
  quantityKg: "الكمية (كغم)",
  gross: "الإجمالي",
  commission: "العمولة",
  otherDeductions: "تنزيل / نقل",
  buyer: "المشتري",
  note: "ملاحظة",
  impliedNet: "الصافي المتوقع",
  useImplied: "استخدم هذا المبلغ",
  save: "حفظ الدفعة",
  saveEdit: "حفظ التعديلات",
  periodTotal: "إجمالي المبيعات",
  emptyTitle: "لا توجد مبيعات في هذه الفترة",
  emptyDescription: "سجّل أول دفعة مبيع لتعرف صافي ما وصلك.",
  allCrops: "كل المحاصيل",
  noCrop: "بدون",
  deleteTitle: "حذف الدفعة؟",
  deleteConfirm: "حذف",
  saved: "تم حفظ الدفعة",
  edited: "تم تعديل الدفعة",
  deleted: "تم حذف الدفعة",
} as const;
