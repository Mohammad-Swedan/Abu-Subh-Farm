// Central read surface for the app's optional, off-by-default feature toggles.
//
// These cookie keys MIRROR the per-feature constants so the central Settings
// screen and the feature screens read/write the SAME cookie:
//   - "inv_strict"   → inventory strict use/consumption tracking
//                      (src/features/inventory/constants.ts STRICT_COOKIE)
//   - "emp_advances" → employee advances (سلف) tracking
//                      (src/features/employees/constants.ts ADVANCES_COOKIE)
// They are duplicated here as literals on purpose: this keeps the integration
// layer decoupled from feature internals (no cross-feature import) while staying
// in sync by contract.
import { cookies } from "next/headers";

export const PREFERENCE_COOKIES = {
  strictInventory: "inv_strict",
  advances: "emp_advances",
} as const;

export type PreferenceKey = keyof typeof PREFERENCE_COOKIES;

export type Preferences = {
  /** Strict inventory out-tracking (صرف/استخدام) is enabled. */
  strictInventory: boolean;
  /** Employee advances (سلف) tracking is enabled. */
  advances: boolean;
};

/** Read the optional-feature preferences from the request cookies (server-side). */
export async function getPreferences(): Promise<Preferences> {
  const store = await cookies();
  return {
    strictInventory:
      store.get(PREFERENCE_COOKIES.strictInventory)?.value === "1",
    advances: store.get(PREFERENCE_COOKIES.advances)?.value === "1",
  };
}
