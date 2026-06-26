export const MONEY_SUFFIX = "د.أ";

const jodFormatter = new Intl.NumberFormat("en-US", {
  minimumFractionDigits: 3,
  maximumFractionDigits: 3,
});

export function filsToJod(fils: number): number {
  return fils / 1000;
}

export function jodToFils(jod: number): number {
  return Math.round(jod * 1000);
}

/**
 * Format fils (integer minor units) as a JOD string with exactly 3 decimals,
 * thousands grouping, Western digits, and (by default) the " د.أ" suffix.
 * Negative values keep the sign before the number.
 */
export function formatJod(
  fils: number,
  opts?: { withSuffix?: boolean },
): string {
  const withSuffix = opts?.withSuffix ?? true;
  const formatted = jodFormatter.format(fils / 1000);
  return withSuffix ? `${formatted} ${MONEY_SUFFIX}` : formatted;
}

const ARABIC_INDIC_ZERO = 0x0660; // ٠
const EXTENDED_ARABIC_INDIC_ZERO = 0x06f0; // ۰

/**
 * Parse a user-typed JOD amount into fils.
 * Accepts Western and Arabic-Indic digits, Arabic decimal separator,
 * grouping commas/spaces. Returns null for invalid or negative input.
 */
export function parseMoneyInput(input: string): number | null {
  if (input == null) return null;

  // Convert Arabic-Indic digits to Western and normalize separators.
  let normalized = "";
  for (const ch of input) {
    const code = ch.codePointAt(0)!;
    if (code >= ARABIC_INDIC_ZERO && code <= ARABIC_INDIC_ZERO + 9) {
      normalized += String(code - ARABIC_INDIC_ZERO);
    } else if (
      code >= EXTENDED_ARABIC_INDIC_ZERO &&
      code <= EXTENDED_ARABIC_INDIC_ZERO + 9
    ) {
      normalized += String(code - EXTENDED_ARABIC_INDIC_ZERO);
    } else if (ch === "٫") {
      // Arabic decimal separator
      normalized += ".";
    } else if (ch === "٬" || ch === ",") {
      // Arabic thousands separator / Western comma => drop grouping
      continue;
    } else {
      normalized += ch;
    }
  }

  // Strip grouping spaces.
  normalized = normalized.replace(/\s/g, "").trim();

  if (normalized === "") return null;
  // Only digits and at most one decimal point allowed.
  if (!/^\d*\.?\d+$|^\d+\.?\d*$/.test(normalized)) return null;

  const value = Number.parseFloat(normalized);
  if (!Number.isFinite(value) || value < 0) return null;

  return Math.round(value * 1000);
}
