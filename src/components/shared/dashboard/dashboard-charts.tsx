"use client"

import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts"

import { formatJod } from "@/lib/money"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import type { BreakdownSlice, MonthlyCashFlow } from "@/server/reporting.types"

// Design tokens (income green / expense clay) — recharts needs raw hex.
const INCOME_COLOR = "#2E7D4F"
const EXPENSE_COLOR = "#C0492B"
const CATEGORY_COLOR = "#7CA88C" // muted leaf green for the calm spend chart

export type DashboardChartsProps = {
  monthly: MonthlyCashFlow[]
  categories: BreakdownSlice[]
}

/** Short axis ticks: JOD value without the currency suffix. */
function axisTick(value: number): string {
  return formatJod(value, { withSuffix: false })
}

/** Tooltip value formatter: full JOD string with suffix. */
function tooltipMoney(value: unknown): string {
  return formatJod(Number(value))
}

/**
 * Client-only dashboard charts (recharts). Two calm charts: monthly cash IN vs
 * OUT, and spend-by-category. recharts renders LTR, so each chart wrapper is
 * `dir="ltr"` to keep axis ordering sane while the surrounding UI stays RTL.
 */
export function DashboardCharts({ monthly, categories }: DashboardChartsProps) {
  const hasMonthly = monthly.some((m) => m.inFils > 0 || m.outFils > 0)
  const topCategories = categories.slice(0, 6)

  return (
    <div className="space-y-4">
      {hasMonthly ? (
        <Card className="rounded-2xl">
          <CardHeader>
            <CardTitle>الوارد والصادر شهرياً</CardTitle>
          </CardHeader>
          <CardContent>
            <div dir="ltr">
              <ResponsiveContainer width="100%" height={220}>
                <BarChart
                  data={monthly}
                  margin={{ top: 8, right: 8, left: 8, bottom: 0 }}
                  barGap={2}
                >
                  <CartesianGrid
                    strokeDasharray="3 3"
                    stroke="#E2E8DA"
                    vertical={false}
                  />
                  <XAxis
                    dataKey="label"
                    tickLine={false}
                    axisLine={false}
                    tick={{ fontSize: 12, fill: "#5B6B5E" }}
                  />
                  <YAxis
                    width={48}
                    tickLine={false}
                    axisLine={false}
                    tick={{ fontSize: 11, fill: "#5B6B5E" }}
                    tickFormatter={axisTick}
                  />
                  <Tooltip
                    formatter={tooltipMoney}
                    cursor={{ fill: "#F6F8F1" }}
                    contentStyle={{
                      borderRadius: 12,
                      border: "1px solid #E2E8DA",
                      fontSize: 13,
                    }}
                    labelStyle={{ color: "#1F2A22" }}
                  />
                  <Bar
                    dataKey="inFils"
                    name="وارد"
                    fill={INCOME_COLOR}
                    radius={[4, 4, 0, 0]}
                  />
                  <Bar
                    dataKey="outFils"
                    name="صادر"
                    fill={EXPENSE_COLOR}
                    radius={[4, 4, 0, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      ) : null}

      {topCategories.length ? (
        <Card className="rounded-2xl">
          <CardHeader>
            <CardTitle>توزيع المصاريف حسب الفئة</CardTitle>
          </CardHeader>
          <CardContent>
            <div dir="ltr">
              <ResponsiveContainer width="100%" height={220}>
                <BarChart
                  layout="vertical"
                  data={topCategories}
                  margin={{ top: 4, right: 8, left: 8, bottom: 0 }}
                >
                  <CartesianGrid
                    strokeDasharray="3 3"
                    stroke="#E2E8DA"
                    horizontal={false}
                  />
                  <XAxis
                    type="number"
                    tickLine={false}
                    axisLine={false}
                    tick={{ fontSize: 11, fill: "#5B6B5E" }}
                    tickFormatter={axisTick}
                  />
                  <YAxis
                    type="category"
                    dataKey="label"
                    width={88}
                    tickLine={false}
                    axisLine={false}
                    tick={{ fontSize: 12, fill: "#1F2A22" }}
                  />
                  <Tooltip
                    formatter={tooltipMoney}
                    cursor={{ fill: "#F6F8F1" }}
                    contentStyle={{
                      borderRadius: 12,
                      border: "1px solid #E2E8DA",
                      fontSize: 13,
                    }}
                    labelStyle={{ color: "#1F2A22" }}
                  />
                  <Bar dataKey="fils" name="المصروف" radius={[0, 4, 4, 0]}>
                    {topCategories.map((slice) => (
                      <Cell key={slice.key} fill={CATEGORY_COLOR} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      ) : null}
    </div>
  )
}

export default DashboardCharts
