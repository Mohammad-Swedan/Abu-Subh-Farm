"use client"

import * as React from "react"
import { Controller, useForm, type Resolver } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { toast } from "sonner"
import { PlusIcon } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet"
import { MoneyInput, DateField, ScopeToggle, FormError } from "@/components/shared"
import type { Scope } from "@/lib/enums"

import { createExpenseSchema } from "../schema"
import type { CategoryOption, CropOption, ExpenseWithRelations } from "../types"
import {
  createExpenseAction,
  updateExpenseAction,
  createCategoryAction,
} from "../server/expenses.actions"

const CROP_NONE = "__none__"

export type ExpenseFormProps = {
  open: boolean
  onOpenChange: (o: boolean) => void
  mode: "create" | "edit"
  categories: CategoryOption[]
  crops: CropOption[]
  expense?: ExpenseWithRelations
  onSaved?: () => void
}

type FormValues = {
  amountFils: number | null
  categoryId: string
  date: Date
  scope: Scope
  cropId: string | null
  vendor: string
  note: string
}

function buildDefaults(expense?: ExpenseWithRelations): FormValues {
  return {
    amountFils: expense ? expense.amountFils : null,
    categoryId: expense ? expense.categoryId : "",
    date: expense ? new Date(expense.date) : new Date(),
    scope: (expense ? expense.scope : "FARM") as Scope,
    cropId: expense ? expense.cropId : null,
    vendor: expense?.vendor ?? "",
    note: expense?.note ?? "",
  }
}

export function ExpenseForm({
  open,
  onOpenChange,
  mode,
  categories,
  crops,
  expense,
  onSaved,
}: ExpenseFormProps) {
  // Categories from the server (prop) plus any created inline this session.
  // Derived, not mirrored — the inline-created ones are de-duped once a refresh
  // brings them in via props.
  const [extraCategories, setExtraCategories] = React.useState<CategoryOption[]>(
    [],
  )
  const localCategories = React.useMemo(() => {
    const ids = new Set(categories.map((c) => c.id))
    return [...categories, ...extraCategories.filter((c) => !ids.has(c.id))]
  }, [categories, extraCategories])
  const [pending, setPending] = React.useState(false)

  // New-category inline affordance.
  const [showNewCategory, setShowNewCategory] = React.useState(false)
  const [newCategoryName, setNewCategoryName] = React.useState("")
  const [creatingCategory, setCreatingCategory] = React.useState(false)

  const {
    control,
    handleSubmit,
    reset,
    setError,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(createExpenseSchema) as unknown as Resolver<FormValues>,
    defaultValues: buildDefaults(expense),
  })

  // Prefill the form fields when the sheet opens or the edited expense changes.
  React.useEffect(() => {
    if (open) reset(buildDefaults(expense))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, expense?.id])

  // Clear the inline new-category UI whenever the sheet closes (event handler,
  // not an effect — avoids cascading renders).
  function handleOpenChange(next: boolean) {
    if (!next) {
      setShowNewCategory(false)
      setNewCategoryName("")
    }
    onOpenChange(next)
  }

  async function handleCreateCategory() {
    const nameAr = newCategoryName.trim()
    if (!nameAr) return
    setCreatingCategory(true)
    try {
      const res = await createCategoryAction({ nameAr })
      if (!res.ok) {
        toast.error(res.error.message)
        return
      }
      const created = res.value as CategoryOption
      setExtraCategories((prev) => [...prev, created])
      setNewCategoryName("")
      setShowNewCategory(false)
      toast.success("تمت إضافة التصنيف")
      // Select the new category.
      reset((prev) => ({ ...prev, categoryId: created.id }))
    } finally {
      setCreatingCategory(false)
    }
  }

  const onSubmit = handleSubmit(async (values) => {
    setPending(true)
    try {
      const raw = {
        ...(mode === "edit" && expense ? { id: expense.id } : {}),
        amountFils: values.amountFils ?? 0,
        categoryId: values.categoryId,
        date: values.date,
        scope: values.scope,
        cropId: values.cropId ?? null,
        vendor: values.vendor.trim() === "" ? null : values.vendor.trim(),
        note: values.note.trim() === "" ? null : values.note.trim(),
      }

      const res =
        mode === "edit"
          ? await updateExpenseAction(raw)
          : await createExpenseAction(raw)

      if (!res.ok) {
        const fieldErrors = res.error.fieldErrors
        if (fieldErrors) {
          for (const [key, message] of Object.entries(fieldErrors)) {
            setError(key as keyof FormValues, { message })
          }
        }
        toast.error(res.error.message)
        return
      }

      toast.success(
        mode === "create" ? "تم حفظ المصروف" : "تم تعديل المصروف",
      )
      reset(buildDefaults())
      handleOpenChange(false)
      onSaved?.()
    } finally {
      setPending(false)
    }
  })

  return (
    <Sheet open={open} onOpenChange={handleOpenChange}>
      <SheetContent side="bottom" className="max-h-[92vh] overflow-y-auto">
        <SheetHeader>
          <SheetTitle className="text-lg">
            {mode === "create" ? "إضافة مصروف" : "تعديل المصروف"}
          </SheetTitle>
          <SheetDescription>
            سجّل مبلغ المصروف والتصنيف لتتابع مصاريف مزرعتك.
          </SheetDescription>
        </SheetHeader>

        <form onSubmit={onSubmit} className="flex flex-col gap-4 p-4 pt-0">
          {/* Amount */}
          <div className="flex flex-col gap-2">
            <Label htmlFor="expense-amount">المبلغ</Label>
            <Controller
              control={control}
              name="amountFils"
              render={({ field }) => (
                <MoneyInput
                  id="expense-amount"
                  value={field.value ?? null}
                  onChange={field.onChange}
                  disabled={pending}
                  placeholder="0.000"
                />
              )}
            />
            <FormError message={errors.amountFils?.message} />
          </div>

          {/* Category */}
          <div className="flex flex-col gap-2">
            <div className="flex items-center justify-between gap-2">
              <Label htmlFor="expense-category">التصنيف</Label>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => setShowNewCategory((v) => !v)}
              >
                <PlusIcon />
                تصنيف جديد
              </Button>
            </div>
            <Controller
              control={control}
              name="categoryId"
              render={({ field }) => (
                <Select
                  value={field.value || null}
                  onValueChange={(v) => field.onChange(v ?? "")}
                  items={localCategories.map((c) => ({
                    label: c.nameAr,
                    value: c.id,
                  }))}
                >
                  <SelectTrigger id="expense-category" className="h-12 w-full">
                    <SelectValue placeholder="اختر التصنيف" />
                  </SelectTrigger>
                  <SelectContent>
                    {localCategories.map((c) => (
                      <SelectItem key={c.id} value={c.id}>
                        {c.nameAr}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            />
            {showNewCategory ? (
              <div className="flex items-center gap-2">
                <Input
                  value={newCategoryName}
                  onChange={(e) => setNewCategoryName(e.target.value)}
                  placeholder="اسم التصنيف الجديد"
                  disabled={creatingCategory}
                />
                <Button
                  type="button"
                  variant="secondary"
                  className="shrink-0"
                  disabled={creatingCategory || newCategoryName.trim() === ""}
                  onClick={handleCreateCategory}
                >
                  إضافة
                </Button>
              </div>
            ) : null}
            <FormError message={errors.categoryId?.message} />
          </div>

          {/* Date */}
          <div className="flex flex-col gap-2">
            <Label htmlFor="expense-date">التاريخ</Label>
            <Controller
              control={control}
              name="date"
              render={({ field }) => (
                <DateField
                  id="expense-date"
                  value={field.value ?? null}
                  onChange={field.onChange}
                  disabled={pending}
                />
              )}
            />
            <FormError message={errors.date?.message} />
          </div>

          {/* Scope */}
          <div className="flex flex-col gap-2">
            <Label>النطاق</Label>
            <Controller
              control={control}
              name="scope"
              render={({ field }) => (
                <ScopeToggle value={field.value} onChange={field.onChange} />
              )}
            />
            <FormError message={errors.scope?.message} />
          </div>

          {/* Crop (optional) */}
          <div className="flex flex-col gap-2">
            <Label htmlFor="expense-crop">المحصول (اختياري)</Label>
            <Controller
              control={control}
              name="cropId"
              render={({ field }) => (
                <Select
                  value={field.value ?? CROP_NONE}
                  onValueChange={(v) =>
                    field.onChange(v === CROP_NONE ? null : v)
                  }
                  items={[
                    { label: "بدون", value: CROP_NONE },
                    ...crops.map((c) => ({ label: c.nameAr, value: c.id })),
                  ]}
                >
                  <SelectTrigger id="expense-crop" className="h-12 w-full">
                    <SelectValue placeholder="بدون" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value={CROP_NONE}>بدون</SelectItem>
                    {crops.map((c) => (
                      <SelectItem key={c.id} value={c.id}>
                        {c.nameAr}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            />
          </div>

          {/* Vendor (optional) */}
          <div className="flex flex-col gap-2">
            <Label htmlFor="expense-vendor">المورّد (اختياري)</Label>
            <Controller
              control={control}
              name="vendor"
              render={({ field }) => (
                <Input
                  id="expense-vendor"
                  value={field.value ?? ""}
                  onChange={field.onChange}
                  disabled={pending}
                  placeholder="اسم المورّد أو المحل"
                />
              )}
            />
          </div>

          {/* Note (optional) */}
          <div className="flex flex-col gap-2">
            <Label htmlFor="expense-note">ملاحظة (اختياري)</Label>
            <Controller
              control={control}
              name="note"
              render={({ field }) => (
                <Textarea
                  id="expense-note"
                  value={field.value ?? ""}
                  onChange={field.onChange}
                  disabled={pending}
                  placeholder="تفاصيل إضافية"
                />
              )}
            />
          </div>

          <Button
            type="submit"
            size="lg"
            className="mt-2 h-14 w-full text-lg"
            disabled={pending}
          >
            {mode === "create" ? "حفظ المصروف" : "حفظ التعديلات"}
          </Button>
        </form>
      </SheetContent>
    </Sheet>
  )
}

export default ExpenseForm
