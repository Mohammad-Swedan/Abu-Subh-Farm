"use client"

import * as React from "react"
import {
  Controller,
  useForm,
  type Resolver,
} from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
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
import { FormError } from "@/components/shared"
import { Unit, unitLabels } from "@/lib/enums"

import { createItemSchema } from "../schemas/inventory.schema"
import type { ItemWithHistory } from "../types"
import { COPY } from "../constants"
import {
  createItemAction,
  updateItemAction,
} from "../server/inventory.actions"

export type ItemFormProps = {
  open: boolean
  onOpenChange: (o: boolean) => void
  mode: "create" | "edit"
  item?: ItemWithHistory
  onSaved?: () => void
}

type FormValues = {
  nameAr: string
  unit: Unit
  lowStockThreshold: number | null
}

function buildDefaults(item?: ItemWithHistory): FormValues {
  return {
    nameAr: item?.nameAr ?? "",
    unit: (item?.unit as Unit) ?? "KG",
    lowStockThreshold: item?.lowStockThreshold ?? null,
  }
}

export function ItemForm({
  open,
  onOpenChange,
  mode,
  item,
  onSaved,
}: ItemFormProps) {
  const [pending, setPending] = React.useState(false)

  const {
    control,
    handleSubmit,
    reset,
    setError,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(createItemSchema) as unknown as Resolver<FormValues>,
    defaultValues: buildDefaults(item),
  })

  React.useEffect(() => {
    if (open) reset(buildDefaults(item))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, item?.id])

  const onSubmit = handleSubmit(async (values) => {
    setPending(true)
    try {
      const raw = {
        ...(mode === "edit" && item ? { id: item.id } : {}),
        nameAr: values.nameAr.trim(),
        unit: values.unit,
        lowStockThreshold: values.lowStockThreshold ?? null,
      }

      const res =
        mode === "edit"
          ? await updateItemAction(raw)
          : await createItemAction(raw)

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

      toast.success(mode === "create" ? COPY.itemSaved : COPY.itemEdited)
      reset(buildDefaults())
      onOpenChange(false)
      onSaved?.()
    } finally {
      setPending(false)
    }
  })

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" className="max-h-[92vh] overflow-y-auto">
        <SheetHeader>
          <SheetTitle className="text-lg">
            {mode === "create" ? COPY.createItemTitle : COPY.editItemTitle}
          </SheetTitle>
          <SheetDescription>{COPY.itemFormDescription}</SheetDescription>
        </SheetHeader>

        <form onSubmit={onSubmit} className="flex flex-col gap-4 p-4 pt-0">
          {/* Name */}
          <div className="flex flex-col gap-2">
            <Label htmlFor="item-name">{COPY.itemName}</Label>
            <Controller
              control={control}
              name="nameAr"
              render={({ field }) => (
                <Input
                  id="item-name"
                  value={field.value ?? ""}
                  onChange={field.onChange}
                  disabled={pending}
                />
              )}
            />
            <FormError message={errors.nameAr?.message} />
          </div>

          {/* Unit */}
          <div className="flex flex-col gap-2">
            <Label htmlFor="item-unit">{COPY.unit}</Label>
            <Controller
              control={control}
              name="unit"
              render={({ field }) => (
                <Select
                  value={field.value}
                  onValueChange={field.onChange}
                  items={Unit.map((u) => ({
                    label: unitLabels[u],
                    value: u,
                  }))}
                >
                  <SelectTrigger id="item-unit" className="h-12 w-full">
                    <SelectValue placeholder={COPY.unit} />
                  </SelectTrigger>
                  <SelectContent>
                    {Unit.map((u) => (
                      <SelectItem key={u} value={u}>
                        {unitLabels[u]}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            />
            <FormError message={errors.unit?.message} />
          </div>

          {/* Low-stock threshold */}
          <div className="flex flex-col gap-2">
            <Label htmlFor="item-threshold">{COPY.lowStockThreshold}</Label>
            <Controller
              control={control}
              name="lowStockThreshold"
              render={({ field }) => (
                <Input
                  id="item-threshold"
                  inputMode="decimal"
                  value={field.value ?? ""}
                  onChange={(e) => {
                    const raw = e.target.value.trim()
                    const parsed = raw === "" ? null : Number(raw)
                    field.onChange(
                      parsed === null || Number.isNaN(parsed) ? null : parsed,
                    )
                  }}
                  disabled={pending}
                  placeholder="0"
                />
              )}
            />
            <FormError message={errors.lowStockThreshold?.message} />
          </div>

          <Button
            type="submit"
            size="lg"
            className="mt-2 h-14 w-full text-lg"
            disabled={pending}
          >
            {mode === "create" ? COPY.saveItem : COPY.saveItemEdit}
          </Button>
        </form>
      </SheetContent>
    </Sheet>
  )
}

export default ItemForm
