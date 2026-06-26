import type { LucideIcon } from "lucide-react";
import {
  HomeIcon,
  ReceiptTextIcon,
  TrendingUpIcon,
  UsersIcon,
  PackageIcon,
  BarChart3Icon,
  SettingsIcon,
  MoreHorizontalIcon,
  HandCoinsIcon,
} from "lucide-react";
import { siteConfig } from "./site";

export type NavItem = { href: string; labelAr: string; icon: LucideIcon };

export const primaryNav: NavItem[] = [
  { href: "/", labelAr: "الرئيسية", icon: HomeIcon },
  { href: "/expenses", labelAr: "المصاريف", icon: ReceiptTextIcon },
  { href: "/income", labelAr: "المبيعات", icon: TrendingUpIcon },
  { href: "/employees", labelAr: "العمال", icon: UsersIcon },
];

export const moreNav: NavItem[] = [
  { href: "/inventory", labelAr: "المخزون", icon: PackageIcon },
  { href: "/reports", labelAr: "التقارير", icon: BarChart3Icon },
  { href: "/settings", labelAr: "الإعدادات", icon: SettingsIcon },
];

export const moreTab = { labelAr: "المزيد", icon: MoreHorizontalIcon };

export const quickActions: { labelAr: string; href: string; icon: LucideIcon }[] = [
  { labelAr: "مصروف جديد", href: "/expenses", icon: ReceiptTextIcon },
  { labelAr: "دفعة مبيع", href: "/income", icon: TrendingUpIcon },
  { labelAr: "دفع أجور", href: "/employees", icon: HandCoinsIcon },
];

export const allNav: NavItem[] = [...primaryNav, ...moreNav];

export function getNavTitle(pathname: string): string {
  if (pathname === "/") {
    return primaryNav[0].labelAr;
  }

  const match = allNav
    .filter((item) => item.href !== "/")
    .filter((item) => pathname.startsWith(item.href))
    .sort((a, b) => b.href.length - a.href.length)[0];

  return match ? match.labelAr : siteConfig.name;
}
