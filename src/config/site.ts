export const siteConfig = {
  name: "مزارع أبو صبح",
  shortName: "أبو صبح",
  description: "تطبيق بسيط لإدارة مصاريف ومبيعات وعمال المزرعة.",
  defaultScope: "FARM" as const,
  locale: "ar",
  dir: "rtl" as const,
};

export type SiteConfig = typeof siteConfig;
