"use client"

import {
  PlusIcon,
  MinusIcon,
  PencilIcon,
  PowerIcon,
} from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet"
import { ConfirmDialog } from "@/components/shared"
import { unitLabels, type Unit } from "@/lib/enums"
import { formatJod } from "@/lib/money"
import { formatDateAr } from "@/lib/dates"

import type { ItemWithHistory } from "../types"
import { COPY } from "../constants"
import { LowStockBadge } from "./low-stock-badge"

export type ItemHistoryProps = {
  open: boolean
  onOpenChange: (o: boolean) => void
  item?: ItemWithHistory
  strictMode: boolean
  onEdit: (item: ItemWithHistory) => void
  onUse: (item: ItemWithHistory) => void
  onBuy: (item: ItemWithHistory) => void
  onToggleActive: (item: ItemWithHistory) => void
}

export function ItemHistory({
  open,
  onOpenChange,
  item,
  strictMode,
  onEdit,
  onUse,
  onBuy,
  onToggleActive,
}: ItemHistoryProps) {
  if (!item) {
    return (
      <Sheet open={open} onOpenChange={onOpenChange}>
        <SheetContent side="bottom" className="max-h-[92vh] overflow-y-auto">
          <SheetHeader>
            <SheetTitle className="text-lg">{COPY.historyTitle}</SheetTitle>
          </SheetHeader>
        </SheetContent>
      </Sheet>
    )
  }

  const unitLabel = unitLabels[item.unit as Unit]

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" className="max-h-[92vh] overflow-y-auto">
        <SheetHeader>
          <SheetTitle className="text-lg">{item.nameAr}</SheetTitle>
        </SheetHeader>

        <div className="flex flex-col gap-4 p-4 pt-0">
          {/* Summary */}
          <div className="flex items-center justify-between gap-3 rounded-xl bg-brand-tint px-4 py-3">
            <div className="flex flex-wrap items-center gap-1.5">
              <span className="text-sm text-muted-foreground">{unitLabel}</span>
              <LowStockBadge
                quantityOnHand={item.quantityOnHand}
                lowStockThreshold={item.lowStockThreshold}
              />
            </div>
            <span className="shrink-0 text-lg font-semibold text-foreground">
              {item.quantityOnHand} {unitLabel}
            </span>
          </div>

          {/* Actions */}
          <div className="flex flex-wrap items-center gap-2">
            <Button
              type="button"
              variant="secondary"
              className="h-12"
              onClick={() => onBuy(item)}
            >
              <PlusIcon />
              {COPY.buyShort}
            </Button>
            {strictMode ? (
              <Button
                type="button"
                variant="secondary"
                className="h-12"
                onClick={() => onUse(item)}
              >
                <MinusIcon />
                {COPY.use}
              </Button>
            ) : null}
            <Button
              type="button"
              variant="secondary"
              className="h-12"
              onClick={() => onEdit(item)}
            >
              <PencilIcon />
              {COPY.edit}
            </Button>
            <ConfirmDialog
              trigger={
                <Button type="button" variant="outline" className="h-12">
                  <PowerIcon />
                  {item.isActive ? COPY.deactivate : COPY.activate}
                </Button>
              }
              title={item.isActive ? COPY.deactivateTitle : COPY.activate}
              confirmLabel={
                item.isActive ? COPY.deactivateConfirm : COPY.activate
              }
              destructive={item.isActive}
              onConfirm={() => onToggleActive(item)}
            />
          </div>

          {/* History */}
          {item.transactions.length === 0 ? (
            <p className="px-1 py-4 text-center text-base text-muted-foreground">
              {COPY.historyEmpty}
            </p>
          ) : (
            <div className="flex flex-col gap-2">
              {item.transactions.map((tx) => {
                const isIn = tx.type === "IN"
                const sign = isIn ? "+" : "−"
                return (
                  <div
                    key={tx.id}
                    className="flex items-center justify-between gap-3 rounded-xl border border-border bg-card px-4 py-3"
                  >
                    <div className="flex min-w-0 flex-col gap-1">
                      <div className="flex items-center gap-1.5">
                        {isIn ? (
                          <Badge className="bg-income/10 text-income">
                            {COPY.txIn}
                          </Badge>
                        ) : (
                          <Badge variant="secondary">{COPY.txOut}</Badge>
                        )}
                        <span className="text-sm text-muted-foreground">
                          {formatDateAr(new Date(tx.date))}
                        </span>
                      </div>
                      {tx.relatedExpense ? (
                        <span className="truncate text-sm text-muted-foreground">
                          {formatJod(tx.relatedExpense.amountFils)}
                          {tx.relatedExpense.vendor
                            ? ` · ${tx.relatedExpense.vendor}`
                            : ""}
                        </span>
                      ) : null}
                    </div>
                    <span
                      className={
                        isIn
                          ? "shrink-0 text-base font-semibold text-income"
                          : "shrink-0 text-base font-semibold text-foreground"
                      }
                    >
                      {sign}
                      {tx.quantity} {unitLabel}
                    </span>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </SheetContent>
    </Sheet>
  )
}

export default ItemHistory
