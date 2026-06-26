"use client"

import { Trash2Icon } from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { MoneyText, ConfirmDialog } from "@/components/shared"
import { formatJod } from "@/lib/money"
import { scopeLabels, type Scope } from "@/lib/enums"

import type { ExpenseWithRelations } from "../types"

export type ExpenseListItemProps = {
  expense: ExpenseWithRelations
  onEdit: (e: ExpenseWithRelations) => void
  onDelete: (id: string) => void | Promise<void>
}

export function ExpenseListItem({
  expense,
  onEdit,
  onDelete,
}: ExpenseListItemProps) {
  const scope = expense.scope as Scope

  return (
    <div className="flex items-center gap-2 rounded-xl border border-border bg-card">
      <button
        type="button"
        onClick={() => onEdit(expense)}
        className="flex min-h-16 flex-1 items-center justify-between gap-3 px-4 py-3 text-start"
      >
        <div className="flex min-w-0 flex-col gap-1">
          <span className="truncate text-base font-semibold text-foreground">
            {expense.category.nameAr}
          </span>
          {expense.note ? (
            <span className="truncate text-sm text-muted-foreground">
              {expense.note}
            </span>
          ) : null}
          <div className="flex flex-wrap items-center gap-1.5">
            <Badge variant="secondary">{scopeLabels[scope]}</Badge>
            {expense.crop ? (
              <Badge variant="outline">{expense.crop.nameAr}</Badge>
            ) : null}
          </div>
        </div>
        <MoneyText
          fils={expense.amountFils}
          className="shrink-0 text-lg font-semibold text-expense"
        />
      </button>

      <div className="pe-2">
        <ConfirmDialog
          trigger={
            <Button
              type="button"
              variant="ghost"
              size="icon"
              aria-label="حذف"
              onClick={(e) => e.stopPropagation()}
            >
              <Trash2Icon className="text-expense" />
            </Button>
          }
          title="حذف المصروف؟"
          description={`سيتم حذف مصروف بقيمة ${formatJod(expense.amountFils)}. لا يمكن التراجع.`}
          confirmLabel="حذف"
          destructive
          onConfirm={() => onDelete(expense.id)}
        />
      </div>
    </div>
  )
}

export default ExpenseListItem
