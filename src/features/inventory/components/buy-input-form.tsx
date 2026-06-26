"use client"

import * as React from "react"
import {
  Controller,
  useForm,
  useWatch,
  type Resolver,
} from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { toast } from "sonner"

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
import { MoneyInput, DateField, FormError } from "@/components/shared"
import { Unit, unitLabels } from "@/lib/enums"

import { buyInputSchema } from "../schemas/inventory.schema"
import type { ItemOption } from "../types"
import { COPY, NEW_ITEM_VALUE } from "../constants"
import { buyInputAction } from "../server/inventory.actions"

export type BuyInputFormProps = {
  open: boolean
  onOpenChange: (o: boolean) => void
  items: ItemOption[]
  onSaved?: () => void
}

type NewItemValues = {
  nameAr: string
  unit: Unit
  lowStockThreshold: number | null
}

type FormValues = {
  itemId: string | null
  newItem: NewItemValues | null
  quantity: number | null
  amountFils: number | null
  date: Date
  vendor: string
  note: string
}

function emptyNewItem(): NewItemValues {
  return { nameAr: "", unit: "KG", lowStockThreshold: null }
}

function buildDefaults(): FormValues {
  return {
    itemId: null,
    newItem: null,
    quantity: null,
    amountFils: null,
    date: new Date(),
    vendor: "",
    note: "",
  }
}

export function BuyInputForm({
  open,
  onOpenChange,
  items,
  onSaved,
}: BuyInputFormProps) {
  const [pending, setPending] = React.useState(false)

  const {
    control,
    handleSubmit,
    reset,
    setError,
    setValue,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(buyInputSchema) as unknown as Resolver<FormValues>,
    defaultValues: buildDefaults(),
  })

  // Reset fields each time the sheet opens.
  React.useEffect(() => {
    if (open) reset(buildDefaults())
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open])

  const newItem = useWatch({ control, name: "newItem" })
  const itemId = useWatch({ control, name: "itemId" })
  const pickerValue = newItem ? NEW_ITEM_VALUE : itemId ?? ""

  const pickerOptions = [
    { label: COPY.newItemOption, value: NEW_ITEM_VALUE },
    ...items.map((i) => ({
      label: `${i.nameAr} (${unitLabels[i.unit]})`,
      value: i.id,
    })),
  ]

  function handlePickerChange(value: string | null) {
    if (value === NEW_ITEM_VALUE) {
      setValue("itemId", null)
      setValue("newItem", emptyNewItem())
    } else {
      setValue("newItem", null)
      setValue("itemId", value)
    }
  }

  const onSubmit = handleSubmit(async (values) => {
    setPending(true)
    try {
      const raw = {
        itemId: values.newItem ? null : values.itemId,
        newItem: values.newItem
          ? {
              nameAr: values.newItem.nameAr.trim(),
              unit: values.newItem.unit,
              lowStockThreshold: values.newItem.lowStockThreshold ?? null,
            }
          : null,
        quantity: values.quantity,
        amountFils: values.amountFils,
        date: values.date,
        vendor: values.vendor.trim() === "" ? null : values.vendor.trim(),
        note: values.note.trim() === "" ? null : values.note.trim(),
      }

      const res = await buyInputAction(raw)

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

      toast.success(COPY.bought)
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
          <SheetTitle className="text-lg">{COPY.buyTitle}</SheetTitle>
          <SheetDescription>{COPY.buyDescription}</SheetDescription>
        </SheetHeader>

        <form onSubmit={onSubmit} className="flex flex-col gap-4 p-4 pt-0">
          {/* Item picker */}
          <div className="flex flex-col gap-2">
            <Label htmlFor="buy-item">{COPY.item}</Label>
            <Select
              value={pickerValue}
              onValueChange={handlePickerChange}
              items={pickerOptions}
            >
              <SelectTrigger id="buy-item" className="h-12 w-full">
                <SelectValue placeholder={COPY.item} />
              </SelectTrigger>
              <SelectContent>
                {pickerOptions.map((opt) => (
                  <SelectItem key={opt.value} value={opt.value}>
                    {opt.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <FormError message={errors.itemId?.message} />
          </div>

          {/* New item fields */}
          {newItem ? (
            <div className="flex flex-col gap-4 rounded-xl border border-border bg-card p-3">
              <div className="flex flex-col gap-2">
                <Label htmlFor="buy-new-name">{COPY.itemName}</Label>
                <Controller
                  control={control}
                  name="newItem.nameAr"
                  render={({ field }) => (
                    <Input
                      id="buy-new-name"
                      value={field.value ?? ""}
                      onChange={field.onChange}
                      disabled={pending}
                    />
                  )}
                />
                <FormError message={errors.newItem?.nameAr?.message} />
              </div>

              <div className="flex flex-col gap-2">
                <Label htmlFor="buy-new-unit">{COPY.unit}</Label>
                <Controller
                  control={control}
                  name="newItem.unit"
                  render={({ field }) => (
                    <Select
                      value={field.value}
                      onValueChange={field.onChange}
                      items={Unit.map((u) => ({
                        label: unitLabels[u],
                        value: u,
                      }))}
                    >
                      <SelectTrigger id="buy-new-unit" className="h-12 w-full">
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
                <FormError message={errors.newItem?.unit?.message} />
              </div>

              <div className="flex flex-col gap-2">
                <Label htmlFor="buy-new-threshold">
                  {COPY.lowStockThreshold}
                </Label>
                <Controller
                  control={control}
                  name="newItem.lowStockThreshold"
                  render={({ field }) => (
                    <Input
                      id="buy-new-threshold"
                      inputMode="decimal"
                      value={field.value ?? ""}
                      onChange={(e) => {
                        const raw = e.target.value.trim()
                        const parsed = raw === "" ? null : Number(raw)
                        field.onChange(
                          parsed === null || Number.isNaN(parsed)
                            ? null
                            : parsed,
                        )
                      }}
                      disabled={pending}
                      placeholder="0"
                    />
                  )}
                />
                <FormError
                  message={errors.newItem?.lowStockThreshold?.message}
                />
              </div>
            </div>
          ) : null}

          {/* Quantity */}
          <div className="flex flex-col gap-2">
            <Label htmlFor="buy-qty">{COPY.quantity}</Label>
            <Controller
              control={control}
              name="quantity"
              render={({ field }) => (
                <Input
                  id="buy-qty"
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
            <FormError message={errors.quantity?.message} />
          </div>

          {/* Amount paid */}
          <div className="flex flex-col gap-2">
            <Label htmlFor="buy-amount">{COPY.amountPaid}</Label>
            <Controller
              control={control}
              name="amountFils"
              render={({ field }) => (
                <MoneyInput
                  id="buy-amount"
                  value={field.value ?? null}
                  onChange={field.onChange}
                  disabled={pending}
                  placeholder="0.000"
                />
              )}
            />
            <FormError message={errors.amountFils?.message} />
          </div>

          {/* Date */}
          <div className="flex flex-col gap-2">
            <Label htmlFor="buy-date">التاريخ</Label>
            <Controller
              control={control}
              name="date"
              render={({ field }) => (
                <DateField
                  id="buy-date"
                  value={field.value ?? null}
                  onChange={field.onChange}
                  disabled={pending}
                />
              )}
            />
            <FormError message={errors.date?.message} />
          </div>

          {/* Vendor */}
          <div className="flex flex-col gap-2">
            <Label htmlFor="buy-vendor">{COPY.vendor}</Label>
            <Controller
              control={control}
              name="vendor"
              render={({ field }) => (
                <Input
                  id="buy-vendor"
                  value={field.value ?? ""}
                  onChange={field.onChange}
                  disabled={pending}
                />
              )}
            />
          </div>

          {/* Note */}
          <div className="flex flex-col gap-2">
            <Label htmlFor="buy-note">{COPY.note}</Label>
            <Controller
              control={control}
              name="note"
              render={({ field }) => (
                <Textarea
                  id="buy-note"
                  value={field.value ?? ""}
                  onChange={field.onChange}
                  disabled={pending}
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
            {COPY.saveBuy}
          </Button>
        </form>
      </SheetContent>
    </Sheet>
  )
}

export default BuyInputForm
