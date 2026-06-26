"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { FolderIcon, PlusIcon, RepeatIcon } from "lucide-react"

import { Button } from "@/components/ui/button"
import type { Period } from "@/lib/dates"
import type { Scope } from "@/lib/enums"

import type {
  ExpenseWithRelations,
  CategoryOption,
  CropOption,
  RecurringWithCategory,
} from "../types"
import { COPY } from "../constants"
import { deleteExpenseAction } from "../server/expenses.actions"
import { ExpenseForm } from "./expense-form"
import { ExpenseFilterBar } from "./expense-filter-bar"
import { ExpenseList } from "./expense-list"
import { CategoryManager } from "./category-manager"
import { RecurringExpenses } from "./recurring-expenses"

export type ExpensesScreenProps = {
  expenses: ExpenseWithRelations[]
  totalFils: number
  categories: CategoryOption[]
  crops: CropOption[]
  recurring: RecurringWithCategory[]
  period: Period
  categoryId?: string
  scope?: Scope
  autoOpenAdd?: boolean
}

export function ExpensesScreen({
  expenses,
  totalFils,
  categories,
  crops,
  recurring,
  period,
  categoryId,
  scope,
  autoOpenAdd,
}: ExpensesScreenProps) {
  const router = useRouter()

  // Auto-open the add form when the home quick-add lands here with ?new=1
  // (lazy initial state — no mount effect needed).
  const [formOpen, setFormOpen] = React.useState(Boolean(autoOpenAdd))
  const [editing, setEditing] = React.useState<ExpenseWithRelations | undefined>(
    undefined,
  )
  const [categoryMgrOpen, setCategoryMgrOpen] = React.useState(false)
  const [recurringOpen, setRecurringOpen] = React.useState(false)

  function openCreate() {
    setEditing(undefined)
    setFormOpen(true)
  }

  function openEdit(expense: ExpenseWithRelations) {
    setEditing(expense)
    setFormOpen(true)
  }

  async function handleDelete(id: string) {
    const res = await deleteExpenseAction({ id })
    if (!res.ok) {
      toast.error(res.error.message)
      return
    }
    toast.success("تم حذف المصروف")
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

      <ExpenseFilterBar
        categories={categories}
        period={period}
        categoryId={categoryId}
        scope={scope}
      />

      <ExpenseList
        expenses={expenses}
        totalFils={totalFils}
        onEdit={openEdit}
        onDelete={handleDelete}
        onAdd={openCreate}
      />

      <div className="grid grid-cols-2 gap-2">
        <Button
          type="button"
          variant="outline"
          className="h-12"
          onClick={() => setCategoryMgrOpen(true)}
        >
          <FolderIcon />
          {COPY.manageCategories}
        </Button>
        <Button
          type="button"
          variant="outline"
          className="h-12"
          onClick={() => setRecurringOpen(true)}
        >
          <RepeatIcon />
          {COPY.recurring}
        </Button>
      </div>

      <ExpenseForm
        open={formOpen}
        onOpenChange={setFormOpen}
        mode={editing ? "edit" : "create"}
        categories={categories}
        crops={crops}
        expense={editing}
        onSaved={() => router.refresh()}
      />

      <CategoryManager
        open={categoryMgrOpen}
        onOpenChange={setCategoryMgrOpen}
        categories={categories}
      />

      <RecurringExpenses
        open={recurringOpen}
        onOpenChange={setRecurringOpen}
        categories={categories}
        recurring={recurring}
      />
    </div>
  )
}

export default ExpensesScreen
