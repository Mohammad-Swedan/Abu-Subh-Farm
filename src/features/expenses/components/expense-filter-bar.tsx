"use client"

import * as React from "react"
import { useRouter, useSearchParams } from "next/navigation"

import { cn } from "@/lib/utils"
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
import { Scope, scopeLabels } from "@/lib/enums"

import type { CategoryOption } from "../types"
import { QP, ALL_VALUE, COPY, DEFAULT_PERIOD } from "../constants"

export type ExpenseFilterBarProps = {
  categories: CategoryOption[]
  period: Period
  categoryId?: string
  scope?: Scope
}

const SCOPE_ALL = "all"

export function ExpenseFilterBar({
  categories,
  period,
  categoryId,
  scope,
}: ExpenseFilterBarProps) {
  const router = useRouter()
  const searchParams = useSearchParams()

  const pushWith = React.useCallback(
    (mutate: (params: URLSearchParams) => void) => {
      const params = new URLSearchParams(searchParams.toString())
      mutate(params)
      const qs = params.toString()
      router.replace(qs ? `/expenses?${qs}` : "/expenses", { scroll: false })
    },
    [router, searchParams],
  )

  function onPeriodChange(p: Period) {
    pushWith((params) => {
      if (p === DEFAULT_PERIOD) params.delete(QP.period)
      else params.set(QP.period, p)
    })
  }

  function onCategoryChange(v: string | null) {
    pushWith((params) => {
      if (!v || v === ALL_VALUE) params.delete(QP.category)
      else params.set(QP.category, v)
    })
  }

  function onScopeChange(v: string) {
    pushWith((params) => {
      if (v === SCOPE_ALL) params.delete(QP.scope)
      else params.set(QP.scope, v)
    })
  }

  const categoryValue = categoryId ?? ALL_VALUE
  const scopeValue: string = scope ?? SCOPE_ALL

  const scopeButtons: { value: string; label: string }[] = [
    { value: SCOPE_ALL, label: COPY.allScopes },
    ...Scope.map((s) => ({ value: s, label: scopeLabels[s] })),
  ]

  return (
    <div className="flex flex-col gap-3">
      <PeriodPicker value={period} onChange={onPeriodChange} />

      <div className="flex flex-col gap-2">
        <Label htmlFor="filter-category">التصنيف</Label>
        <Select
          value={categoryValue}
          onValueChange={onCategoryChange}
          items={[
            { label: COPY.allCategories, value: ALL_VALUE },
            ...categories.map((c) => ({ label: c.nameAr, value: c.id })),
          ]}
        >
          <SelectTrigger id="filter-category" className="h-12 w-full">
            <SelectValue placeholder={COPY.allCategories} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={ALL_VALUE}>{COPY.allCategories}</SelectItem>
            {categories.map((c) => (
              <SelectItem key={c.id} value={c.id}>
                {c.nameAr}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div
        role="tablist"
        aria-label="النطاق"
        className="grid grid-cols-3 gap-2 rounded-xl bg-secondary p-1"
      >
        {scopeButtons.map((b) => {
          const active = b.value === scopeValue
          return (
            <button
              key={b.value}
              type="button"
              role="tab"
              aria-selected={active}
              onClick={() => onScopeChange(b.value)}
              className={cn(
                "flex h-12 items-center justify-center rounded-lg text-base font-medium transition-colors",
                active
                  ? "bg-primary text-primary-foreground"
                  : "bg-secondary text-foreground hover:bg-secondary/70",
              )}
            >
              {b.label}
            </button>
          )
        })}
      </div>
    </div>
  )
}

export default ExpenseFilterBar
