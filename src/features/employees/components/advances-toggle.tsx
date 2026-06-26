"use client"

import * as React from "react"
import { useRouter } from "next/navigation"

import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"

import { COPY, ADVANCES_COOKIE } from "../constants"

export type AdvancesToggleProps = {
  advancesEnabled: boolean
}

/**
 * Server-driven (cookie) toggle for the advances (سلف) feature. The Switch is
 * controlled purely by the `advancesEnabled` prop; flipping it writes the cookie
 * and refreshes so the server re-reads it.
 */
export function AdvancesToggle({ advancesEnabled }: AdvancesToggleProps) {
  const router = useRouter()

  function handleCheckedChange(next: boolean) {
    document.cookie = `${ADVANCES_COOKIE}=${next ? "1" : "0"}; path=/; max-age=31536000`
    router.refresh()
  }

  return (
    <div className="flex items-center justify-between gap-3 rounded-xl border border-border bg-card px-4 py-3">
      <div className="flex min-w-0 flex-col gap-0.5">
        <Label htmlFor="emp-advances" className="text-base text-foreground">
          {COPY.advancesLabel}
        </Label>
        <span className="text-sm text-muted-foreground">
          {COPY.advancesHint}
        </span>
      </div>
      <Switch
        id="emp-advances"
        checked={advancesEnabled}
        onCheckedChange={handleCheckedChange}
      />
    </div>
  )
}

export default AdvancesToggle
