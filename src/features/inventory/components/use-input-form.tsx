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
import { Textarea } from "@/components/ui/textarea"
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet"
import { DateField, FormError } from "@/components/shared"
import { unitLabels, type Unit } from "@/lib/enums"

import { useInputSchema } from "../schemas/inventory.schema"
import type { ItemWithHistory } from "../types"
import { COPY } from "../constants"
import { recordUsageAction } from "../server/inventory.actions"

export type UseInputFormProps = {
  open: boolean
  onOpenChange: (o: boolean) => void
  item?: ItemWithHistory
  onSaved?: () => void
}

type FormValues = {
  itemId: string
  quantity: number | null
  date: Date
  note: string
}

function buildDefaults(item?: ItemWithHistory): FormValues {
  return {
    itemId: item?.id ?? "",
    quantity: null,
    date: new Date(),
    note: "",
  }
}

export function UseInputForm({
  open,
  onOpenChange,
  item,
  onSaved,
}: UseInputFormProps) {
  const [pending, setPending] = React.useState(false)

  const {
    control,
    handleSubmit,
    reset,
    setError,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(useInputSchema) as unknown as Resolver<FormValues>,
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
        itemId: values.itemId,
        quantity: values.quantity,
        date: values.date,
        note: values.note.trim() === "" ? null : values.note.trim(),
      }

      const res = await recordUsageAction(raw)

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

      toast.success(COPY.used)
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
          <SheetTitle className="text-lg">{COPY.useTitle}</SheetTitle>
          <SheetDescription>{COPY.useDescription}</SheetDescription>
        </SheetHeader>

        <form onSubmit={onSubmit} className="flex flex-col gap-4 p-4 pt-0">
          {item ? (
            <div className="flex items-center justify-between gap-3 rounded-xl bg-brand-tint px-4 py-3">
              <span className="truncate text-base font-semibold text-foreground">
                {item.nameAr}
              </span>
              <span className="shrink-0 text-sm text-muted-foreground">
                {item.quantityOnHand} {unitLabels[item.unit as Unit]}
              </span>
            </div>
          ) : null}

          {/* Quantity */}
          <div className="flex flex-col gap-2">
            <Label htmlFor="use-qty">{COPY.quantity}</Label>
            <Controller
              control={control}
              name="quantity"
              render={({ field }) => (
                <Input
                  id="use-qty"
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

          {/* Date */}
          <div className="flex flex-col gap-2">
            <Label htmlFor="use-date">التاريخ</Label>
            <Controller
              control={control}
              name="date"
              render={({ field }) => (
                <DateField
                  id="use-date"
                  value={field.value ?? null}
                  onChange={field.onChange}
                  disabled={pending}
                />
              )}
            />
            <FormError message={errors.date?.message} />
          </div>

          {/* Note */}
          <div className="flex flex-col gap-2">
            <Label htmlFor="use-note">{COPY.note}</Label>
            <Controller
              control={control}
              name="note"
              render={({ field }) => (
                <Textarea
                  id="use-note"
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
            {COPY.saveUse}
          </Button>
        </form>
      </SheetContent>
    </Sheet>
  )
}

export default UseInputForm
