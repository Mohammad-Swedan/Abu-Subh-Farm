# Design — مزارع أبو صبح (Abu Subh Farms)

Design system: **"Jordan Valley Citrus."** The product is an Arabic-first, fully RTL
farm-management app for an **older, non-technical** farm owner in Jordan. Every choice
below serves two goals: **calm, legible, large-touch ergonomics** and a **distinctive
brand** that does not look like a default AI-generated app.

---

## 1. Palette (light mode only in v1)

All colors are mapped onto shadcn CSS variables in `src/app/globals.css` (LOCKED).
Use the Tailwind utilities; do not hard-code hex in features.

| Role | Name | Hex | Notes |
| --- | --- | --- | --- |
| Background | pale-leaf | `#F6F8F1` | app canvas (shadcn `background`) |
| Surface / card | white | `#FFFFFF` | cards, sheets |
| Border | — | `#E2E8DA` | hairlines, dividers |
| Ink / text | — | `#1F2A22` | primary text |
| Muted text | — | `#5B6B5E` | secondary text, captions |
| **Primary** | citrus-leaf green | `#2E7D4F` | **dominant brand color** (shadcn `primary`) |
| Primary dark | — | `#246340` | hover/active on primary |
| Primary tint | — | `#E4F0E8` | quiet selected/accent surfaces |
| **Signature** | Valencia orange | `#F08A24` | **separate `signature` token** — see §6 |
| Income / IN | green | `#2E7D4F` | money coming in |
| Expense / OUT | clay | `#C0492B` | money going out (shadcn `destructive`) |
| Warning | amber | `#E0A52E` | low-stock, due reminders |
| Focus ring | — | `#176B3E` | keyboard focus outline |

### Why this palette (and not the AI-default look)

It deliberately avoids the **three over-used AI-default looks**: (1) the indigo/violet
"SaaS purple" gradient, (2) flat corporate blue, and (3) the dark-mode neon-on-charcoal
dashboard. Instead it draws from the **actual Jordan Valley**: citrus-leaf green as the
calm dominant, a warm pale-leaf canvas, and a single Valencia-orange accent — colors a
farmer recognizes from the field, not from a template.

> **Important:** the orange is a **separate token**, not a theme color. It must **never**
> bleed into hover/accent surfaces. Primary green stays the dominant brand color.

---

## 2. Type — Cairo + Tajawal (both via `next/font`, Arabic-capable)

| Use | Font | Weights |
| --- | --- | --- |
| Display (headings + balance numerals) | **Cairo** | 700 |
| Body | **Tajawal** | 400 / 500 / 700 |

- Money uses **tabular figures** via the **`.nums`** utility class — digits align in columns.
- **Rubik was rejected**: it lacks full Arabic glyph coverage. Do not reintroduce it.
- Both fonts are wired through `next/font` in the locked root layout — features just use the classes.

---

## 3. Spacing & radius

- **Spacing base 4px**, scale: `4 / 8 / 12 / 16 / 24 / 32`.
- **Radius:** cards `rounded-2xl`, controls (buttons, inputs) `rounded-xl`. `--radius` is `0.75rem`.

---

## 4. Older-user ergonomics (HARD rules)

These are not suggestions — they are requirements for every feature screen.

- **Minimum 48px touch targets.** `Button` and `Input` defaults are already enlarged to `h-12`.
- **Large, readable type:** body **≥ 16px**.
- **High contrast**, **light mode default** (no dark mode in v1).
- **Numeric keypad for money:** money inputs use `inputMode="decimal"` (built into `MoneyInput`).
- **Pick-from-lists & segmented controls instead of free text** wherever possible
  (categories, crops, scope, period). Free text is a last resort.
- **Friendly empty states**, each with **exactly ONE clear primary action** (use `EmptyState`).
- **Plain-language Arabic copy** — never jargon, never English UI terms.
- **Spend boldness on the ONE signature element** (the orange balance card). Keep everything
  else quiet and calm.

---

## 5. Accessibility floor

- **Visible keyboard focus:** global `:focus-visible` outline + shadcn focus rings (focus ring `#176B3E`).
- **Respects `prefers-reduced-motion`:** `globals.css` disables animation/transition when set.
- **Responsive to phone widths** — the primary device is a phone held in one hand.

---

## 6. The signature element

There is exactly **one** bold element in the whole app: the **cash-balance card**, painted
in **Valencia orange `#F08A24`**. The orange token (`signature` color / `bg-signature`
utility) is used **only** on:

1. the **cash-balance card** (top of home + in the header), and
2. the **quick-add FAB** (the prominent add button on the home screen).

Nowhere else. It never becomes a hover color, an accent surface, or a theme color. This is
what makes the balance instantly findable for an older user — the one thing that "pops."

---

## 7. RTL rules

- Root: `<html dir="rtl" lang="ar">`.
- **Use LOGICAL CSS only:** `ms`/`me`, `ps`/`pe`, `start`/`end`, `text-start`.
- **Never** use `left`/`right` (`ml`, `pr`, `text-left`, etc.). They break in RTL.
- Icons that imply direction (back/forward, chevrons) must follow reading direction.

---

## 8. Navigation map

**Fixed bottom tab bar (5 tabs)** — defined in `src/config/nav.ts` (LOCKED):

| Tab | Arabic | Route |
| --- | --- | --- |
| Home | الرئيسية | `/` |
| Expenses | المصاريف | `/expenses` |
| Income / Sales | المبيعات | `/income` |
| Workers | العمال | `/employees` |
| **More** (opens a sheet) | المزيد | → المخزون `/inventory`, التقارير `/reports`, الإعدادات `/settings` |

- **Top header** (`AppHeader`) shows the **screen title** + the **current cash balance**.
- The **home screen** has a **prominent quick-add control** (the orange FAB) that opens a
  sheet (`QuickAddSheet`): **add expense / add sale-payout / pay worker**.

---

## 9. Shared components (LOCKED — use, do not modify)

**`src/components/shared/`:** `MoneyInput`, `MoneyText`, `DateField`, `PeriodPicker`,
`StatCard`, `EmptyState`, `ScopeToggle` (FARM/PERSONAL), `ConfirmDialog`, `PageHeader`,
`FormError`.

**`src/components/layout/`:** `BottomNav`, `AppHeader`, `QuickAddSheet`.

**`src/components/ui/`:** shadcn `base-nova` primitives (Button, Input, Card, Dialog,
Sheet, Select, Tabs, Table, Badge, Switch, Sonner toaster, …).

Build every feature screen out of these. If something looks off-system, you're probably
re-implementing a shared component — use the shared one instead.
