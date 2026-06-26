export type CategoryKind = "EXPENSE" | "INCOME" | "BOTH";

export type SeedCategory = {
  nameAr: string;
  kind: CategoryKind;
  isSystem: boolean;
  sortOrder: number;
};

export const seedCategories: SeedCategory[] = [
  { nameAr: "أسمدة", kind: "EXPENSE", isSystem: true, sortOrder: 1 },
  { nameAr: "مياه وري", kind: "EXPENSE", isSystem: true, sortOrder: 2 },
  { nameAr: "محروقات", kind: "EXPENSE", isSystem: true, sortOrder: 3 },
  { nameAr: "كهرباء", kind: "EXPENSE", isSystem: true, sortOrder: 4 },
  { nameAr: "نقل", kind: "EXPENSE", isSystem: true, sortOrder: 5 },
  { nameAr: "بذور", kind: "EXPENSE", isSystem: true, sortOrder: 6 },
  { nameAr: "مبيدات", kind: "EXPENSE", isSystem: true, sortOrder: 7 },
  { nameAr: "صيانة ومعدات", kind: "EXPENSE", isSystem: true, sortOrder: 8 },
  { nameAr: "أخرى", kind: "EXPENSE", isSystem: true, sortOrder: 9 },
  { nameAr: "مبيعات المحصول", kind: "INCOME", isSystem: true, sortOrder: 10 },
  { nameAr: "إيرادات أخرى", kind: "INCOME", isSystem: true, sortOrder: 11 },
];

export const expenseCategories: SeedCategory[] = seedCategories.filter(
  (category) => category.kind === "EXPENSE",
);

export const incomeCategories: SeedCategory[] = seedCategories.filter(
  (category) => category.kind === "INCOME",
);
