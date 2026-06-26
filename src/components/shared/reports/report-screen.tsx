"use client"

import * as React from "react"
import { useRouter, useSearchParams, usePathname } from "next/navigation"
import { BarChart3Icon } from "lucide-react"

import { cn } from "@/lib/utils"
import { type Period, periodLabels } from "@/lib/dates"
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Label } from "@/components/ui/label"
import {
  PeriodPicker,
  StatCard,
  EmptyState,
  DateField,
  MoneyText,
} from "@/components/shared"
import type { ReportData, ReportScope } from "@/server/reporting.types"

import { ReportExport } from "./report-export"

type Option = { id: string; nameAr: string }

export type ReportScreenProps = {
  report: ReportData
  period: Period
  scope: ReportScope
  categoryId?: string
  cropId?: string
  from?: string
  to?: string
  categories: Option[]
  crops: Option[]
}

const ALL = "all"
const DEFAULT_PERIOD: Period = "month"
const DEFAULT_SCOPE: ReportScope = "ALL"

const scopeOptions: { value: ReportScope; label: string }[] = [
  { value: "FARM", label: "المزرعة" },
  { value: "PERSONAL", label: "شخصي" },
  { value: "ALL", label: "الكل" },
]

const scopeLabelOf = (s: ReportScope) =>
  scopeOptions.find((o) => o.value === s)?.label ?? ""

/** Date → local yyyy-MM-dd for the URL. */
function toUrlDate(date: Date | null): string {
  if (!date || Number.isNaN(date.getTime())) return ""
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, "0")
  const d = String(date.getDate()).padStart(2, "0")
  return `${y}-${m}-${d}`
}

function fromUrlDate(value: string | undefined): Date | null {
  if (!value) return null
  const d = new Date(value)
  return Number.isNaN(d.getTime()) ? null : d
}

/** Local 3-way segmented control styled like PeriodPicker. */
function ScopeSegmented({
  value,
  onChange,
}: {
  value: ReportScope
  onChange: (s: ReportScope) => void
}) {
  return (
    <div
      role="tablist"
      aria-label="النطاق"
      className="grid grid-cols-3 gap-2 rounded-xl bg-secondary p-1"
    >
      {scopeOptions.map((option) => {
        const active = option.value === value
        return (
          <button
            key={option.value}
            type="button"
            role="tab"
            aria-selected={active}
            onClick={() => onChange(option.value)}
            className={cn(
              "flex h-12 items-center justify-center rounded-lg text-base font-medium transition-colors",
              active
                ? "bg-primary text-primary-foreground"
                : "bg-secondary text-foreground hover:bg-secondary/70"
            )}
          >
            {option.label}
          </button>
        )
      })}
    </div>
  )
}

export function ReportScreen({
  report,
  period,
  scope,
  categoryId,
  cropId,
  from,
  to,
  categories,
  crops,
}: ReportScreenProps) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()

  const pushWith = React.useCallback(
    (mutate: (params: URLSearchParams) => void) => {
      const params = new URLSearchParams(searchParams.toString())
      mutate(params)
      const qs = params.toString()
      router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false })
    },
    [router, pathname, searchParams]
  )

  function onPeriodChange(p: Period) {
    pushWith((params) => {
      if (p === DEFAULT_PERIOD) params.delete("period")
      else params.set("period", p)
      if (p !== "custom") {
        params.delete("from")
        params.delete("to")
      }
    })
  }

  function onFromChange(d: Date | null) {
    pushWith((params) => {
      const v = toUrlDate(d)
      if (v) params.set("from", v)
      else params.delete("from")
    })
  }

  function onToChange(d: Date | null) {
    pushWith((params) => {
      const v = toUrlDate(d)
      if (v) params.set("to", v)
      else params.delete("to")
    })
  }

  function onScopeChange(s: ReportScope) {
    pushWith((params) => {
      if (s === DEFAULT_SCOPE) params.delete("scope")
      else params.set("scope", s)
    })
  }

  function onCategoryChange(v: string | null) {
    pushWith((params) => {
      if (!v || v === ALL) params.delete("category")
      else params.set("category", v)
    })
  }

  function onCropChange(v: string | null) {
    pushWith((params) => {
      if (!v || v === ALL) params.delete("crop")
      else params.set("crop", v)
    })
  }

  const categoryValue = categoryId ?? ALL
  const cropValue = cropId ?? ALL
  const farmSpendFils = report.expenseFils + report.salaryFils
  const isEmpty =
    report.incomeFils === 0 &&
    report.expenseFils === 0 &&
    report.salaryFils === 0

  return (
    <div className="flex flex-col gap-4">
      {/* Filter bar */}
      <div className="flex flex-col gap-3">
        <PeriodPicker value={period} onChange={onPeriodChange} />

        {period === "custom" ? (
          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-2">
              <Label htmlFor="report-from">من</Label>
              <DateField
                id="report-from"
                value={fromUrlDate(from)}
                onChange={onFromChange}
              />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="report-to">إلى</Label>
              <DateField
                id="report-to"
                value={fromUrlDate(to)}
                onChange={onToChange}
              />
            </div>
          </div>
        ) : null}

        <ScopeSegmented value={scope} onChange={onScopeChange} />

        <div className="flex flex-col gap-2">
          <Label htmlFor="report-category">الفئة</Label>
          <Select
            value={categoryValue}
            onValueChange={onCategoryChange}
            items={[
              { label: "كل الفئات", value: ALL },
              ...categories.map((c) => ({ label: c.nameAr, value: c.id })),
            ]}
          >
            <SelectTrigger id="report-category" className="h-12 w-full">
              <SelectValue placeholder="كل الفئات" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={ALL}>كل الفئات</SelectItem>
              {categories.map((c) => (
                <SelectItem key={c.id} value={c.id}>
                  {c.nameAr}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="flex flex-col gap-2">
          <Label htmlFor="report-crop">المحصول</Label>
          <Select
            value={cropValue}
            onValueChange={onCropChange}
            items={[
              { label: "كل المحاصيل", value: ALL },
              ...crops.map((c) => ({ label: c.nameAr, value: c.id })),
            ]}
          >
            <SelectTrigger id="report-crop" className="h-12 w-full">
              <SelectValue placeholder="كل المحاصيل" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={ALL}>كل المحاصيل</SelectItem>
              {crops.map((c) => (
                <SelectItem key={c.id} value={c.id}>
                  {c.nameAr}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {isEmpty ? (
        <EmptyState
          icon={BarChart3Icon}
          title="لا توجد بيانات في هذه الفترة"
          description="غيّر الفترة أو النطاق لعرض الدخل والمصاريف والأرباح."
        />
      ) : (
        <>
          {/* Summary stats */}
          <div className="grid grid-cols-2 gap-3">
            <StatCard
              label="الدخل"
              value={
                <MoneyText fils={report.incomeFils} className="text-income" />
              }
            />
            <StatCard
              label="المصاريف"
              value={
                <MoneyText fils={report.expenseFils} className="text-expense" />
              }
            />
            <StatCard
              label="الأجور"
              value={
                <MoneyText fils={report.salaryFils} className="text-expense" />
              }
            />
            <StatCard
              label="الربح"
              className="col-span-2 bg-brand-tint ring-2 ring-primary/20"
              value={
                <MoneyText
                  fils={report.profitFils}
                  className={
                    report.profitFils >= 0 ? "text-income" : "text-expense"
                  }
                />
              }
            />
          </div>

          {/* Category breakdown */}
          {report.categoryBreakdown.length > 0 ? (
            <Card className="gap-3 rounded-2xl">
              <CardHeader>
                <CardTitle className="text-base">توزيع المصاريف</CardTitle>
              </CardHeader>
              <CardContent className="flex flex-col gap-4">
                {report.categoryBreakdown.map((slice) => (
                  <div key={slice.key} className="flex flex-col gap-1.5">
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-base text-foreground">
                        {slice.label}
                      </span>
                      <div className="flex items-center gap-3">
                        <span className="nums tabular-nums text-sm text-muted-foreground">
                          {slice.pct}%
                        </span>
                        <MoneyText
                          fils={slice.fils}
                          className="text-expense"
                        />
                      </div>
                    </div>
                    <div className="h-1.5 w-full overflow-hidden rounded-full bg-secondary">
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

          {/* Farm vs. personal split */}
          <Card className="gap-3 rounded-2xl">
            <CardHeader>
              <CardTitle className="text-base">المزرعة مقابل المنزل</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col gap-3">
              <div className="flex items-center justify-between gap-2">
                <span className="text-base text-foreground">مصاريف المزرعة</span>
                <MoneyText fils={farmSpendFils} className="text-expense" />
              </div>
              <div className="flex items-center justify-between gap-2">
                <span className="text-base text-foreground">مصاريف المنزل</span>
                <MoneyText
                  fils={report.personalOutFils}
                  className="text-expense"
                />
              </div>
              <p className="text-sm text-muted-foreground">
                مصاريف المنزل لا تُحتسب ضمن ربح المزرعة.
              </p>
              <div className="mt-1 flex flex-col gap-3 border-t border-border pt-3">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-base text-foreground">
                    إجمالي الحركة النقدية الواردة
                  </span>
                  <MoneyText
                    fils={report.totalCashInFils}
                    className="text-income"
                  />
                </div>
                <div className="flex items-center justify-between gap-2">
                  <span className="text-base text-foreground">
                    إجمالي الحركة النقدية الصادرة
                  </span>
                  <MoneyText
                    fils={report.totalCashOutFils}
                    className="text-expense"
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Income by crop */}
          {report.cropBreakdown.length > 0 ? (
            <Card className="gap-3 rounded-2xl">
              <CardHeader>
                <CardTitle className="text-base">الدخل حسب المحصول</CardTitle>
              </CardHeader>
              <CardContent className="flex flex-col gap-3">
                {report.cropBreakdown.map((slice) => (
                  <div
                    key={slice.cropId}
                    className="flex items-center justify-between gap-2"
                  >
                    <span className="text-base text-foreground">
                      {slice.label}
                    </span>
                    <MoneyText fils={slice.fils} className="text-income" />
                  </div>
                ))}
              </CardContent>
            </Card>
          ) : null}
        </>
      )}

      <ReportExport
        report={report}
        periodLabel={periodLabels[period]}
        scopeLabel={scopeLabelOf(scope)}
      />
    </div>
  )
}

export default ReportScreen
