// Constants for the Employees & Payroll feature: query params, sentinels, UI copy.
import type { Period } from "@/lib/dates";
import type { PayType } from "./schemas/employee.schema";

/** Default reporting period for the payments history. */
export const DEFAULT_PERIOD: Period = "month";

/** Query-string keys driving the server-rendered payments list + totals. */
export const QP = {
  period: "period",
  from: "from",
  to: "to",
  /** When "1", the page auto-opens the pay-worker form (home quick-add lands here). */
  new: "new",
} as const;

/** Cookie persisting the per-screen "advances (سلف)" toggle (read server-side). */
export const ADVANCES_COOKIE = "emp_advances";

/** Routes the feature revalidates after a write (payments/employees + header balance). */
export const REVALIDATE_PATHS = ["/employees", "/"] as const;

export const PAY_TYPE_LABELS: Record<PayType, string> = {
  MONTHLY: "شهري",
  DAILY: "يومي",
};

export const COPY = {
  title: "العمال والأجور",
  subtitle: "عمال المزرعة وأجورهم الشهرية واليومية والسُّلف.",

  // Primary actions
  pay: "دفع أجور",
  addEmployee: "إضافة عامل",

  // Advances toggle
  advancesLabel: "تتبّع السُّلف",
  advancesHint: "فعّل لتسجيل سُلف العمال وخصمها من الأجور.",

  // Employees list
  employeesTitle: "العمال",
  monthlySalary: "الراتب الشهري",
  dailyRate: "الأجر اليومي",
  outstanding: "سُلف مستحقّة",
  remainingSalary: "المتبقّي من الراتب",
  inactive: "غير مفعّل",
  emptyEmployeesTitle: "لا يوجد عمال بعد",
  emptyEmployeesDescription: "أضف عمّالك لتسجيل الأجور والسُّلف بسهولة.",

  // Employee form
  createEmployeeTitle: "إضافة عامل",
  editEmployeeTitle: "تعديل العامل",
  employeeFormDescription: "عرّف العامل ونوع أجره.",
  name: "الاسم",
  payType: "نوع الأجر",
  phone: "الهاتف",
  note: "ملاحظة",
  saveEmployee: "حفظ العامل",
  saveEmployeeEdit: "حفظ التعديلات",
  deactivate: "إيقاف العامل",
  activate: "تفعيل العامل",
  deactivateTitle: "إيقاف العامل؟",
  deactivateConfirm: "إيقاف",

  // Pay form
  payTitle: "دفع أجور",
  payDescription: "ادفع لعامل باسمه أو سجّل أجور عمالة يومية كاملة.",
  modeNamed: "عامل محدّد",
  modeLump: "عمالة يومية",
  employee: "العامل",
  amount: "المبلغ",
  grossAmount: "إجمالي الأجر",
  date: "التاريخ",
  periodLabel: "الفترة / العمل",
  periodLabelHintNamed: "مثال: 2026-06 أو قطاف العنب",
  periodLabelHintLump: "مثال: قطاف العنب",
  workersCount: "عدد العمال",
  perWorkerRate: "أجر العامل الواحد (اختياري)",
  deduct: "خصم السُّلف",
  useAllOutstanding: "خصم الكل",
  breakdownGross: "إجمالي الأجر",
  breakdownDeduct: "خصم السُّلف",
  breakdownNet: "الصافي المدفوع",
  savePay: "حفظ الدفعة",
  savePayEdit: "حفظ التعديلات",

  // Payments list
  paymentsTitle: "سجل الأجور",
  periodTotal: "إجمالي الأجور",
  lumpLabel: "عمالة يومية",
  worker: "عامل",
  emptyPaymentsTitle: "لا توجد أجور في هذه الفترة",
  emptyPaymentsDescription: "سجّل أول دفعة أجور.",
  editPaymentTitle: "تعديل الدفعة",
  deletePaymentTitle: "حذف الدفعة؟",
  deleteConfirm: "حذف",

  // Advances
  advancesTitle: "السُّلف",
  addAdvance: "تسجيل سلفة",
  advanceFormDescription: "سجّل سلفة قُدّمت لعامل؛ تُخصم لاحقاً من أجره.",
  advanceAmount: "مبلغ السلفة",
  settled: "مسدّدة",
  partiallySettled: "مسدّدة جزئياً",
  remaining: "المتبقّي",
  deleteAdvanceTitle: "حذف السلفة؟",
  noAdvances: "لا توجد سُلف مسجّلة.",

  // Toasts
  employeeSaved: "تم حفظ العامل",
  employeeEdited: "تم تعديل العامل",
  employeeDeactivated: "تم إيقاف العامل",
  employeeActivated: "تم تفعيل العامل",
  paid: "تم حفظ الدفعة",
  paymentEdited: "تم تعديل الدفعة",
  paymentDeleted: "تم حذف الدفعة",
  advanceSaved: "تم تسجيل السلفة",
  advanceDeleted: "تم حذف السلفة",
} as const;
