"use client"

import * as React from "react"

import { cn } from "@/lib/utils"
import { Input } from "@/components/ui/input"
import { MONEY_SUFFIX, parseMoneyInput } from "@/lib/money"

export type MoneyInputProps = {
  value: number | null
  onChange: (fils: number | null) => void
  id?: string
  placeholder?: string
  className?: string
  disabled?: boolean
}

/**
 * Controlled money field. Keeps internal text state so the user can type
 * freely (Arabic-Indic digits, decimal separators) while reporting parsed
 * fils to the parent.
 */
export function MoneyInput({
  value,
  onChange,
  id,
  placeholder,
  className,
  disabled,
}: MoneyInputProps) {
  const [text, setText] = React.useState<string>(
    value == null ? "" : String(value / 1000),
  )
  const [prevValue, setPrevValue] = React.useState<number | null>(value)

  // Sync the visible text when the PARENT changes the value to something that
  // doesn't match what's currently typed — done during render (React's
  // recommended pattern) rather than in an effect, to avoid cascading renders.
  if (value !== prevValue) {
    setPrevValue(value)
    if (parseMoneyInput(text) !== value) {
      setText(value == null ? "" : String(value / 1000))
    }
  }

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const next = e.target.value
    setText(next)
    if (next.trim() === "") {
      onChange(null)
      return
    }
    onChange(parseMoneyInput(next))
  }

  return (
    <div className={cn("relative w-full", className)}>
      <Input
        id={id}
        inputMode="decimal"
        dir="ltr"
        placeholder={placeholder}
        disabled={disabled}
        value={text}
        onChange={handleChange}
        className="h-14 pe-14 text-lg text-start"
      />
      <span className="pointer-events-none absolute inset-y-0 end-4 flex items-center text-base text-muted-foreground">
        {MONEY_SUFFIX}
      </span>
    </div>
  )
}

export default MoneyInput
