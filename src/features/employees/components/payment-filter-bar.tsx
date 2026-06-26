"use client"

import * as React from "react"
import { useRouter, useSearchParams } from "next/navigation"

import { PeriodPicker } from "@/components/shared"
import type { Period } from "@/lib/dates"

import { QP, DEFAULT_PERIOD } from "../constants"

export type PaymentFilterBarProps = {
  period: Period
}

export function PaymentFilterBar({ period }: PaymentFilterBarProps) {
  const router = useRouter()
  const searchParams = useSearchParams()

  const pushWith = React.useCallback(
    (mutate: (params: URLSearchParams) => void) => {
      const params = new URLSearchParams(searchParams.toString())
      mutate(params)
      const qs = params.toString()
      router.replace(qs ? `/employees?${qs}` : "/employees", { scroll: false })
    },
    [router, searchParams],
  )

  function onPeriodChange(p: Period) {
    pushWith((params) => {
      if (p === DEFAULT_PERIOD) params.delete(QP.period)
      else params.set(QP.period, p)
    })
  }

  return (
    <div className="flex flex-col gap-3">
      <PeriodPicker value={period} onChange={onPeriodChange} />
    </div>
  )
}

export default PaymentFilterBar
