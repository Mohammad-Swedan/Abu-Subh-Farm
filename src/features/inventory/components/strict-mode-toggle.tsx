"use client"

import * as React from "react"
import { useRouter } from "next/navigation"

import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"

import { COPY, STRICT_COOKIE } from "../constants"

export type StrictModeToggleProps = {
  strictMode: boolean
}

/**
 * Server-driven (cookie) toggle for strict use/consumption tracking. The Switch
 * is controlled purely by the `strictMode` prop; flipping it writes the cookie
 * and refreshes so the server re-reads it.
 */
export function StrictModeToggle({ strictMode }: StrictModeToggleProps) {
  const router = useRouter()

  function handleCheckedChange(next: boolean) {
    document.cookie = `${STRICT_COOKIE}=${next ? "1" : "0"}; path=/; max-age=31536000`
    router.refresh()
  }

  return (
    <div className="flex items-center justify-between gap-3 rounded-xl border border-border bg-card px-4 py-3">
      <div className="flex min-w-0 flex-col gap-0.5">
        <Label htmlFor="inv-strict" className="text-base text-foreground">
          {COPY.strictLabel}
        </Label>
        <span className="text-sm text-muted-foreground">{COPY.strictHint}</span>
      </div>
      <Switch
        id="inv-strict"
        checked={strictMode}
        onCheckedChange={handleCheckedChange}
      />
    </div>
  )
}

export default StrictModeToggle
