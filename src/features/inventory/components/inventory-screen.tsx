"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { PlusIcon } from "lucide-react"

import { Button } from "@/components/ui/button"
import { SearchInput, Pagination } from "@/components/shared"

import type { ItemWithHistory, ItemOption } from "../types"
import { COPY } from "../constants"
import { setItemActiveAction } from "../server/inventory.actions"
import { StrictModeToggle } from "./strict-mode-toggle"
import { ItemList } from "./item-list"
import { BuyInputForm } from "./buy-input-form"
import { ItemForm } from "./item-form"
import { UseInputForm } from "./use-input-form"
import { ItemHistory } from "./item-history"

export type InventoryScreenProps = {
  items: ItemWithHistory[]
  itemOptions: ItemOption[]
  strictMode: boolean
  page: number
  pageCount: number
}

export function InventoryScreen({
  items,
  itemOptions,
  strictMode,
  page,
  pageCount,
}: InventoryScreenProps) {
  const router = useRouter()

  const [buyOpen, setBuyOpen] = React.useState(false)
  const [itemFormOpen, setItemFormOpen] = React.useState(false)
  const [editingItem, setEditingItem] = React.useState<
    ItemWithHistory | undefined
  >(undefined)
  const [useOpen, setUseOpen] = React.useState(false)
  const [historyOpen, setHistoryOpen] = React.useState(false)
  const [selected, setSelected] = React.useState<ItemWithHistory | undefined>(
    undefined,
  )

  function openBuy() {
    setBuyOpen(true)
  }

  function openCreateItem() {
    setEditingItem(undefined)
    setItemFormOpen(true)
  }

  function openHistory(item: ItemWithHistory) {
    setSelected(item)
    setHistoryOpen(true)
  }

  function handleHistoryEdit(item: ItemWithHistory) {
    setHistoryOpen(false)
    setEditingItem(item)
    setItemFormOpen(true)
  }

  function handleHistoryUse(item: ItemWithHistory) {
    setHistoryOpen(false)
    setSelected(item)
    setUseOpen(true)
  }

  function handleHistoryBuy() {
    setHistoryOpen(false)
    setBuyOpen(true)
  }

  async function handleToggleActive(item: ItemWithHistory) {
    const res = await setItemActiveAction({
      id: item.id,
      isActive: !item.isActive,
    })
    if (!res.ok) {
      toast.error(res.error.message)
      return
    }
    toast.success(item.isActive ? COPY.itemDeactivated : COPY.itemActivated)
    setHistoryOpen(false)
    router.refresh()
  }

  return (
    <div className="flex flex-col gap-4">
      <Button
        type="button"
        size="lg"
        className="h-14 w-full bg-signature text-lg text-white hover:bg-signature/90"
        onClick={openBuy}
      >
        <PlusIcon />
        {COPY.buy}
      </Button>

      <Button
        type="button"
        variant="outline"
        size="lg"
        className="h-14 w-full text-lg"
        onClick={openCreateItem}
      >
        {COPY.addItem}
      </Button>

      <StrictModeToggle strictMode={strictMode} />

      <SearchInput placeholder="ابحث عن صنف بالاسم" />

      <ItemList
        items={items}
        onOpenItem={openHistory}
        onAddItem={openCreateItem}
      />

      <Pagination page={page} pageCount={pageCount} />

      <BuyInputForm
        open={buyOpen}
        onOpenChange={setBuyOpen}
        items={itemOptions}
        onSaved={() => router.refresh()}
      />

      <ItemForm
        open={itemFormOpen}
        onOpenChange={setItemFormOpen}
        mode={editingItem ? "edit" : "create"}
        item={editingItem}
        onSaved={() => router.refresh()}
      />

      <UseInputForm
        open={useOpen}
        onOpenChange={setUseOpen}
        item={selected}
        onSaved={() => router.refresh()}
      />

      <ItemHistory
        open={historyOpen}
        onOpenChange={setHistoryOpen}
        item={selected}
        strictMode={strictMode}
        onEdit={handleHistoryEdit}
        onUse={handleHistoryUse}
        onBuy={handleHistoryBuy}
        onToggleActive={handleToggleActive}
      />
    </div>
  )
}

export default InventoryScreen
