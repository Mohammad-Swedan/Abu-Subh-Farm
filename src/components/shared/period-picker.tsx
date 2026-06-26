"use client"

import { cn } from "@/lib/utils"
import { type Period, periodOptions } from "@/lib/dates"

export type PeriodPickerProps = {
  value: Period
  onChange: (p: Period) => void
  className?: string
}

/**
 * Horizontally scrollable segmented control over the available periods.
 */
export function PeriodPicker({ value, onChange, className }: PeriodPickerProps) {
  return (
    <div
      role="tablist"
      aria-label="الفترة"
      className={cn(
        "flex items-center gap-2 overflow-x-auto rounded-xl bg-secondary p-1",
        className
      )}
    >
      {periodOptions.map((option) => {
        const active = option.value === value
        return (
          <button
            key={option.value}
            type="button"
            role="tab"
            aria-selected={active}
            onClick={() => onChange(option.value)}
            className={cn(
              "flex h-12 shrink-0 items-center justify-center rounded-lg px-4 text-base font-medium whitespace-nowrap transition-colors",
              active
                ? "bg-primary text-primary-foreground"
                : "bg-secondary text-foreground hover:bg-secondary/70"
            )}
          >
            {option.label}
          </button>
        )
      })}
    </div>
  )
}

export default PeriodPicker
