"use client"

import { HandCoinsIcon, Trash2Icon } from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { MoneyText, EmptyState, ConfirmDialog } from "@/components/shared"
import { formatDateAr } from "@/lib/dates"
import { formatJod } from "@/lib/money"

import type { PaymentWithEmployee } from "../types"
import { COPY } from "../constants"

export type PaymentsListProps = {
  payments: PaymentWithEmployee[]
  totalFils: number
  onEdit: (p: PaymentWithEmployee) => void
  onDelete: (id: string) => void | Promise<void>
  onAdd: () => void
}

export function PaymentsList({
  payments,
  totalFils,
  onEdit,
  onDelete,
  onAdd,
}: PaymentsListProps) {
  if (payments.length === 0) {
    return (
      <div className="flex flex-col items-center gap-2">
        <EmptyState
          icon={HandCoinsIcon}
          title={COPY.emptyPaymentsTitle}
          description={COPY.emptyPaymentsDescription}
        />
        <Button size="lg" className="h-14" onClick={onAdd}>
          {COPY.pay}
        </Button>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-4">
      {/* Period total header card */}
      <div className="flex items-center justify-between gap-3 rounded-2xl bg-brand-tint px-4 py-4">
        <span className="text-base font-medium text-foreground">
          {COPY.periodTotal}
        </span>
        <MoneyText fils={totalFils} className="text-xl font-bold text-expense" />
      </div>

      <div className="flex flex-col gap-2">
        {payments.map((payment) => {
          const isLump = payment.employeeId === null
          return (
            <div
              key={payment.id}
              className="flex items-center gap-2 rounded-xl border border-border bg-card"
            >
              <button
                type="button"
                onClick={() => onEdit(payment)}
                className="flex min-h-16 flex-1 items-center justify-between gap-3 px-4 py-3 text-start"
              >
                <div className="flex min-w-0 flex-col gap-1">
                  <span className="truncate text-base font-semibold text-foreground">
                    {payment.employee ? payment.employee.name : COPY.lumpLabel}
                  </span>
                  <div className="flex flex-wrap items-center gap-1.5">
                    {isLump ? (
                      <Badge variant="secondary">
                        {`${COPY.lumpLabel} · ${payment.workersCount ?? 0} ${COPY.worker}`}
                      </Badge>
                    ) : null}
                    {payment.periodLabel ? (
                      <Badge variant="outline">{payment.periodLabel}</Badge>
                    ) : null}
                  </div>
                  <span className="text-sm text-muted-foreground">
                    {formatDateAr(new Date(payment.date))}
                  </span>
                </div>
                <MoneyText
                  fils={payment.amountFils}
                  className="shrink-0 text-lg font-semibold text-expense"
                />
              </button>

              <div className="pe-2">
                <ConfirmDialog
                  trigger={
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      aria-label={COPY.deleteConfirm}
                      onClick={(e) => e.stopPropagation()}
                    >
                      <Trash2Icon className="text-expense" />
                    </Button>
                  }
                  title={COPY.deletePaymentTitle}
                  description={`سيتم حذف دفعة بقيمة ${formatJod(payment.amountFils)}. لا يمكن التراجع.`}
                  confirmLabel={COPY.deleteConfirm}
                  destructive
                  onConfirm={() => onDelete(payment.id)}
                />
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

export default PaymentsList
