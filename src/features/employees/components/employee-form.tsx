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
import type { Employee } from "@prisma/client"

import { cn } from "@/lib/utils"
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
import { MoneyInput, FormError, ConfirmDialog } from "@/components/shared"

import {
  createEmployeeSchema,
  PAY_TYPE,
  type PayType,
} from "../schemas/employee.schema"
import { COPY, PAY_TYPE_LABELS } from "../constants"
import {
  createEmployeeAction,
  updateEmployeeAction,
  setEmployeeActiveAction,
} from "../server/employees.actions"

export type EmployeeFormProps = {
  open: boolean
  onOpenChange: (o: boolean) => void
  mode: "create" | "edit"
  employee?: Employee
  onSaved?: () => void
}

type FormValues = {
  name: string
  payType: PayType
  monthlySalaryFils: number | null
  dailyRateFils: number | null
  phone: string
  note: string
}

function buildDefaults(employee?: Employee): FormValues {
  return {
    name: employee?.name ?? "",
    payType: (employee?.payType as PayType) ?? "MONTHLY",
    monthlySalaryFils: employee?.monthlySalaryFils ?? null,
    dailyRateFils: employee?.dailyRateFils ?? null,
    phone: employee?.phone ?? "",
    note: employee?.note ?? "",
  }
}

export function EmployeeForm({
  open,
  onOpenChange,
  mode,
  employee,
  onSaved,
}: EmployeeFormProps) {
  const [pending, setPending] = React.useState(false)

  const {
    control,
    handleSubmit,
    reset,
    setError,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(
      createEmployeeSchema,
    ) as unknown as Resolver<FormValues>,
    defaultValues: buildDefaults(employee),
  })

  // Prefill fields when the sheet opens or the edited employee changes.
  React.useEffect(() => {
    if (open) reset(buildDefaults(employee))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, employee?.id])

  const payType = useWatch({ control, name: "payType" })

  async function handleToggleActive() {
    if (!employee) return
    setPending(true)
    try {
      const res = await setEmployeeActiveAction({
        id: employee.id,
        isActive: !employee.isActive,
      })
      if (!res.ok) {
        toast.error(res.error.message)
        return
      }
      toast.success(
        employee.isActive ? COPY.employeeDeactivated : COPY.employeeActivated,
      )
      onOpenChange(false)
      onSaved?.()
    } finally {
      setPending(false)
    }
  }

  const onSubmit = handleSubmit(async (values) => {
    setPending(true)
    try {
      const raw = {
        ...(mode === "edit" && employee ? { id: employee.id } : {}),
        name: values.name,
        payType: values.payType,
        monthlySalaryFils:
          values.payType === "MONTHLY" ? values.monthlySalaryFils : null,
        dailyRateFils:
          values.payType === "DAILY" ? values.dailyRateFils : null,
        phone: values.phone.trim() === "" ? null : values.phone.trim(),
        note: values.note.trim() === "" ? null : values.note.trim(),
      }

      const res =
        mode === "edit"
          ? await updateEmployeeAction(raw)
          : await createEmployeeAction(raw)

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

      toast.success(mode === "create" ? COPY.employeeSaved : COPY.employeeEdited)
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
            {mode === "create"
              ? COPY.createEmployeeTitle
              : COPY.editEmployeeTitle}
          </SheetTitle>
          <SheetDescription>{COPY.employeeFormDescription}</SheetDescription>
        </SheetHeader>

        <form onSubmit={onSubmit} className="flex flex-col gap-4 p-4 pt-0">
          {/* Name */}
          <div className="flex flex-col gap-2">
            <Label htmlFor="emp-name">{COPY.name}</Label>
            <Controller
              control={control}
              name="name"
              render={({ field }) => (
                <Input
                  id="emp-name"
                  value={field.value ?? ""}
                  onChange={field.onChange}
                  disabled={pending}
                />
              )}
            />
            <FormError message={errors.name?.message} />
          </div>

          {/* Pay type segmented control */}
          <div className="flex flex-col gap-2">
            <Label>{COPY.payType}</Label>
            <Controller
              control={control}
              name="payType"
              render={({ field }) => (
                <div
                  role="tablist"
                  aria-label={COPY.payType}
                  className="grid grid-cols-2 gap-2 rounded-xl bg-secondary p-1"
                >
                  {PAY_TYPE.map((type) => {
                    const active = type === field.value
                    return (
                      <button
                        key={type}
                        type="button"
                        role="tab"
                        aria-selected={active}
                        disabled={pending}
                        onClick={() => field.onChange(type)}
                        className={cn(
                          "flex h-12 items-center justify-center rounded-lg text-base font-medium transition-colors",
                          active
                            ? "bg-primary text-primary-foreground"
                            : "bg-secondary text-foreground hover:bg-secondary/70",
                        )}
                      >
                        {PAY_TYPE_LABELS[type]}
                      </button>
                    )
                  })}
                </div>
              )}
            />
          </div>

          {/* Conditional rate */}
          {payType === "MONTHLY" ? (
            <div className="flex flex-col gap-2">
              <Label htmlFor="emp-monthly">{COPY.monthlySalary}</Label>
              <Controller
                control={control}
                name="monthlySalaryFils"
                render={({ field }) => (
                  <MoneyInput
                    id="emp-monthly"
                    value={field.value ?? null}
                    onChange={field.onChange}
                    disabled={pending}
                    placeholder="0.000"
                  />
                )}
              />
              <FormError message={errors.monthlySalaryFils?.message} />
            </div>
          ) : (
            <div className="flex flex-col gap-2">
              <Label htmlFor="emp-daily">{COPY.dailyRate}</Label>
              <Controller
                control={control}
                name="dailyRateFils"
                render={({ field }) => (
                  <MoneyInput
                    id="emp-daily"
                    value={field.value ?? null}
                    onChange={field.onChange}
                    disabled={pending}
                    placeholder="0.000"
                  />
                )}
              />
              <FormError message={errors.dailyRateFils?.message} />
            </div>
          )}

          {/* Phone */}
          <div className="flex flex-col gap-2">
            <Label htmlFor="emp-phone">{COPY.phone}</Label>
            <Controller
              control={control}
              name="phone"
              render={({ field }) => (
                <Input
                  id="emp-phone"
                  inputMode="tel"
                  dir="ltr"
                  value={field.value ?? ""}
                  onChange={field.onChange}
                  disabled={pending}
                  className="text-start"
                />
              )}
            />
            <FormError message={errors.phone?.message} />
          </div>

          {/* Note */}
          <div className="flex flex-col gap-2">
            <Label htmlFor="emp-note">{COPY.note}</Label>
            <Controller
              control={control}
              name="note"
              render={({ field }) => (
                <Textarea
                  id="emp-note"
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
            {mode === "create" ? COPY.saveEmployee : COPY.saveEmployeeEdit}
          </Button>

          {mode === "edit" && employee ? (
            <ConfirmDialog
              trigger={
                <Button
                  type="button"
                  variant="outline"
                  className="h-12 w-full"
                  disabled={pending}
                >
                  {employee.isActive ? COPY.deactivate : COPY.activate}
                </Button>
              }
              title={employee.isActive ? COPY.deactivateTitle : COPY.activate}
              confirmLabel={
                employee.isActive ? COPY.deactivateConfirm : COPY.activate
              }
              destructive={employee.isActive}
              onConfirm={handleToggleActive}
            />
          ) : null}
        </form>
      </SheetContent>
    </Sheet>
  )
}

export default EmployeeForm
