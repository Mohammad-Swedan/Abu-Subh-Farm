export const ar = {
  "app.name": "مزارع أبو صبح",
  "app.tagline": "إدارة المزرعة بكل سهولة",

  "nav.home": "الرئيسية",
  "nav.dashboard": "الرئيسية",
  "nav.expenses": "المصاريف",
  "nav.income": "المبيعات",
  "nav.employees": "العمال",
  "nav.inventory": "المخزون",
  "nav.reports": "التقارير",
  "nav.settings": "الإعدادات",
  "nav.more": "المزيد",

  "common.add": "إضافة",
  "common.edit": "تعديل",
  "common.delete": "حذف",
  "common.save": "حفظ",
  "common.cancel": "إلغاء",
  "common.confirm": "تأكيد",
  "common.back": "رجوع",
  "common.loading": "جارٍ التحميل…",
  "common.search": "بحث",
  "common.all": "الكل",
  "common.none": "لا شيء",
  "common.required": "مطلوب",

  "auth.login": "تسجيل الدخول",
  "auth.password": "كلمة المرور",
  "auth.logout": "تسجيل الخروج",
  "auth.welcome": "أهلاً بك",
  "auth.wrongPassword": "كلمة المرور غير صحيحة",

  "balance.title": "الرصيد الحالي",

  "quickAdd.title": "تسجيل سريع",
  "quickAdd.expense": "مصروف جديد",
  "quickAdd.sale": "دفعة مبيع",
  "quickAdd.salary": "دفع أجور",

  "empty.generic": "لا توجد بيانات بعد",
  "empty.cta": "ابدأ بالإضافة",
  "empty.expenses": "لا توجد مصاريف بعد",
  "empty.income": "لا توجد مبيعات بعد",
  "empty.inventory": "لا توجد أصناف في المخزون بعد",
  "empty.employees": "لا يوجد عمال بعد",
  "empty.reports": "لا توجد تقارير متاحة بعد",

  "money.suffix": "د.أ",
} as const;

export type ArKey = keyof typeof ar;

export function t(key: ArKey): string {
  return ar[key];
}
