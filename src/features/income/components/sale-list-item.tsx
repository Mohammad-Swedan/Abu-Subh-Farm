"use client"

import { Trash2Icon } from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { MoneyText, ConfirmDialog } from "@/components/shared"
import { formatJod } from "@/lib/money"

import type { SaleWithRelations } from "../types"
import { COPY } from "../constants"

export type SaleListItemProps = {
  sale: SaleWithRelations
  onEdit: (s: SaleWithRelations) => void
  onDelete: (id: string) => void | Promise<void>
}

export function SaleListItem({ sale, onEdit, onDelete }: SaleListItemProps) {
  return (
    <div className="flex items-center gap-2 rounded-xl border border-border bg-card">
      <button
        type="button"
        onClick={() => onEdit(sale)}
        className="flex min-h-16 flex-1 items-center justify-between gap-3 px-4 py-3 text-start"
      >
        <div className="flex min-w-0 flex-col gap-1">
          <span className="truncate text-base font-semibold text-foreground">
            {sale.crop ? sale.crop.nameAr : COPY.addShort}
          </span>
          {sale.note ? (
            <span className="truncate text-sm text-muted-foreground">
              {sale.note}
            </span>
          ) : null}
          <div className="flex flex-wrap items-center gap-1.5">
            {sale.crop ? (
              <Badge variant="outline">{sale.crop.nameAr}</Badge>
            ) : null}
            {sale.marketName ? (
              <Badge variant="secondary">{sale.marketName}</Badge>
            ) : null}
          </div>
        </div>
        <MoneyText
          fils={sale.netFils}
          className="shrink-0 text-lg font-semibold text-income"
        />
      </button>

      <div className="pe-2">
        <ConfirmDialog
          trigger={
            <Button
              type="button"
              variant="ghost"
              size="icon"
              aria-label={COPY.deleteConfirm}
              onClick={(e) => e.stopPropagation()}
            >
              <Trash2Icon className="text-expense" />
            </Button>
          }
          title={COPY.deleteTitle}
          description={`سيتم حذف دفعة بقيمة ${formatJod(sale.netFils)}. لا يمكن التراجع.`}
          confirmLabel={COPY.deleteConfirm}
          destructive
          onConfirm={() => onDelete(sale.id)}
        />
      </div>
    </div>
  )
}

export default SaleListItem
