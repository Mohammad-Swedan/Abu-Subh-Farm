import {
  startOfDay,
  endOfDay,
  startOfWeek,
  endOfWeek,
  startOfMonth,
  endOfMonth,
  startOfYear,
  endOfYear,
  format,
} from "date-fns";
import { ar } from "date-fns/locale";

export const PERIODS = [
  "day",
  "week",
  "month",
  "season",
  "year",
  "custom",
] as const;
export type Period = (typeof PERIODS)[number];

export const periodLabels: Record<Period, string> = {
  day: "اليوم",
  week: "هذا الأسبوع",
  month: "هذا الشهر",
  season: "الموسم",
  year: "هذه السنة",
  custom: "مخصص",
};

export type DateRange = { start: Date; end: Date };

export function getRange(
  period: Period,
  ref: Date = new Date(),
  custom?: DateRange,
): DateRange {
  switch (period) {
    case "day":
      return { start: startOfDay(ref), end: endOfDay(ref) };
    case "week":
      // Jordan week starts on Saturday.
      return {
        start: startOfWeek(ref, { weekStartsOn: 6 }),
        end: endOfWeek(ref, { weekStartsOn: 6 }),
      };
    case "month":
      return { start: startOfMonth(ref), end: endOfMonth(ref) };
    case "season": {
      // Assumption: a "season" is the 3-month agricultural block (calendar
      // quarter) containing ref. Quarters start in Jan/Apr/Jul/Oct.
      const month = ref.getMonth(); // 0-11
      const quarterStartMonth = Math.floor(month / 3) * 3;
      const start = startOfMonth(
        new Date(ref.getFullYear(), quarterStartMonth, 1),
      );
      const end = endOfMonth(
        new Date(ref.getFullYear(), quarterStartMonth + 2, 1),
      );
      return { start, end };
    }
    case "year":
      return { start: startOfYear(ref), end: endOfYear(ref) };
    case "custom":
      return custom ?? { start: startOfDay(ref), end: endOfDay(ref) };
  }
}

export function formatDateAr(date: Date, fmt = "d MMMM yyyy"): string {
  return format(date, fmt, { locale: ar });
}

export const periodOptions: { value: Period; label: string }[] = PERIODS.map(
  (value) => ({ value, label: periodLabels[value] }),
);
