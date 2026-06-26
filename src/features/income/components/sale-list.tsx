"use client"

import { TrendingUpIcon } from "lucide-react"

import { Button } from "@/components/ui/button"
import { MoneyText, EmptyState } from "@/components/shared"
import { formatDateAr } from "@/lib/dates"

import type { SaleWithRelations, SaleDayGroup } from "../types"
import { COPY } from "../constants"
import { SaleListItem } from "./sale-list-item"

export type SaleListProps = {
  sales: SaleWithRelations[]
  totalFils: number
  onEdit: (s: SaleWithRelations) => void
  onDelete: (id: string) => void | Promise<void>
  onAdd: () => void
}

/** Local yyyy-MM-dd key for grouping. */
function dayKeyOf(date: Date): string {
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, "0")
  const d = String(date.getDate()).padStart(2, "0")
  return `${y}-${m}-${d}`
}

/** Group sales by calendar day, newest day first (input is already date-desc). */
function groupByDay(sales: SaleWithRelations[]): SaleDayGroup[] {
  const groups: SaleDayGroup[] = []
  const index = new Map<string, SaleDayGroup>()

  for (const sale of sales) {
    const date = new Date(sale.date)
    const key = dayKeyOf(date)
    let group = index.get(key)
    if (!group) {
      group = { dayKey: key, date, totalFils: 0, items: [] }
      index.set(key, group)
      groups.push(group)
    }
    group.items.push(sale)
    group.totalFils += sale.netFils
  }

  return groups
}

export function SaleList({
  sales,
  totalFils,
  onEdit,
  onDelete,
  onAdd,
}: SaleListProps) {
  if (sales.length === 0) {
    return (
      <div className="flex flex-col items-center gap-2">
        <EmptyState
          icon={TrendingUpIcon}
          title={COPY.emptyTitle}
          description={COPY.emptyDescription}
        />
        <Button size="lg" className="h-14" onClick={onAdd}>
          {COPY.add}
        </Button>
      </div>
    )
  }

  const groups = groupByDay(sales)

  return (
    <div className="flex flex-col gap-4">
      {/* Period total header card */}
      <div className="flex items-center justify-between gap-3 rounded-2xl bg-brand-tint px-4 py-4">
        <span className="text-base font-medium text-foreground">
          {COPY.periodTotal}
        </span>
        <MoneyText fils={totalFils} className="text-xl font-bold text-income" />
      </div>

      {groups.map((group) => (
        <section key={group.dayKey} className="flex flex-col gap-2">
          <div className="flex items-center justify-between gap-2 px-1">
            <h3 className="font-heading text-base font-semibold text-foreground">
              {formatDateAr(group.date)}
            </h3>
            <MoneyText
              fils={group.totalFils}
              className="text-sm font-medium text-muted-foreground"
            />
          </div>
          <div className="flex flex-col gap-2">
            {group.items.map((sale) => (
              <SaleListItem
                key={sale.id}
                sale={sale}
                onEdit={onEdit}
                onDelete={onDelete}
              />
            ))}
          </div>
        </section>
      ))}
    </div>
  )
}

export default SaleList
