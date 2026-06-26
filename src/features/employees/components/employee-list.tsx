"use client"

import { UsersIcon } from "lucide-react"
import type { Employee } from "@prisma/client"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { MoneyText, EmptyState } from "@/components/shared"

import type { OutstandingByEmployee, PayType } from "../types"
import { COPY, PAY_TYPE_LABELS } from "../constants"

export type EmployeeListProps = {
  employees: Employee[]
  outstanding: OutstandingByEmployee
  advancesEnabled: boolean
  onEdit: (e: Employee) => void
  onAddEmployee: () => void
}

export function EmployeeList({
  employees,
  outstanding,
  advancesEnabled,
  onEdit,
  onAddEmployee,
}: EmployeeListProps) {
  if (employees.length === 0) {
    return (
      <div className="flex flex-col items-center gap-2">
        <EmptyState
          icon={UsersIcon}
          title={COPY.emptyEmployeesTitle}
          description={COPY.emptyEmployeesDescription}
        />
        <Button size="lg" className="h-14" onClick={onAddEmployee}>
          {COPY.addEmployee}
        </Button>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-2">
      {employees.map((employee) => {
        const payType = employee.payType as PayType
        const rateFils =
          payType === "MONTHLY"
            ? employee.monthlySalaryFils
            : employee.dailyRateFils
        const rateLabel =
          payType === "MONTHLY" ? COPY.monthlySalary : COPY.dailyRate
        const due = outstanding[employee.id] ?? 0
        const showDue = advancesEnabled && due > 0
        // For monthly workers with an outstanding advance, show what's left of
        // the salary after the advance is taken into account.
        const showRemaining =
          showDue && payType === "MONTHLY" && employee.monthlySalaryFils != null
        const remainingFils = showRemaining
          ? Math.max(0, (employee.monthlySalaryFils ?? 0) - due)
          : 0

        return (
          <button
            key={employee.id}
            type="button"
            onClick={() => onEdit(employee)}
            className="flex min-h-16 items-center justify-between gap-3 rounded-xl border border-border bg-card px-4 py-3 text-start"
          >
            <div className="flex min-w-0 flex-col gap-1">
              <div className="flex items-center gap-2">
                <span className="truncate text-base font-bold text-foreground">
                  {employee.name}
                </span>
                {!employee.isActive ? (
                  <span className="text-sm text-muted-foreground">
                    {COPY.inactive}
                  </span>
                ) : null}
              </div>
              <div className="flex flex-wrap items-center gap-1.5">
                <Badge variant="secondary">{PAY_TYPE_LABELS[payType]}</Badge>
                {showDue ? (
                  <Badge variant="destructive">
                    {COPY.outstanding}: <MoneyText fils={due} />
                  </Badge>
                ) : null}
              </div>
            </div>
            <div className="flex shrink-0 flex-col items-end gap-0.5">
              <span className="text-xs text-muted-foreground">{rateLabel}</span>
              <MoneyText
                fils={rateFils ?? 0}
                className="text-base font-semibold text-foreground"
              />
              {showRemaining ? (
                <span className="flex items-center gap-1 text-xs text-expense">
                  {COPY.remainingSalary}:
                  <MoneyText fils={remainingFils} className="font-medium" />
                </span>
              ) : null}
            </div>
          </button>
        )
      })}
    </div>
  )
}

export default EmployeeList
