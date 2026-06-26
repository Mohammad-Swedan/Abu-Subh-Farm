"use client"

import { ReceiptTextIcon } from "lucide-react"

import { Button } from "@/components/ui/button"
import { MoneyText, EmptyState } from "@/components/shared"
import { formatDateAr } from "@/lib/dates"

import type { ExpenseWithRelations, ExpenseDayGroup } from "../types"
import { COPY } from "../constants"
import { ExpenseListItem } from "./expense-list-item"

export type ExpenseListProps = {
  expenses: ExpenseWithRelations[]
  totalFils: number
  onEdit: (e: ExpenseWithRelations) => void
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

/** Group expenses by calendar day, newest day first (input is already date-desc). */
function groupByDay(expenses: ExpenseWithRelations[]): ExpenseDayGroup[] {
  const groups: ExpenseDayGroup[] = []
  const index = new Map<string, ExpenseDayGroup>()

  for (const expense of expenses) {
    const date = new Date(expense.date)
    const key = dayKeyOf(date)
    let group = index.get(key)
    if (!group) {
      group = { dayKey: key, date, totalFils: 0, items: [] }
      index.set(key, group)
      groups.push(group)
    }
    group.items.push(expense)
    group.totalFils += expense.amountFils
  }

  return groups
}

export function ExpenseList({
  expenses,
  totalFils,
  onEdit,
  onDelete,
  onAdd,
}: ExpenseListProps) {
  if (expenses.length === 0) {
    return (
      <div className="flex flex-col items-center gap-2">
        <EmptyState
          icon={ReceiptTextIcon}
          title={COPY.emptyTitle}
          description={COPY.emptyDescription}
        />
        <Button size="lg" className="h-14" onClick={onAdd}>
          {COPY.add}
        </Button>
      </div>
    )
  }

  const groups = groupByDay(expenses)

  return (
    <div className="flex flex-col gap-4">
      {/* Period total header card */}
      <div className="flex items-center justify-between gap-3 rounded-2xl bg-brand-tint px-4 py-4">
        <span className="text-base font-medium text-foreground">
          {COPY.periodTotal}
        </span>
        <MoneyText
          fils={totalFils}
          className="text-xl font-bold text-expense"
        />
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
            {group.items.map((expense) => (
              <ExpenseListItem
                key={expense.id}
                expense={expense}
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

export default ExpenseList
