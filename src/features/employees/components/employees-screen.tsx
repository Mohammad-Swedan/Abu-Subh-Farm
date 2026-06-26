"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { HandCoinsIcon, PlusIcon } from "lucide-react"
import type { Employee } from "@prisma/client"

import { Button } from "@/components/ui/button"
import type { Period } from "@/lib/dates"

import type {
  AdvanceWithEmployee,
  EmployeeOption,
  OutstandingByEmployee,
  PaymentWithEmployee,
} from "../types"
import { COPY } from "../constants"
import { deletePaymentAction } from "../server/employees.actions"
import { AdvancesToggle } from "./advances-toggle"
import { EmployeeList } from "./employee-list"
import { EmployeeForm } from "./employee-form"
import { PayWorkerForm } from "./pay-worker-form"
import { PaymentsList } from "./payments-list"
import { PaymentFilterBar } from "./payment-filter-bar"
import { Advances } from "./advances"

export type EmployeesScreenProps = {
  employees: Employee[]
  employeeOptions: EmployeeOption[]
  outstanding: OutstandingByEmployee
  payments: PaymentWithEmployee[]
  paymentsTotalFils: number
  advances: AdvanceWithEmployee[]
  period: Period
  advancesEnabled: boolean
  autoOpenAdd?: boolean
}

export function EmployeesScreen({
  employees,
  employeeOptions,
  outstanding,
  payments,
  paymentsTotalFils,
  advances,
  period,
  advancesEnabled,
  autoOpenAdd,
}: EmployeesScreenProps) {
  const router = useRouter()

  // Auto-open the pay form when the home quick-add lands here with ?new=1
  // (lazy initial state — no mount effect needed).
  const [payOpen, setPayOpen] = React.useState(Boolean(autoOpenAdd))
  const [editingPayment, setEditingPayment] = React.useState<
    PaymentWithEmployee | undefined
  >(undefined)

  const [employeeFormOpen, setEmployeeFormOpen] = React.useState(false)
  const [editingEmployee, setEditingEmployee] = React.useState<
    Employee | undefined
  >(undefined)

  function openPayCreate() {
    setEditingPayment(undefined)
    setPayOpen(true)
  }

  function openPayEdit(payment: PaymentWithEmployee) {
    setEditingPayment(payment)
    setPayOpen(true)
  }

  function openEmployeeCreate() {
    setEditingEmployee(undefined)
    setEmployeeFormOpen(true)
  }

  function openEmployeeEdit(employee: Employee) {
    setEditingEmployee(employee)
    setEmployeeFormOpen(true)
  }

  async function handleDeletePayment(id: string) {
    const res = await deletePaymentAction({ id })
    if (!res.ok) {
      toast.error(res.error.message)
      return
    }
    toast.success(COPY.paymentDeleted)
    router.refresh()
  }

  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-col gap-3">
        <Button
          type="button"
          size="lg"
          className="h-14 w-full bg-signature text-lg text-white hover:bg-signature/90"
          onClick={openPayCreate}
        >
          <HandCoinsIcon />
          {COPY.pay}
        </Button>
        <Button
          type="button"
          variant="outline"
          size="lg"
          className="h-14 w-full text-lg"
          onClick={openEmployeeCreate}
        >
          <PlusIcon />
          {COPY.addEmployee}
        </Button>
      </div>

      <AdvancesToggle advancesEnabled={advancesEnabled} />

      <section className="flex flex-col gap-3">
        <h2 className="font-heading text-lg font-semibold text-foreground">
          {COPY.employeesTitle}
        </h2>
        <EmployeeList
          employees={employees}
          outstanding={outstanding}
          advancesEnabled={advancesEnabled}
          onEdit={openEmployeeEdit}
          onAddEmployee={openEmployeeCreate}
        />
      </section>

      {advancesEnabled ? (
        <Advances
          advances={advances}
          employees={employeeOptions}
          outstanding={outstanding}
        />
      ) : null}

      <section className="flex flex-col gap-3">
        <h2 className="font-heading text-lg font-semibold text-foreground">
          {COPY.paymentsTitle}
        </h2>
        <PaymentFilterBar period={period} />
        <PaymentsList
          payments={payments}
          totalFils={paymentsTotalFils}
          onEdit={openPayEdit}
          onDelete={handleDeletePayment}
          onAdd={openPayCreate}
        />
      </section>

      <EmployeeForm
        open={employeeFormOpen}
        onOpenChange={setEmployeeFormOpen}
        mode={editingEmployee ? "edit" : "create"}
        employee={editingEmployee}
        onSaved={() => router.refresh()}
      />

      <PayWorkerForm
        open={payOpen}
        onOpenChange={setPayOpen}
        mode={editingPayment ? "edit" : "create"}
        employees={employeeOptions}
        advancesEnabled={advancesEnabled}
        payment={editingPayment}
        onSaved={() => router.refresh()}
      />
    </div>
  )
}

export default EmployeesScreen
