"use client"

import * as React from "react"
import {
  Controller,
  useForm,
  useWatch,
  type Control,
  type Resolver,
} from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { toast } from "sonner"
import { ChevronDownIcon } from "lucide-react"

import { cn } from "@/lib/utils"
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
import { MoneyInput, MoneyText, DateField, FormError } from "@/components/shared"

import { createSaleSchema } from "../schemas/sale.schema"
import type { CropOption, SaleWithRelations } from "../types"
import { COPY, CROP_NONE } from "../constants"
import {
  createSaleAction,
  updateSaleAction,
} from "../server/income.actions"

export type SaleFormProps = {
  open: boolean
  onOpenChange: (o: boolean) => void
  mode: "create" | "edit"
  crops: CropOption[]
  sale?: SaleWithRelations
  onSaved?: () => void
}

type FormValues = {
  date: Date
  netFils: number | null
  cropId: string | null
  marketName: string
  quantityKg: number | null
  grossFils: number | null
  commissionFils: number | null
  otherDeductionsFils: number | null
  buyer: string
  note: string
}

function buildDefaults(sale?: SaleWithRelations): FormValues {
  return {
    date: sale ? new Date(sale.date) : new Date(),
    netFils: sale ? sale.netFils : null,
    cropId: sale ? sale.cropId : null,
    marketName: sale?.marketName ?? "",
    quantityKg: sale?.quantityKg ?? null,
    grossFils: sale?.grossFils ?? null,
    commissionFils: sale?.commissionFils ?? null,
    otherDeductionsFils: sale?.otherDeductionsFils ?? null,
    buyer: sale?.buyer ?? "",
    note: sale?.note ?? "",
  }
}

/** Advisory net = gross − commission − other deductions (only when gross > 0). */
function ImpliedNetHint({
  control,
  onUse,
  disabled,
}: {
  control: Control<FormValues>
  onUse: (value: number) => void
  disabled: boolean
}) {
  const gross = useWatch({ control, name: "grossFils" })
  const commission = useWatch({ control, name: "commissionFils" })
  const other = useWatch({ control, name: "otherDeductionsFils" })

  const implied = React.useMemo(() => {
    if (typeof gross !== "number" || gross <= 0) return null
    const value = gross - (commission ?? 0) - (other ?? 0)
    return Math.max(value, 0)
  }, [gross, commission, other])

  if (implied === null) return null

  return (
    <div className="flex items-center justify-between gap-3 rounded-xl bg-brand-tint px-3 py-2">
      <div className="flex flex-col">
        <span className="text-sm text-muted-foreground">{COPY.impliedNet}</span>
        <MoneyText
          fils={implied}
          className="text-base font-semibold text-income"
        />
      </div>
      <Button
        type="button"
        variant="secondary"
        size="sm"
        disabled={disabled}
        onClick={() => onUse(implied)}
      >
        {COPY.useImplied}
      </Button>
    </div>
  )
}

export function SaleForm({
  open,
  onOpenChange,
  mode,
  crops,
  sale,
  onSaved,
}: SaleFormProps) {
  const [pending, setPending] = React.useState(false)
  const [detailsOpen, setDetailsOpen] = React.useState(false)

  const {
    control,
    handleSubmit,
    reset,
    setError,
    setValue,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(createSaleSchema) as unknown as Resolver<FormValues>,
    defaultValues: buildDefaults(sale),
  })

  // Prefill the form fields when the sheet opens or the edited sale changes.
  React.useEffect(() => {
    if (open) reset(buildDefaults(sale))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, sale?.id])

  function handleOpenChange(next: boolean) {
    if (!next) setDetailsOpen(false)
    onOpenChange(next)
  }

  const onSubmit = handleSubmit(async (values) => {
    setPending(true)
    try {
      const raw = {
        ...(mode === "edit" && sale ? { id: sale.id } : {}),
        date: values.date,
        netFils: values.netFils ?? 0,
        cropId: values.cropId ?? null,
        marketName:
          values.marketName.trim() === "" ? null : values.marketName.trim(),
        quantityKg: values.quantityKg ?? null,
        grossFils: values.grossFils ?? null,
        commissionFils: values.commissionFils ?? null,
        otherDeductionsFils: values.otherDeductionsFils ?? null,
        buyer: values.buyer.trim() === "" ? null : values.buyer.trim(),
        note: values.note.trim() === "" ? null : values.note.trim(),
      }

      const res =
        mode === "edit"
          ? await updateSaleAction(raw)
          : await createSaleAction(raw)

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

      toast.success(mode === "create" ? COPY.saved : COPY.edited)
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
            {mode === "create" ? COPY.createTitle : COPY.editTitle}
          </SheetTitle>
          <SheetDescription>{COPY.formDescription}</SheetDescription>
        </SheetHeader>

        <form onSubmit={onSubmit} className="flex flex-col gap-4 p-4 pt-0">
          {/* Date (required) */}
          <div className="flex flex-col gap-2">
            <Label htmlFor="sale-date">التاريخ</Label>
            <Controller
              control={control}
              name="date"
              render={({ field }) => (
                <DateField
                  id="sale-date"
                  value={field.value ?? null}
                  onChange={field.onChange}
                  disabled={pending}
                />
              )}
            />
            <FormError message={errors.date?.message} />
          </div>

          {/* Net (required) */}
          <div className="flex flex-col gap-2">
            <Label htmlFor="sale-net">{COPY.net}</Label>
            <Controller
              control={control}
              name="netFils"
              render={({ field }) => (
                <MoneyInput
                  id="sale-net"
                  value={field.value ?? null}
                  onChange={field.onChange}
                  disabled={pending}
                  placeholder="0.000"
                />
              )}
            />
            <FormError message={errors.netFils?.message} />
          </div>

          {/* Details toggle */}
          <Button
            type="button"
            variant="ghost"
            className="h-12 justify-between"
            aria-expanded={detailsOpen}
            onClick={() => setDetailsOpen((v) => !v)}
          >
            <span className="text-base">{COPY.details}</span>
            <ChevronDownIcon
              className={cn(
                "transition-transform",
                detailsOpen && "rotate-180",
              )}
            />
          </Button>

          {detailsOpen ? (
            <div className="flex flex-col gap-4">
              {/* Crop */}
              <div className="flex flex-col gap-2">
                <Label htmlFor="sale-crop">{COPY.crop}</Label>
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
                        { label: COPY.noCrop, value: CROP_NONE },
                        ...crops.map((c) => ({ label: c.nameAr, value: c.id })),
                      ]}
                    >
                      <SelectTrigger id="sale-crop" className="h-12 w-full">
                        <SelectValue placeholder={COPY.noCrop} />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value={CROP_NONE}>{COPY.noCrop}</SelectItem>
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

              {/* Market / agent */}
              <div className="flex flex-col gap-2">
                <Label htmlFor="sale-market">{COPY.marketName}</Label>
                <Controller
                  control={control}
                  name="marketName"
                  render={({ field }) => (
                    <Input
                      id="sale-market"
                      value={field.value ?? ""}
                      onChange={field.onChange}
                      disabled={pending}
                    />
                  )}
                />
              </div>

              {/* Quantity (kg) */}
              <div className="flex flex-col gap-2">
                <Label htmlFor="sale-qty">{COPY.quantityKg}</Label>
                <Controller
                  control={control}
                  name="quantityKg"
                  render={({ field }) => (
                    <Input
                      id="sale-qty"
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
                <FormError message={errors.quantityKg?.message} />
              </div>

              {/* Gross */}
              <div className="flex flex-col gap-2">
                <Label htmlFor="sale-gross">{COPY.gross}</Label>
                <Controller
                  control={control}
                  name="grossFils"
                  render={({ field }) => (
                    <MoneyInput
                      id="sale-gross"
                      value={field.value ?? null}
                      onChange={field.onChange}
                      disabled={pending}
                      placeholder="0.000"
                    />
                  )}
                />
                <FormError message={errors.grossFils?.message} />
              </div>

              {/* Commission */}
              <div className="flex flex-col gap-2">
                <Label htmlFor="sale-commission">{COPY.commission}</Label>
                <Controller
                  control={control}
                  name="commissionFils"
                  render={({ field }) => (
                    <MoneyInput
                      id="sale-commission"
                      value={field.value ?? null}
                      onChange={field.onChange}
                      disabled={pending}
                      placeholder="0.000"
                    />
                  )}
                />
                <FormError message={errors.commissionFils?.message} />
              </div>

              {/* Other deductions */}
              <div className="flex flex-col gap-2">
                <Label htmlFor="sale-other">{COPY.otherDeductions}</Label>
                <Controller
                  control={control}
                  name="otherDeductionsFils"
                  render={({ field }) => (
                    <MoneyInput
                      id="sale-other"
                      value={field.value ?? null}
                      onChange={field.onChange}
                      disabled={pending}
                      placeholder="0.000"
                    />
                  )}
                />
                <FormError message={errors.otherDeductionsFils?.message} />
              </div>

              {/* Implied-net hint (advisory) */}
              <ImpliedNetHint
                control={control}
                disabled={pending}
                onUse={(value) =>
                  setValue("netFils", value, { shouldValidate: true })
                }
              />

              {/* Buyer */}
              <div className="flex flex-col gap-2">
                <Label htmlFor="sale-buyer">{COPY.buyer}</Label>
                <Controller
                  control={control}
                  name="buyer"
                  render={({ field }) => (
                    <Input
                      id="sale-buyer"
                      value={field.value ?? ""}
                      onChange={field.onChange}
                      disabled={pending}
                    />
                  )}
                />
              </div>

              {/* Note */}
              <div className="flex flex-col gap-2">
                <Label htmlFor="sale-note">{COPY.note}</Label>
                <Controller
                  control={control}
                  name="note"
                  render={({ field }) => (
                    <Textarea
                      id="sale-note"
                      value={field.value ?? ""}
                      onChange={field.onChange}
                      disabled={pending}
                    />
                  )}
                />
              </div>
            </div>
          ) : null}

          <Button
            type="submit"
            size="lg"
            className="mt-2 h-14 w-full text-lg"
            disabled={pending}
          >
            {mode === "create" ? COPY.save : COPY.saveEdit}
          </Button>
        </form>
      </SheetContent>
    </Sheet>
  )
}

export default SaleForm
