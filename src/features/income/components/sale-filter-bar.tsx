"use client"

import * as React from "react"
import { useRouter, useSearchParams } from "next/navigation"

import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { PeriodPicker } from "@/components/shared"
import type { Period } from "@/lib/dates"

import type { CropOption } from "../types"
import { QP, ALL_VALUE, COPY, DEFAULT_PERIOD } from "../constants"

export type SaleFilterBarProps = {
  crops: CropOption[]
  period: Period
  cropId?: string
}

export function SaleFilterBar({ crops, period, cropId }: SaleFilterBarProps) {
  const router = useRouter()
  const searchParams = useSearchParams()

  const pushWith = React.useCallback(
    (mutate: (params: URLSearchParams) => void) => {
      const params = new URLSearchParams(searchParams.toString())
      mutate(params)
      params.delete("page") // any filter change returns to the first page
      const qs = params.toString()
      router.replace(qs ? `/income?${qs}` : "/income", { scroll: false })
    },
    [router, searchParams],
  )

  function onPeriodChange(p: Period) {
    pushWith((params) => {
      if (p === DEFAULT_PERIOD) params.delete(QP.period)
      else params.set(QP.period, p)
    })
  }

  function onCropChange(v: string | null) {
    pushWith((params) => {
      if (!v || v === ALL_VALUE) params.delete(QP.crop)
      else params.set(QP.crop, v)
    })
  }

  const cropValue = cropId ?? ALL_VALUE

  return (
    <div className="flex flex-col gap-3">
      <PeriodPicker value={period} onChange={onPeriodChange} />

      <div className="flex flex-col gap-2">
        <Label htmlFor="filter-crop">{COPY.crop}</Label>
        <Select
          value={cropValue}
          onValueChange={onCropChange}
          items={[
            { label: COPY.allCrops, value: ALL_VALUE },
            ...crops.map((c) => ({ label: c.nameAr, value: c.id })),
          ]}
        >
          <SelectTrigger id="filter-crop" className="h-12 w-full">
            <SelectValue placeholder={COPY.allCrops} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={ALL_VALUE}>{COPY.allCrops}</SelectItem>
            {crops.map((c) => (
              <SelectItem key={c.id} value={c.id}>
                {c.nameAr}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    </div>
  )
}

export default SaleFilterBar
