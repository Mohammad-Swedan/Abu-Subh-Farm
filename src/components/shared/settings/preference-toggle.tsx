"use client"

import { useRouter } from "next/navigation"

import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"

export type PreferenceToggleProps = {
  /** Cookie key this toggle reads/writes (e.g. "inv_strict"). */
  cookieName: string
  /** Current value, driven by the server (the source of truth). */
  checked: boolean
  /** Primary label shown to the owner. */
  label: string
  /** Quiet helper line under the label. */
  hint: string
  /** Stable id linking the Label to the Switch. */
  id: string
}

/**
 * Generic, server-driven (cookie-backed) preference switch. Mirrors the
 * inventory strict-mode toggle: the Switch is controlled purely by `checked`,
 * and flipping it writes the cookie in the CHANGE handler then refreshes so the
 * server re-reads it. No setState-in-effect.
 */
export function PreferenceToggle({
  cookieName,
  checked,
  label,
  hint,
  id,
}: PreferenceToggleProps) {
  const router = useRouter()

  function handleCheckedChange(next: boolean) {
    document.cookie = `${cookieName}=${next ? "1" : "0"}; path=/; max-age=31536000`
    router.refresh()
  }

  return (
    <div className="flex items-center justify-between gap-3 rounded-xl border border-border bg-card px-4 py-3">
      <div className="flex min-w-0 flex-col gap-0.5">
        <Label htmlFor={id} className="text-base text-foreground">
          {label}
        </Label>
        <span className="text-sm text-muted-foreground">{hint}</span>
      </div>
      <Switch id={id} checked={checked} onCheckedChange={handleCheckedChange} />
    </div>
  )
}

export default PreferenceToggle
