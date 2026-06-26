"use client"

import { PackageIcon } from "lucide-react"

import { Button } from "@/components/ui/button"
import { EmptyState } from "@/components/shared"
import { unitLabels, type Unit } from "@/lib/enums"

import type { ItemWithHistory } from "../types"
import { COPY } from "../constants"
import { LowStockBadge } from "./low-stock-badge"

export type ItemListProps = {
  items: ItemWithHistory[]
  onOpenItem: (item: ItemWithHistory) => void
  onAddItem: () => void
}

export function ItemList({ items, onOpenItem, onAddItem }: ItemListProps) {
  if (items.length === 0) {
    return (
      <div className="flex flex-col items-center gap-2">
        <EmptyState
          icon={PackageIcon}
          title={COPY.emptyTitle}
          description={COPY.emptyDescription}
        />
        <Button size="lg" className="h-14" onClick={onAddItem}>
          {COPY.addItem}
        </Button>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-2">
      {items.map((item) => {
        const unitLabel = unitLabels[item.unit as Unit]
        return (
          <button
            key={item.id}
            type="button"
            onClick={() => onOpenItem(item)}
            className="flex min-h-16 items-center justify-between gap-3 rounded-xl border border-border bg-card px-4 py-3 text-start"
          >
            <div className="flex min-w-0 flex-col gap-1">
              <span className="truncate text-base font-semibold text-foreground">
                {item.nameAr}
              </span>
              <div className="flex flex-wrap items-center gap-1.5">
                <span className="text-sm text-muted-foreground">
                  {unitLabel}
                </span>
                <LowStockBadge
                  quantityOnHand={item.quantityOnHand}
                  lowStockThreshold={item.lowStockThreshold}
                />
                {item.isActive ? null : (
                  <span className="text-sm text-muted-foreground">
                    {COPY.inactive}
                  </span>
                )}
              </div>
            </div>
            <span className="shrink-0 text-lg font-semibold text-foreground">
              {item.quantityOnHand} {unitLabel}
            </span>
          </button>
        )
      })}
    </div>
  )
}

export default ItemList
