"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import { Controller, useForm, type Resolver } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { toast } from "sonner"
import { Trash2Icon } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
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
import { MoneyInput, MoneyText, ScopeToggle, ConfirmDialog, FormError } from "@/components/shared"
import type { Scope } from "@/lib/enums"

import { recurringExpenseSchema } from "../schema"
import type { CategoryOption, RecurringWithCategory } from "../types"
import {
  createRecurringAction,
  updateRecurringAction,
  deleteRecurringAction,
  postDueRecurringAction,
} from "../server/expenses.actions"

export type RecurringExpensesProps = {
  open: boolean
  onOpenChange: (o: boolean) => void
  categories: CategoryOption[]
  recurring: RecurringWithCategory[]
}

type FormValues = {
  nameAr: string
  amountFils: number | null
  categoryId: string
  scope: Scope
  dayOfMonth: number | null
  isActive: boolean
}

const DEFAULTS: FormValues = {
  nameAr: "",
  amountFils: null,
  categoryId: "",
  scope: "FARM",
  dayOfMonth: 1,
  isActive: false,
}

export function RecurringExpenses({
  open,
  onOpenChange,
  categories,
  recurring,
}: RecurringExpensesProps) {
  const router = useRouter()
  const [pending, setPending] = React.useState(false)

  const {
    control,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(recurringExpenseSchema) as unknown as Resolver<FormValues>,
    defaultValues: DEFAULTS,
  })

  async function handleToggle(item: RecurringWithCategory, next: boolean) {
    const res = await updateRecurringAction({
      id: item.id,
      nameAr: item.nameAr,
      amountFils: item.amountFils,
      categoryId: item.categoryId,
      scope: item.scope as Scope,
      dayOfMonth: item.dayOfMonth,
      isActive: next,
    })
    if (!res.ok) {
      toast.error(res.error.message)
      return
    }
    router.refresh()
  }

  async function handleDelete(id: string) {
    const res = await deleteRecurringAction({ id })
    if (!res.ok) {
      toast.error(res.error.message)
      return
    }
    toast.success("تم حذف المصروف الثابت")
    router.refresh()
  }

  async function handlePostDue() {
    const res = await postDueRecurringAction()
    if (!res.ok) {
      toast.error(res.error.message)
      return
    }
    const count = res.value.postedCount
    toast.success(
      count > 0 ? `تم تسجيل ${count} مصروف` : "لا يوجد مصاريف مستحقة",
    )
    router.refresh()
  }

  const onSubmit = handleSubmit(async (values) => {
    setPending(true)
    try {
      const res = await createRecurringAction({
        nameAr: values.nameAr.trim(),
        amountFils: values.amountFils ?? 0,
        categoryId: values.categoryId,
        scope: values.scope,
        dayOfMonth: values.dayOfMonth ?? 0,
        isActive: values.isActive,
      })
      if (!res.ok) {
        toast.error(res.error.message)
        return
      }
      toast.success("تمت إضافة المصروف الثابت")
      reset(DEFAULTS)
      router.refresh()
    } finally {
      setPending(false)
    }
  })

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" className="max-h-[92vh] overflow-y-auto">
        <SheetHeader>
          <SheetTitle className="text-lg">المصاريف الثابتة</SheetTitle>
          <SheetDescription>
            تكاليف شهرية ثابتة مثل الإيجار والكهرباء والرواتب. لا يتم تسجيل أي
            مصروف تلقائياً — أنت تسجّله بنفسك عند الاستحقاق.
          </SheetDescription>
        </SheetHeader>

        <div className="flex flex-col gap-4 p-4 pt-0">
          {/* Existing templates */}
          <ul className="flex flex-col gap-2">
            {recurring.map((item) => (
              <li
                key={item.id}
                className="flex items-center gap-3 rounded-xl border border-border bg-card px-3 py-3"
              >
                <div className="flex min-w-0 flex-1 flex-col gap-1">
                  <span className="truncate text-base font-semibold text-foreground">
                    {item.nameAr}
                  </span>
                  <span className="text-sm text-muted-foreground">
                    {item.category.nameAr} · يوم {item.dayOfMonth} من الشهر
                  </span>
                  <MoneyText
                    fils={item.amountFils}
                    className="text-sm font-medium text-expense"
                  />
                </div>
                <Switch
                  checked={item.isActive}
                  onCheckedChange={(v) => handleToggle(item, v)}
                  aria-label="مفعّل"
                />
                <ConfirmDialog
                  trigger={
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      aria-label="حذف"
                    >
                      <Trash2Icon className="text-expense" />
                    </Button>
                  }
                  title="حذف المصروف الثابت؟"
                  description={`سيتم حذف "${item.nameAr}".`}
                  confirmLabel="حذف"
                  destructive
                  onConfirm={() => handleDelete(item.id)}
                />
              </li>
            ))}
          </ul>

          {/* Add form */}
          <form
            onSubmit={onSubmit}
            className="flex flex-col gap-4 rounded-2xl border border-border bg-muted/30 p-4"
          >
            <h3 className="font-heading text-base font-semibold text-foreground">
              إضافة مصروف ثابت
            </h3>

            <div className="flex flex-col gap-2">
              <Label htmlFor="recurring-name">الاسم</Label>
              <Controller
                control={control}
                name="nameAr"
                render={({ field }) => (
                  <Input
                    id="recurring-name"
                    value={field.value ?? ""}
                    onChange={field.onChange}
                    disabled={pending}
                    placeholder="مثال: إيجار الأرض"
                  />
                )}
              />
              <FormError message={errors.nameAr?.message} />
            </div>

            <div className="flex flex-col gap-2">
              <Label htmlFor="recurring-amount">المبلغ</Label>
              <Controller
                control={control}
                name="amountFils"
                render={({ field }) => (
                  <MoneyInput
                    id="recurring-amount"
                    value={field.value ?? null}
                    onChange={field.onChange}
                    disabled={pending}
                  />
                )}
              />
              <FormError message={errors.amountFils?.message} />
            </div>

            <div className="flex flex-col gap-2">
              <Label htmlFor="recurring-category">التصنيف</Label>
              <Controller
                control={control}
                name="categoryId"
                render={({ field }) => (
                  <Select
                    value={field.value || null}
                    onValueChange={(v) => field.onChange(v ?? "")}
                    items={categories.map((c) => ({
                      label: c.nameAr,
                      value: c.id,
                    }))}
                  >
                    <SelectTrigger
                      id="recurring-category"
                      className="h-12 w-full"
                    >
                      <SelectValue placeholder="اختر التصنيف" />
                    </SelectTrigger>
                    <SelectContent>
                      {categories.map((c) => (
                        <SelectItem key={c.id} value={c.id}>
                          {c.nameAr}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
              <FormError message={errors.categoryId?.message} />
            </div>

            <div className="flex flex-col gap-2">
              <Label>النطاق</Label>
              <Controller
                control={control}
                name="scope"
                render={({ field }) => (
                  <ScopeToggle value={field.value} onChange={field.onChange} />
                )}
              />
            </div>

            <div className="flex flex-col gap-2">
              <Label htmlFor="recurring-day">يوم الاستحقاق من الشهر</Label>
              <Controller
                control={control}
                name="dayOfMonth"
                render={({ field }) => (
                  <Input
                    id="recurring-day"
                    type="number"
                    inputMode="numeric"
                    min={1}
                    max={31}
                    value={field.value ?? ""}
                    onChange={(e) =>
                      field.onChange(
                        e.target.value === ""
                          ? null
                          : Number.parseInt(e.target.value, 10),
                      )
                    }
                    disabled={pending}
                  />
                )}
              />
              <FormError message={errors.dayOfMonth?.message} />
            </div>

            <div className="flex items-center justify-between gap-2">
              <Label htmlFor="recurring-active">مفعّل</Label>
              <Controller
                control={control}
                name="isActive"
                render={({ field }) => (
                  <Switch
                    id="recurring-active"
                    checked={field.value}
                    onCheckedChange={field.onChange}
                  />
                )}
              />
            </div>

            <Button
              type="submit"
              size="lg"
              className="h-14 w-full"
              disabled={pending}
            >
              إضافة
            </Button>
          </form>

          {/* Post due — clearly secondary, guarded */}
          <ConfirmDialog
            trigger={
              <Button type="button" variant="outline" className="h-12 w-full">
                تسجيل المستحق هذا الشهر
              </Button>
            }
            title="تسجيل المصاريف الثابتة المستحقة؟"
            description="سيتم إنشاء مصاريف فعلية لكل مصروف ثابت مفعّل لم يُسجَّل هذا الشهر."
            confirmLabel="تسجيل"
            onConfirm={handlePostDue}
          />
        </div>
      </SheetContent>
    </Sheet>
  )
}

export default RecurringExpenses
