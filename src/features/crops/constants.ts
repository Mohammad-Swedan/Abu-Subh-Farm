// Constants for the Crops (المحاصيل) management feature: revalidation + UI copy.

/** Routes affected when crops change (settings list, income picker, dashboard). */
export const REVALIDATE_PATHS = ["/settings", "/income", "/"] as const;

export const COPY = {
  title: "المحاصيل",
  subtitle: "أسماء المحاصيل التي تظهر عند تسجيل المبيعات.",
  add: "إضافة محصول",
  addTitle: "إضافة محصول",
  editTitle: "تعديل المحصول",
  formDescription: "اكتب اسم المحصول كما تريده أن يظهر في القوائم.",
  name: "اسم المحصول",
  save: "حفظ",
  saveEdit: "حفظ التعديلات",
  activate: "تفعيل",
  deactivate: "إخفاء",
  deactivateTitle: "إخفاء المحصول؟",
  deactivateDescription:
    "لن يظهر هذا المحصول عند تسجيل مبيعات جديدة. تبقى مبيعاته السابقة كما هي.",
  inactive: "مخفي",
  emptyTitle: "لا توجد محاصيل بعد",
  emptyDescription: "أضف محصولك الأول لتربط المبيعات به.",
  saved: "تم إضافة المحصول",
  edited: "تم تعديل المحصول",
  activated: "تم تفعيل المحصول",
  deactivated: "تم إخفاء المحصول",
} as const;
