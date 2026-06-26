"use client"

import { DownloadIcon, PrinterIcon } from "lucide-react"

import { Button } from "@/components/ui/button"
import { formatJod } from "@/lib/money"
import type { ReportData } from "@/server/reporting.types"

export type ReportExportProps = {
  report: ReportData
  periodLabel: string
  scopeLabel: string
}

/** Format fils for a CSV/print cell: Western digits, 3 decimals, no suffix. */
function money(fils: number): string {
  return formatJod(fils, { withSuffix: false })
}

/** Quote a CSV cell when it contains a comma, quote, or newline. */
function csvCell(value: string | number): string {
  const s = String(value)
  return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s
}

function csvRow(cells: (string | number)[]): string {
  return cells.map(csvCell).join(",")
}

/** Build the full CSV (with a leading UTF-8 BOM so Excel renders Arabic). */
function buildCsv(report: ReportData, periodLabel: string, scopeLabel: string): string {
  const lines: string[] = []

  lines.push(csvRow(["مزارع أبو صبح — التقارير"]))
  lines.push(csvRow(["الفترة", periodLabel]))
  lines.push(csvRow(["النطاق", scopeLabel]))
  lines.push("")

  // Summary section
  lines.push(csvRow(["البند", "القيمة"]))
  lines.push(csvRow(["الدخل", money(report.incomeFils)]))
  lines.push(csvRow(["المصاريف", money(report.expenseFils)]))
  lines.push(csvRow(["الأجور", money(report.salaryFils)]))
  lines.push(csvRow(["الربح", money(report.profitFils)]))
  lines.push(csvRow(["مصاريف المنزل", money(report.personalOutFils)]))
  lines.push(csvRow(["إجمالي الوارد", money(report.totalCashInFils)]))
  lines.push(csvRow(["إجمالي الصادر", money(report.totalCashOutFils)]))

  // Category breakdown section
  if (report.categoryBreakdown.length > 0) {
    lines.push("")
    lines.push(csvRow(["توزيع المصاريف"]))
    lines.push(csvRow(["الفئة", "النسبة", "المبلغ"]))
    for (const slice of report.categoryBreakdown) {
      lines.push(csvRow([slice.label, `${slice.pct}%`, money(slice.fils)]))
    }
  }

  // Crop breakdown section
  if (report.cropBreakdown.length > 0) {
    lines.push("")
    lines.push(csvRow(["الدخل حسب المحصول"]))
    lines.push(csvRow(["المحصول", "المبلغ"]))
    for (const slice of report.cropBreakdown) {
      lines.push(csvRow([slice.label, money(slice.fils)]))
    }
  }

  return "﻿" + lines.join("\n")
}

const PRINT_CSS = `@media print {
  body * { visibility: hidden !important; }
  .print-report, .print-report * { visibility: visible !important; }
  .print-report {
    position: absolute;
    inset-block-start: 0;
    inset-inline-start: 0;
    width: 100%;
    padding: 16px;
  }
}`

export function ReportExport({ report, periodLabel, scopeLabel }: ReportExportProps) {
  function handleCsv() {
    const csv = buildCsv(report, periodLabel, scopeLabel)
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `report-${periodLabel}.csv`
    document.body.appendChild(a)
    a.click()
    a.remove()
    URL.revokeObjectURL(url)
  }

  function handlePdf() {
    window.print()
  }

  const row = (label: string, fils: number) => (
    <div className="flex items-center justify-between gap-4 border-b border-border py-1">
      <span>{label}</span>
      <span className="nums tabular-nums">{money(fils)}</span>
    </div>
  )

  return (
    <>
      <style>{PRINT_CSS}</style>

      <div className="grid grid-cols-2 gap-3">
        <Button
          type="button"
          variant="secondary"
          className="h-12"
          onClick={handleCsv}
        >
          <DownloadIcon />
          تصدير Excel (CSV)
        </Button>
        <Button
          type="button"
          variant="secondary"
          className="h-12"
          onClick={handlePdf}
        >
          <PrinterIcon />
          تصدير PDF
        </Button>
      </div>

      {/* Print-only block: hidden on screen, the only visible thing on print. */}
      <div className="print-report hidden print:block text-base text-foreground" dir="rtl">
        <h2 className="mb-1 text-xl font-semibold">مزارع أبو صبح — التقارير</h2>
        <p className="mb-1">الفترة: {periodLabel}</p>
        <p className="mb-4">النطاق: {scopeLabel}</p>

        <h3 className="mb-2 text-lg font-semibold">الملخّص</h3>
        {row("الدخل", report.incomeFils)}
        {row("المصاريف", report.expenseFils)}
        {row("الأجور", report.salaryFils)}
        {row("الربح", report.profitFils)}
        {row("مصاريف المنزل", report.personalOutFils)}
        {row("إجمالي الوارد", report.totalCashInFils)}
        {row("إجمالي الصادر", report.totalCashOutFils)}

        {report.categoryBreakdown.length > 0 ? (
          <>
            <h3 className="mt-4 mb-2 text-lg font-semibold">توزيع المصاريف</h3>
            {report.categoryBreakdown.map((slice) => (
              <div
                key={slice.key}
                className="flex items-center justify-between gap-4 border-b border-border py-1"
              >
                <span>{slice.label}</span>
                <span className="flex items-center gap-3">
                  <span className="nums tabular-nums">{slice.pct}%</span>
                  <span className="nums tabular-nums">{money(slice.fils)}</span>
                </span>
              </div>
            ))}
          </>
        ) : null}

        {report.cropBreakdown.length > 0 ? (
          <>
            <h3 className="mt-4 mb-2 text-lg font-semibold">الدخل حسب المحصول</h3>
            {report.cropBreakdown.map((slice) => (
              <div
                key={slice.cropId}
                className="flex items-center justify-between gap-4 border-b border-border py-1"
              >
                <span>{slice.label}</span>
                <span className="nums tabular-nums">{money(slice.fils)}</span>
              </div>
            ))}
          </>
        ) : null}
      </div>
    </>
  )
}

export default ReportExport
