"use client"

import { cn } from "@/lib/utils"
import { Scope, scopeLabels } from "@/lib/enums"

export type ScopeToggleProps = {
  value: Scope
  onChange: (s: Scope) => void
  className?: string
}

/**
 * Two large segmented buttons: FARM / PERSONAL.
 */
export function ScopeToggle({ value, onChange, className }: ScopeToggleProps) {
  return (
    <div
      role="tablist"
      aria-label="النطاق"
      className={cn(
        "grid grid-cols-2 gap-2 rounded-xl bg-secondary p-1",
        className
      )}
    >
      {Scope.map((scope) => {
        const active = scope === value
        return (
          <button
            key={scope}
            type="button"
            role="tab"
            aria-selected={active}
            onClick={() => onChange(scope)}
            className={cn(
              "flex h-12 items-center justify-center rounded-lg text-base font-medium transition-colors",
              active
                ? "bg-primary text-primary-foreground"
                : "bg-secondary text-foreground hover:bg-secondary/70"
            )}
          >
            {scopeLabels[scope]}
          </button>
        )
      })}
    </div>
  )
}

export default ScopeToggle
