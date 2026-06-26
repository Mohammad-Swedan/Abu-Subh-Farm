import { TrendingUpIcon, ReceiptTextIcon } from "lucide-react";
import { getCashBalanceFils, getLedgerEntries } from "@/lib/ledger/ledger.service";
import { getRange } from "@/lib/dates";
import { BalanceCard, QuickAddSheet } from "@/components/layout";
import { StatCard, MoneyText } from "@/components/shared";

/**
 * Dashboard (home) — PLACEHOLDER. The integration prompt fills the full summary.
 * For now it shows the signature balance card, the prominent quick-add control,
 * and this month's income/expense totals straight from the shared ledger.
 */
export default async function DashboardPage() {
  const balanceFils = await getCashBalanceFils();
  const { start, end } = getRange("month");
  const entries = await getLedgerEntries({ start, end });

  const incomeFils = entries
    .filter((e) => e.direction === "IN")
    .reduce((sum, e) => sum + e.amountFils, 0);
  const expenseFils = entries
    .filter((e) => e.direction === "OUT")
    .reduce((sum, e) => sum + e.amountFils, 0);

  return (
    <div className="space-y-6">
      <BalanceCard balanceFils={balanceFils} />

      <QuickAddSheet />

      <section className="space-y-3">
        <h2 className="font-heading text-lg text-foreground">هذا الشهر</h2>
        <div className="grid grid-cols-2 gap-3">
          <StatCard
            label="المبيعات"
            icon={TrendingUpIcon}
            value={<MoneyText fils={incomeFils} className="text-income" />}
          />
          <StatCard
            label="المصاريف"
            icon={ReceiptTextIcon}
            value={<MoneyText fils={expenseFils} className="text-expense" />}
          />
        </div>
      </section>

      <p className="text-muted-foreground text-sm">
        لوحة المعلومات الكاملة قيد الإنشاء — ستظهر هنا ملخّصات الأرباح والمصاريف قريباً.
      </p>
    </div>
  );
}
