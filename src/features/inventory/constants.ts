// Constants for the Inventory feature: revalidate paths, sentinels, and UI copy.

/** A buy creates an Expense + ledger entry → refresh inventory, expenses, and header balance. */
export const REVALIDATE_PATHS_BUY = ["/inventory", "/expenses", "/"] as const;

/** Item CRUD / use-input only affect the inventory screen. */
export const REVALIDATE_PATHS_ITEM = ["/inventory"] as const;

/** All input purchases are booked under this system EXPENSE category (resolved by name). */
export const FERTILIZER_CATEGORY_NAME = "أسمدة";

/** Sentinel option value meaning "create a new item" in the buy form's item picker. */
export const NEW_ITEM_VALUE = "__new__";

/** Cookie persisting the per-screen "strict use-tracking" toggle (read server-side). */
export const STRICT_COOKIE = "inv_strict";

/** Max transactions loaded per item for the history sheet. */
export const HISTORY_LIMIT = 100;

export const COPY = {
  title: "المخزون",
  subtitle: "الأسمدة والمبيدات والبذور المتوفّرة في المزرعة وما صُرف عليها.",

  // Primary actions
  buy: "شراء مستلزمات",
  buyShort: "شراء",
  addItem: "إضافة صنف",
  use: "صرف / استخدام",

  // Strict mode toggle
  strictLabel: "تتبّع الصرف والاستخدام",
  strictHint: "فعّل لتسجيل ما يُصرف من المخزون.",

  // Item list / row
  onHand: "المتوفّر",
  lowStock: "كمية منخفضة",
  inactive: "غير مفعّل",

  // Buy form
  buyTitle: "شراء مستلزمات",
  buyDescription: "سجّل ما اشتريته: يُضاف للمخزون ويُحتسب مصروفاً تلقائياً.",
  item: "الصنف",
  newItemOption: "صنف جديد",
  itemName: "اسم الصنف",
  unit: "الوحدة",
  lowStockThreshold: "حدّ التنبيه (اختياري)",
  quantity: "الكمية",
  amountPaid: "المبلغ المدفوع",
  vendor: "المورّد",
  note: "ملاحظة",
  saveBuy: "حفظ الشراء",

  // Item form
  createItemTitle: "إضافة صنف",
  editItemTitle: "تعديل الصنف",
  itemFormDescription: "عرّف الصنف ووحدته. تُدار الكميات عبر الشراء والصرف.",
  saveItem: "حفظ الصنف",
  saveItemEdit: "حفظ التعديلات",

  // Use form
  useTitle: "صرف / استخدام",
  useDescription: "سجّل الكمية المصروفة من المخزون.",
  saveUse: "حفظ الصرف",

  // History
  historyTitle: "حركة الصنف",
  historyEmpty: "لا توجد حركات على هذا الصنف بعد.",
  txIn: "إضافة",
  txOut: "صرف",
  edit: "تعديل",
  deactivate: "إيقاف الصنف",
  activate: "تفعيل الصنف",

  // Empty state
  emptyTitle: "المخزون فارغ",
  emptyDescription: "أضف أصنافك لتتابع الكميات المتبقّية والتنبيه عند نقصها.",

  // Toasts
  bought: "تم تسجيل الشراء",
  used: "تم تسجيل الصرف",
  itemSaved: "تم حفظ الصنف",
  itemEdited: "تم تعديل الصنف",
  itemDeactivated: "تم إيقاف الصنف",
  itemActivated: "تم تفعيل الصنف",

  // Confirm
  deactivateTitle: "إيقاف الصنف؟",
  deactivateConfirm: "إيقاف",
} as const;
