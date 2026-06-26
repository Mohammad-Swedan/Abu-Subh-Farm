"use client"

import * as React from "react"
import {
  Controller,
  useForm,
  useWatch,
  type Control,
} from "react-hook-form"
import { toast } from "sonner"

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

import type { EmployeeOption, PaymentWithEmployee } from "../types"
import { COPY } from "../constants"
import {
  payNamedAction,
  payLumpAction,
  updatePaymentAction,
} from "../server/employees.actions"

export type PayWorkerFormProps = {
  open: boolean
  onOpenChange: (o: boolean) => void
  mode: "create" | "edit"
  employees: EmployeeOption[]
  advancesEnabled: boolean
  payment?: PaymentWithEmployee
  onSaved?: () => void
}

type PayMode = "named" | "lump"

type FormValues = {
  employeeId: string | null
  amountFils: number | null
  date: Date
  periodLabel: string
  note: string
  deductFils: number | null
  workersCount: number | null
  perWorkerRate: number | null
}

function buildDefaults(payment?: PaymentWithEmployee): FormValues {
  return {
    employeeId: payment?.employeeId ?? null,
    amountFils: payment?.amountFils ?? null,
    date: payment ? new Date(payment.date) : new Date(),
    periodLabel: payment?.periodLabel ?? "",
    note: payment?.note ?? "",
    deductFils: null,
    workersCount: payment?.workersCount ?? null,
    perWorkerRate: null,
  }
}

/** Live net = max(0, gross − deduction). */
function PayBreakdown({
  control,
  outstanding,
}: {
  control: Control<FormValues>
  outstanding: number
}) {
  const gross = useWatch({ control, name: "amountFils" })
  const deduct = useWatch({ control, name: "deductFils" })

  const { net, deductValue } = React.useMemo(() => {
    const g = typeof gross === "number" ? gross : 0
    const d = Math.min(typeof deduct === "number" ? deduct : 0, outstanding)
    return { net: Math.max(0, g - d), deductValue: d }
  }, [gross, deduct, outstanding])

  return (
    <div className="flex flex-col gap-1.5 rounded-xl bg-brand-tint px-3 py-2.5">
      <div className="flex items-center justify-between gap-3">
        <span className="text-sm text-muted-foreground">
          {COPY.breakdownGross}
        </span>
        <MoneyText fils={typeof gross === "number" ? gross : 0} />
      </div>
      <div className="flex items-center justify-between gap-3">
        <span className="text-sm text-muted-foreground">
          {COPY.breakdownDeduct}
        </span>
        <MoneyText fils={deductValue} />
      </div>
      <div className="flex items-center justify-between gap-3 border-t border-border pt-1.5">
        <span className="text-sm font-medium text-foreground">
          {COPY.breakdownNet}
        </span>
        <MoneyText fils={net} className="font-semibold text-expense" />
      </div>
    </div>
  )
}

export function PayWorkerForm({
  open,
  onOpenChange,
  mode,
  employees,
  advancesEnabled,
  payment,
  onSaved,
}: PayWorkerFormProps) {
  const [pending, setPending] = React.useState(false)
  const [payMode, setPayMode] = React.useState<PayMode>("named")

  const {
    control,
    handleSubmit,
    reset,
    setError,
    setValue,
    getValues,
    formState: { errors },
  } = useForm<FormValues>({
    defaultValues: buildDefaults(payment),
  })

  // Prefill fields when the sheet opens or the edited payment changes.
  React.useEffect(() => {
    if (open) reset(buildDefaults(payment))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, payment?.id])

  function handleOpenChange(next: boolean) {
    if (!next) setPayMode("named")
    onOpenChange(next)
  }

  const employeeId = useWatch({ control, name: "employeeId" })
  const selectedEmployee = React.useMemo(
    () => employees.find((e) => e.id === employeeId) ?? null,
    [employees, employeeId],
  )
  const outstanding = selectedEmployee?.outstandingFils ?? 0
  const showDeduction = advancesEnabled && outstanding > 0

  function handleEmployeeChange(value: string | null) {
    setValue("employeeId", value)
    const next = employees.find((e) => e.id === value) ?? null
    const current = getValues("amountFils")
    if (next && (current === null || current === 0)) {
      const suggested =
        next.payType === "MONTHLY"
          ? next.monthlySalaryFils
          : next.dailyRateFils
      if (typeof suggested === "number") {
        setValue("amountFils", suggested)
      }
    }
  }

  function handleUseAllOutstanding() {
    const gross = getValues("amountFils") ?? 0
    setValue("deductFils", Math.min(gross, outstanding))
  }

  function handleComputeLump() {
    const rate = getValues("perWorkerRate")
    const count = getValues("workersCount")
    if (typeof rate === "number" && typeof count === "number") {
      setValue("amountFils", rate * count)
    }
  }

  function applyFieldErrors(
    fieldErrors: Record<string, string> | undefined,
  ): void {
    if (!fieldErrors) return
    for (const [key, message] of Object.entries(fieldErrors)) {
      setError(key as keyof FormValues, { message })
    }
  }

  const onSubmit = handleSubmit(async (values) => {
    setPending(true)
    try {
      const trimmedPeriod = values.periodLabel.trim()
      const note = values.note.trim() === "" ? null : values.note.trim()

      if (mode === "edit" && payment) {
        const res = await updatePaymentAction({
          id: payment.id,
          amountFils: values.amountFils ?? 0,
          date: values.date,
          periodLabel: trimmedPeriod === "" ? null : trimmedPeriod,
          note,
        })
        if (!res.ok) {
          applyFieldErrors(res.error.fieldErrors)
          toast.error(res.error.message)
          return
        }
        toast.success(COPY.paymentEdited)
        reset(buildDefaults())
        handleOpenChange(false)
        onSaved?.()
        return
      }

      if (payMode === "named") {
        const res = await payNamedAction({
          employeeId: values.employeeId ?? "",
          amountFils: values.amountFils ?? 0,
          date: values.date,
          periodLabel: trimmedPeriod === "" ? null : trimmedPeriod,
          note,
          deductFils: advancesEnabled ? values.deductFils ?? 0 : 0,
        })
        if (!res.ok) {
          applyFieldErrors(res.error.fieldErrors)
          toast.error(res.error.message)
          return
        }
      } else {
        const res = await payLumpAction({
          workersCount: values.workersCount ?? 0,
          amountFils: values.amountFils ?? 0,
          date: values.date,
          periodLabel: trimmedPeriod,
          note,
        })
        if (!res.ok) {
          applyFieldErrors(res.error.fieldErrors)
          toast.error(res.error.message)
          return
        }
      }

      toast.success(COPY.paid)
      reset(buildDefaults())
      handleOpenChange(false)
      onSaved?.()
    } finally {
      setPending(false)
    }
  })

  const isEdit = mode === "edit"
  const isNamed = !isEdit && payMode === "named"
  const isLump = !isEdit && payMode === "lump"

  return (
    <Sheet open={open} onOpenChange={handleOpenChange}>
      <SheetContent side="bottom" className="max-h-[92vh] overflow-y-auto">
        <SheetHeader>
          <SheetTitle className="text-lg">
            {isEdit ? COPY.editPaymentTitle : COPY.payTitle}
          </SheetTitle>
          <SheetDescription>{COPY.payDescription}</SheetDescription>
        </SheetHeader>

        <form onSubmit={onSubmit} className="flex flex-col gap-4 p-4 pt-0">
          {/* Pay-mode segmented control (create only) */}
          {!isEdit ? (
            <div
              role="tablist"
              aria-label={COPY.payTitle}
              className="grid grid-cols-2 gap-2 rounded-xl bg-secondary p-1"
            >
              {(["named", "lump"] as const).map((m) => {
                const active = m === payMode
                return (
                  <button
                    key={m}
                    type="button"
                    role="tab"
                    aria-selected={active}
                    disabled={pending}
                    onClick={() => setPayMode(m)}
                    className={cn(
                      "flex h-12 items-center justify-center rounded-lg text-base font-medium transition-colors",
                      active
                        ? "bg-primary text-primary-foreground"
                        : "bg-secondary text-foreground hover:bg-secondary/70",
                    )}
                  >
                    {m === "named" ? COPY.modeNamed : COPY.modeLump}
                  </button>
                )
              })}
            </div>
          ) : null}

          {/* Employee picker (named only) */}
          {isNamed ? (
            <div className="flex flex-col gap-2">
              <Label htmlFor="pay-employee">{COPY.employee}</Label>
              <Controller
                control={control}
                name="employeeId"
                render={({ field }) => (
                  <Select
                    value={field.value ?? ""}
                    onValueChange={handleEmployeeChange}
                    items={employees.map((e) => ({
                      label: e.name,
                      value: e.id,
                    }))}
                  >
                    <SelectTrigger id="pay-employee" className="h-12 w-full">
                      <SelectValue placeholder={COPY.employee} />
                    </SelectTrigger>
                    <SelectContent>
                      {employees.map((e) => (
                        <SelectItem key={e.id} value={e.id}>
                          {e.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
              <FormError message={errors.employeeId?.message} />
            </div>
          ) : null}

          {/* Workers count + per-worker rate (lump only) */}
          {isLump ? (
            <>
              <div className="flex flex-col gap-2">
                <Label htmlFor="pay-workers">{COPY.workersCount}</Label>
                <Controller
                  control={control}
                  name="workersCount"
                  render={({ field }) => (
                    <Input
                      id="pay-workers"
                      inputMode="numeric"
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
                <FormError message={errors.workersCount?.message} />
              </div>

              <div className="flex flex-col gap-2">
                <Label htmlFor="pay-rate">{COPY.perWorkerRate}</Label>
                <Controller
                  control={control}
                  name="perWorkerRate"
                  render={({ field }) => (
                    <MoneyInput
                      id="pay-rate"
                      value={field.value ?? null}
                      onChange={field.onChange}
                      disabled={pending}
                      placeholder="0.000"
                    />
                  )}
                />
                <Button
                  type="button"
                  variant="secondary"
                  size="sm"
                  disabled={pending}
                  onClick={handleComputeLump}
                  className="self-start"
                >
                  احسب
                </Button>
              </div>
            </>
          ) : null}

          {/* Amount (gross for named, authoritative for lump/edit) */}
          <div className="flex flex-col gap-2">
            <Label htmlFor="pay-amount">
              {isNamed ? COPY.grossAmount : COPY.amount}
            </Label>
            <Controller
              control={control}
              name="amountFils"
              render={({ field }) => (
                <MoneyInput
                  id="pay-amount"
                  value={field.value ?? null}
                  onChange={field.onChange}
                  disabled={pending}
                  placeholder="0.000"
                />
              )}
            />
            <FormError message={errors.amountFils?.message} />
          </div>

          {/* Advance deduction + breakdown (named, advances on, outstanding) */}
          {isNamed && showDeduction ? (
            <div className="flex flex-col gap-2">
              <div className="flex items-center justify-between gap-2">
                <Label htmlFor="pay-deduct">{COPY.deduct}</Label>
                <Button
                  type="button"
                  variant="secondary"
                  size="sm"
                  disabled={pending}
                  onClick={handleUseAllOutstanding}
                >
                  {COPY.useAllOutstanding}
                </Button>
              </div>
              <Controller
                control={control}
                name="deductFils"
                render={({ field }) => (
                  <MoneyInput
                    id="pay-deduct"
                    value={field.value ?? null}
                    onChange={field.onChange}
                    disabled={pending}
                    placeholder="0.000"
                  />
                )}
              />
              <FormError message={errors.deductFils?.message} />
              <PayBreakdown control={control} outstanding={outstanding} />
            </div>
          ) : null}

          {/* Date */}
          <div className="flex flex-col gap-2">
            <Label htmlFor="pay-date">{COPY.date}</Label>
            <Controller
              control={control}
              name="date"
              render={({ field }) => (
                <DateField
                  id="pay-date"
                  value={field.value ?? null}
                  onChange={field.onChange}
                  disabled={pending}
                />
              )}
            />
            <FormError message={errors.date?.message} />
          </div>

          {/* Period / work label */}
          <div className="flex flex-col gap-2">
            <Label htmlFor="pay-period">{COPY.periodLabel}</Label>
            <Controller
              control={control}
              name="periodLabel"
              render={({ field }) => (
                <Input
                  id="pay-period"
                  value={field.value ?? ""}
                  onChange={field.onChange}
                  disabled={pending}
                  placeholder={
                    isLump
                      ? COPY.periodLabelHintLump
                      : COPY.periodLabelHintNamed
                  }
                />
              )}
            />
            <FormError message={errors.periodLabel?.message} />
          </div>

          {/* Note */}
          <div className="flex flex-col gap-2">
            <Label htmlFor="pay-note">{COPY.note}</Label>
            <Controller
              control={control}
              name="note"
              render={({ field }) => (
                <Textarea
                  id="pay-note"
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
            {isEdit ? COPY.savePayEdit : COPY.savePay}
          </Button>
        </form>
      </SheetContent>
    </Sheet>
  )
}

export default PayWorkerForm
