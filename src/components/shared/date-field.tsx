"use client"

import { cn } from "@/lib/utils"
import { Input } from "@/components/ui/input"

export type DateFieldProps = {
  value: Date | null
  onChange: (d: Date | null) => void
  id?: string
  className?: string
  disabled?: boolean
}

function toInputValue(date: Date | null): string {
  if (!date || Number.isNaN(date.getTime())) return ""
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, "0")
  const d = String(date.getDate()).padStart(2, "0")
  return `${y}-${m}-${d}`
}

function fromInputValue(value: string): Date | null {
  if (!value) return null
  const [y, m, d] = value.split("-").map((part) => Number.parseInt(part, 10))
  if (!y || !m || !d) return null
  const date = new Date(y, m - 1, d)
  return Number.isNaN(date.getTime()) ? null : date
}

/**
 * Native date input mapped to/from a Date object using local yyyy-MM-dd.
 */
export function DateField({
  value,
  onChange,
  id,
  className,
  disabled,
}: DateFieldProps) {
  return (
    <Input
      id={id}
      type="date"
      disabled={disabled}
      value={toInputValue(value)}
      onChange={(e) => onChange(fromInputValue(e.target.value))}
      className={cn("h-12 text-start", className)}
    />
  )
}

export default DateField
