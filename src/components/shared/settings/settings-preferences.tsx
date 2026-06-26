"use client"

import { Card } from "@/components/ui/card"

import { PreferenceToggle } from "./preference-toggle"

// Cookie keys MIRROR `PREFERENCE_COOKIES` in `@/server/preferences`. They are
// hardcoded here on purpose: `@/server/preferences` imports `next/headers`
// (server-only), so it cannot be imported into this client component. Kept in
// sync by contract — update both if a key ever changes.
const STRICT_INVENTORY_COOKIE = "inv_strict"
const ADVANCES_COOKIE = "emp_advances"

export type SettingsPreferencesProps = {
  /** Strict inventory out-tracking is enabled (server-read). */
  strictInventory: boolean
  /** Employee advances (سلف) tracking is enabled (server-read). */
  advances: boolean
}

/** التفضيلات — optional, off-by-default feature toggles for the owner. */
export function SettingsPreferences({
  strictInventory,
  advances,
}: SettingsPreferencesProps) {
  return (
    <Card className="gap-4 p-5">
      <h2 className="font-heading text-lg text-foreground">التفضيلات</h2>

      <div className="flex flex-col gap-3">
        <PreferenceToggle
          id="pref-inv-strict"
          cookieName={STRICT_INVENTORY_COOKIE}
          checked={strictInventory}
          label="تتبّع صرف المخزون"
          hint="تسجيل صرف/استخدام المخزون بالتفصيل (اختياري)."
        />
        <PreferenceToggle
          id="pref-emp-advances"
          cookieName={ADVANCES_COOKIE}
          checked={advances}
          label="تتبّع سُلف العمال"
          hint="تسجيل سُلف العمال وخصمها من الأجور (اختياري)."
        />
      </div>

      <p className="text-sm text-muted-foreground">
        المصاريف المتكرّرة تُدار من شاشة المصاريف.
      </p>
    </Card>
  )
}

export default SettingsPreferences
