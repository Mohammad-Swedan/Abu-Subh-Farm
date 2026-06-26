"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import {
  Controller,
  useForm,
  type Resolver,
} from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { toast } from "sonner"
import { PlusIcon, Trash2Icon } from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
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
import { MoneyInput, MoneyText, DateField, ConfirmDialog, FormError } from "@/components/shared"
import { formatDateAr } from "@/lib/dates"
import { formatJod } from "@/lib/money"

import { createAdvanceSchema } from "../schemas/advance.schema"
import type {
  AdvanceWithEmployee,
  EmployeeOption,
  OutstandingByEmployee,
} from "../types"
import { COPY } from "../constants"
import {
  createAdvanceAction,
  deleteAdvanceAction,
} from "../server/employees.actions"

export type AdvancesProps = {
  advances: AdvanceWithEmployee[]
  employees: EmployeeOption[]
  outstanding: OutstandingByEmployee
}

type AdvanceFormValues = {
  employeeId: string | null
  amountFils: number | null
  date: Date
  note: string
}

function buildAdvanceDefaults(): AdvanceFormValues {
  return {
    employeeId: null,
    amountFils: null,
    date: new Date(),
    note: "",
  }
}

function AddAdvanceSheet({
  open,
  onOpenChange,
  employees,
  onSaved,
}: {
  open: boolean
  onOpenChange: (o: boolean) => void
  employees: EmployeeOption[]
  onSaved: () => void
}) {
  const [pending, setPending] = React.useState(false)

  const {
    control,
    handleSubmit,
    reset,
    setError,
    formState: { errors },
  } = useForm<AdvanceFormValues>({
    resolver: zodResolver(
      createAdvanceSchema,
    ) as unknown as Resolver<AdvanceFormValues>,
    defaultValues: buildAdvanceDefaults(),
  })

  React.useEffect(() => {
    if (open) reset(buildAdvanceDefaults())
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open])

  const onSubmit = handleSubmit(async (values) => {
    setPending(true)
    try {
      const res = await createAdvanceAction({
        employeeId: values.employeeId ?? "",
        amountFils: values.amountFils ?? 0,
        date: values.date,
        note: values.note.trim() === "" ? null : values.note.trim(),
      })
      if (!res.ok) {
        const fieldErrors = res.error.fieldErrors
        if (fieldErrors) {
          for (const [key, message] of Object.entries(fieldErrors)) {
            setError(key as keyof AdvanceFormValues, { message })
          }
        }
        toast.error(res.error.message)
        return
      }
      toast.success(COPY.advanceSaved)
      reset(buildAdvanceDefaults())
      onOpenChange(false)
      onSaved()
    } finally {
      setPending(false)
    }
  })

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" className="max-h-[92vh] overflow-y-auto">
        <SheetHeader>
          <SheetTitle className="text-lg">{COPY.addAdvance}</SheetTitle>
          <SheetDescription>{COPY.advanceFormDescription}</SheetDescription>
        </SheetHeader>

        <form onSubmit={onSubmit} className="flex flex-col gap-4 p-4 pt-0">
          <div className="flex flex-col gap-2">
            <Label htmlFor="adv-employee">{COPY.employee}</Label>
            <Controller
              control={control}
              name="employeeId"
              render={({ field }) => (
                <Select
                  value={field.value ?? ""}
                  onValueChange={(v) => field.onChange(v)}
                  items={employees.map((e) => ({
                    label: e.name,
                    value: e.id,
                  }))}
                >
                  <SelectTrigger id="adv-employee" className="h-12 w-full">
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

          <div className="flex flex-col gap-2">
            <Label htmlFor="adv-amount">{COPY.advanceAmount}</Label>
            <Controller
              control={control}
              name="amountFils"
              render={({ field }) => (
                <MoneyInput
                  id="adv-amount"
                  value={field.value ?? null}
                  onChange={field.onChange}
                  disabled={pending}
                  placeholder="0.000"
                />
              )}
            />
            <FormError message={errors.amountFils?.message} />
          </div>

          <div className="flex flex-col gap-2">
            <Label htmlFor="adv-date">{COPY.date}</Label>
            <Controller
              control={control}
              name="date"
              render={({ field }) => (
                <DateField
                  id="adv-date"
                  value={field.value ?? null}
                  onChange={field.onChange}
                  disabled={pending}
                />
              )}
            />
            <FormError message={errors.date?.message} />
          </div>

          <div className="flex flex-col gap-2">
            <Label htmlFor="adv-note">{COPY.note}</Label>
            <Controller
              control={control}
              name="note"
              render={({ field }) => (
                <Textarea
                  id="adv-note"
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
            {COPY.addAdvance}
          </Button>
        </form>
      </SheetContent>
    </Sheet>
  )
}

export function Advances({ advances, employees }: AdvancesProps) {
  const router = useRouter()
  const [sheetOpen, setSheetOpen] = React.useState(false)

  const owing = employees.filter((e) => e.outstandingFils > 0)

  async function handleDelete(id: string) {
    const res = await deleteAdvanceAction({ id })
    if (!res.ok) {
      toast.error(res.error.message)
      return
    }
    toast.success(COPY.advanceDeleted)
    router.refresh()
  }

  return (
    <section className="flex flex-col gap-3">
      <div className="flex items-center justify-between gap-2">
        <h2 className="font-heading text-lg font-semibold text-foreground">
          {COPY.advancesTitle}
        </h2>
        <Button
          type="button"
          variant="secondary"
          size="sm"
          onClick={() => setSheetOpen(true)}
        >
          <PlusIcon />
          {COPY.addAdvance}
        </Button>
      </div>

      {/* Per-employee outstanding summary */}
      {owing.length > 0 ? (
        <div className="flex flex-col gap-1.5 rounded-xl border border-border bg-card px-4 py-3">
          {owing.map((e) => (
            <div
              key={e.id}
              className="flex items-center justify-between gap-3"
            >
              <span className="truncate text-sm text-foreground">{e.name}</span>
              <MoneyText
                fils={e.outstandingFils}
                className="text-sm font-medium text-expense"
              />
            </div>
          ))}
        </div>
      ) : null}

      {/* Advances list */}
      {advances.length === 0 ? (
        <p className="px-1 text-sm text-muted-foreground">{COPY.noAdvances}</p>
      ) : (
        <div className="flex flex-col gap-2">
          {advances.map((advance) => {
            const remaining = advance.amountFils - advance.settledAmountFils
            const canDelete = advance.settledAmountFils === 0
            return (
              <div
                key={advance.id}
                className="flex items-center gap-2 rounded-xl border border-border bg-card px-4 py-3"
              >
                <div className="flex min-w-0 flex-1 flex-col gap-1">
                  <span className="truncate text-base font-semibold text-foreground">
                    {advance.employee.name}
                  </span>
                  <span className="text-sm text-muted-foreground">
                    {formatDateAr(new Date(advance.date))}
                  </span>
                  <div className="flex flex-wrap items-center gap-1.5">
                    {advance.isSettled ? (
                      <Badge variant="secondary">{COPY.settled}</Badge>
                    ) : advance.settledAmountFils > 0 ? (
                      <Badge variant="outline">
                        {`${COPY.partiallySettled} · ${COPY.remaining}: ${formatJod(remaining)}`}
                      </Badge>
                    ) : (
                      <Badge variant="destructive">
                        {`${COPY.remaining}: ${formatJod(remaining)}`}
                      </Badge>
                    )}
                  </div>
                </div>

                <MoneyText
                  fils={advance.amountFils}
                  className="shrink-0 text-lg font-semibold text-foreground"
                />

                {canDelete ? (
                  <ConfirmDialog
                    trigger={
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        aria-label={COPY.deleteConfirm}
                      >
                        <Trash2Icon className="text-expense" />
                      </Button>
                    }
                    title={COPY.deleteAdvanceTitle}
                    description={`سيتم حذف سلفة بقيمة ${formatJod(advance.amountFils)}. لا يمكن التراجع.`}
                    confirmLabel={COPY.deleteConfirm}
                    destructive
                    onConfirm={() => handleDelete(advance.id)}
                  />
                ) : null}
              </div>
            )
          })}
        </div>
      )}

      <AddAdvanceSheet
        open={sheetOpen}
        onOpenChange={setSheetOpen}
        employees={employees}
        onSaved={() => router.refresh()}
      />
    </section>
  )
}

export default Advances
