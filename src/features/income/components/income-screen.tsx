"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { PlusIcon } from "lucide-react"

import { Button } from "@/components/ui/button"
import type { Period } from "@/lib/dates"

import type { SaleWithRelations, CropOption } from "../types"
import { COPY } from "../constants"
import { deleteSaleAction } from "../server/income.actions"
import { SaleForm } from "./sale-form"
import { SaleFilterBar } from "./sale-filter-bar"
import { SaleList } from "./sale-list"

export type IncomeScreenProps = {
  sales: SaleWithRelations[]
  totalFils: number
  crops: CropOption[]
  period: Period
  cropId?: string
  autoOpenAdd?: boolean
}

export function IncomeScreen({
  sales,
  totalFils,
  crops,
  period,
  cropId,
  autoOpenAdd,
}: IncomeScreenProps) {
  const router = useRouter()

  // Auto-open the add form when the home quick-add lands here with ?new=1
  // (lazy initial state — no mount effect needed).
  const [formOpen, setFormOpen] = React.useState(Boolean(autoOpenAdd))
  const [editing, setEditing] = React.useState<SaleWithRelations | undefined>(
    undefined,
  )

  function openCreate() {
    setEditing(undefined)
    setFormOpen(true)
  }

  function openEdit(sale: SaleWithRelations) {
    setEditing(sale)
    setFormOpen(true)
  }

  async function handleDelete(id: string) {
    const res = await deleteSaleAction({ id })
    if (!res.ok) {
      toast.error(res.error.message)
      return
    }
    toast.success(COPY.deleted)
    router.refresh()
  }

  return (
    <div className="flex flex-col gap-4">
      <Button
        type="button"
        size="lg"
        className="h-14 w-full bg-signature text-lg text-white hover:bg-signature/90"
        onClick={openCreate}
      >
        <PlusIcon />
        {COPY.add}
      </Button>

      <SaleFilterBar crops={crops} period={period} cropId={cropId} />

      <SaleList
        sales={sales}
        totalFils={totalFils}
        onEdit={openEdit}
        onDelete={handleDelete}
        onAdd={openCreate}
      />

      <SaleForm
        open={formOpen}
        onOpenChange={setFormOpen}
        mode={editing ? "edit" : "create"}
        crops={crops}
        sale={editing}
        onSaved={() => router.refresh()}
      />
    </div>
  )
}

export default IncomeScreen
