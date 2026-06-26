import Link from "next/link"
import {
  TrendingUpIcon,
  ReceiptTextIcon,
  WalletIcon,
  SproutIcon,
  ChevronLeftIcon,
} from "lucide-react"

import { getCashBalanceFils } from "@/lib/ledger/ledger.service"
import { getRange, formatDateAr } from "@/lib/dates"
import { ledgerSourceLabels, unitLabels } from "@/lib/enums"
import { BalanceCard, QuickAddSheet } from "@/components/layout"
import { StatCard, MoneyText } from "@/components/shared"
import { DashboardCharts } from "@/components/shared/dashboard"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  getReport,
  getMonthlyCashFlow,
  getLowStockItems,
  getRecentActivity,
} from "@/server/reporting.service"

/**
 * Dashboard (home). Server Component — the group is gated by middleware, so no
 * explicit auth here (matches the placeholder). Every money figure is derived
 * from the shared reporting service; nothing is re-aggregated locally.
 */
export default async function DashboardPage() {
  const [
    balanceFils,
    monthReport,
    yearReport,
    monthly,
    lowStock,
    activity,
  ] = await Promise.all([
    getCashBalanceFils(),
    getReport({ range: getRange("month"), scope: "FARM" }),
    getReport({ range: getRange("year"), scope: "FARM" }),
    getMonthlyCashFlow(12),
    getLowStockItems(),
    getRecentActivity(8),
  ])

  const monthExpenseFils = monthReport.expenseFils + monthReport.salaryFils
  const topSpend = monthReport.categoryBreakdown.slice(0, 4)
  const topCrop = yearReport.cropBreakdown[0]

  return (
    <div className="space-y-6">
      <BalanceCard balanceFils={balanceFils} />

      <QuickAddSheet />

      {/* Insight cards */}
      <section className="space-y-3">
        <h2 className="font-heading text-lg text-foreground">نظرة سريعة</h2>
        <StatCard
          label="أرباح هذه السنة"
          icon={WalletIcon}
          value={
            <MoneyText
              fils={yearReport.profitFils}
              className={
                yearReport.profitFils >= 0 ? "text-income" : "text-expense"
              }
            />
          }
        />
        <div className="grid grid-cols-2 gap-3">
          <StatCard
            label="مبيعات هذا الشهر"
            icon={TrendingUpIcon}
            value={
              <MoneyText fils={monthReport.incomeFils} className="text-income" />
            }
          />
          <StatCard
            label="مصاريف هذا الشهر"
            icon={ReceiptTextIcon}
            value={
              <MoneyText fils={monthExpenseFils} className="text-expense" />
            }
          />
        </div>
      </section>

      {/* Where your money goes this month */}
      {topSpend.length ? (
        <Card className="rounded-2xl">
          <CardHeader>
            <CardTitle>أين تذهب مصاريفك هذا الشهر؟</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {topSpend.map((slice, i) => (
              <div key={slice.key} className="space-y-1.5">
                <div className="flex items-center justify-between gap-3">
                  <span
                    className={
                      i === 0
                        ? "text-base font-semibold text-foreground"
                        : "text-base text-foreground"
                    }
                  >
                    {slice.label}
                    {i === 0 ? (
                      <span className="ms-2 text-sm font-normal text-muted-foreground">
                        أكبر مصروف
                      </span>
                    ) : null}
                  </span>
                  <span className="flex items-center gap-2">
                    <span className="text-sm text-muted-foreground">
                      {slice.pct}%
                    </span>
                    <MoneyText
                      fils={slice.fils}
                      className="text-sm text-foreground"
                    />
                  </span>
                </div>
                <div className="h-2 w-full overflow-hidden rounded-full bg-secondary">
                  <div
                    className="h-full rounded-full bg-primary"
                    style={{ width: `${slice.pct}%` }}
                  />
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      ) : null}

      {/* Low stock */}
      {lowStock.length ? (
        <Link href="/inventory" className="block">
          <Card className="rounded-2xl transition-colors hover:bg-secondary/50">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <span className="inline-block size-2.5 rounded-full bg-amber-500" />
                مخزون منخفض
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {lowStock.map((item) => (
                <div
                  key={item.id}
                  className="flex items-center justify-between gap-3"
                >
                  <span className="text-base text-foreground">
                    {item.nameAr}
                  </span>
                  <span className="nums text-sm tabular-nums text-muted-foreground">
                    {item.quantityOnHand} {unitLabels[item.unit]} / حد {item.lowStockThreshold}
                  </span>
                </div>
              ))}
            </CardContent>
          </Card>
        </Link>
      ) : null}

      {/* Top earning crop */}
      {topCrop ? (
        <StatCard
          label="أكثر محصول دخلاً"
          icon={SproutIcon}
          value={
            <span className="flex items-center justify-between gap-3">
              <span className="text-foreground">{topCrop.label}</span>
              <MoneyText fils={topCrop.fils} className="text-income" />
            </span>
          }
        />
      ) : null}

      {/* Recent activity */}
      {activity.length ? (
        <Card className="rounded-2xl">
          <CardHeader>
            <CardTitle className="flex items-center justify-between gap-2">
              <span>آخر الحركات</span>
              <ChevronLeftIcon className="size-5 text-muted-foreground" />
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {activity.map((item) => {
              const isIn = item.direction === "IN"
              return (
                <div
                  key={item.id}
                  className="flex items-center justify-between gap-3"
                >
                  <div className="flex flex-col gap-0.5">
                    <span className="text-base text-foreground">
                      {item.label}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      {ledgerSourceLabels[item.source]} ·{" "}
                      {formatDateAr(item.date, "d MMM")}
                    </span>
                  </div>
                  <span
                    className={
                      isIn
                        ? "flex items-center gap-1 text-income"
                        : "flex items-center gap-1 text-expense"
                    }
                  >
                    <span aria-hidden>{isIn ? "+" : "−"}</span>
                    <MoneyText fils={item.amountFils} className="text-sm" />
                  </span>
                </div>
              )
            })}
          </CardContent>
        </Card>
      ) : null}

      {/* Charts */}
      <DashboardCharts
        monthly={monthly}
        categories={monthReport.categoryBreakdown}
      />
    </div>
  )
}
