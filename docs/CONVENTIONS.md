# Conventions — مزارع أبو صبح (Abu Subh Farms)

These are the shared rules every feature team (Expenses, Income, Inventory, Employees)
follows. They exist so four teams can build **in parallel** on the same foundation
without colliding. Read this together with [ARCHITECTURE.md](./ARCHITECTURE.md),
[DESIGN.md](./DESIGN.md), and [FEATURE-CONTRACT.md](./FEATURE-CONTRACT.md).

---

## 1. Stack (already installed, pinned — add ZERO new dependencies)

| Area | Choice |
| --- | --- |
| Framework | **Next.js 15** (App Router, `src/` dir) |
| UI runtime | **React 19** |
| Language | **TypeScript**, `strict` mode |
| ORM / DB | **Prisma 6** (`prisma-client-js` generator) + **SQLite** (`url = env("DATABASE_URL")`); client imported from `@prisma/client` |
| Styling | **Tailwind CSS v4** — CSS-first `@theme` in `src/app/globals.css`. **There is NO `tailwind.config.js`.** |
| Components | **shadcn/ui**, style **`base-nova`**, built on **`@base-ui/react`** (NOT Radix). Primitives live in `src/components/ui`. |
| Icons | **lucide-react 1.x** — icons use the **`Icon` suffix** (e.g. `HomeIcon`, `ReceiptTextIcon`). |
| Validation | **Zod 4** |
| Forms | **react-hook-form 7** + **@hookform/resolvers** |
| Dates | **date-fns 4** with the **`ar`** locale (helpers in `src/lib/dates.ts`) |
| Hashing | **bcryptjs** |
| Charts | **recharts** (dashboard/reports, later) |
| Toasts | **sonner** |
| Seed runner | **tsx** |

The full dependency set is locked in `package.json`. **Do not add, upgrade, or remove
any dependency.** If you think you need a new package, you don't — solve it with what's here.

---

## 2. Feature-folder layout

Each feature lives **only** under `src/features/<name>/`. A feature is one of:
`expenses`, `income`, `inventory`, `employees`.

```
src/features/<name>/
  server/
    <name>.actions.ts    # 'use server' — thin; wraps the service; returns Result<T>
    <name>.service.ts     # business logic; posts to the ledger; uses prisma
  components/             # feature-only UI (forms, lists, cards)
  schema.ts              # Zod schemas for this feature's inputs
```

You also **replace your own placeholder page** in the `(app)` route group, e.g.
`src/app/(app)/expenses/page.tsx`. You add files **only** under your own
`src/features/<name>/` folder (and your own page). Nothing else.

> **Never import another feature's code.** Features coordinate only through shared
> Prisma models and the shared ledger service. See [ARCHITECTURE.md](./ARCHITECTURE.md).

---

## 3. The `Result<T>` pattern

Defined in `src/lib/result.ts`. **Both services and Server Actions return `Result<T>`** —
never throw across a layer boundary for expected/validation errors.

```ts
export type ResultError = {
  code: string;
  message: string;                       // plain Arabic, user-facing
  fieldErrors?: Record<string, string>;  // keyed by field name → inline message
};

export type Result<T> =
  | { ok: true; value: T }
  | { ok: false; error: ResultError };

export function ok<T>(value: T): Result<T>;
export function err(code: string, message: string, fieldErrors?: Record<string, string>): Result<never>;
export function fromZodError(error: z.ZodError): ResultError; // → { code: "VALIDATION", message, fieldErrors }
```

Usage:

```ts
import { ok, err, type Result } from "@/lib/result";

function example(amount: number): Result<number> {
  if (amount <= 0) return err("INVALID_AMOUNT", "المبلغ يجب أن يكون أكبر من صفر");
  return ok(amount);
}
```

**UI contract:** on `{ ok: false }`, render `error.fieldErrors[field]` inline (via the
shared `FormError` component) **and** show a `sonner` toast with `error.message`. On
`{ ok: true }`, proceed (e.g. close the sheet, refresh the list).

---

## 4. The Server Action pattern

- File: `src/features/<name>/server/<name>.actions.ts`, first line **`'use server'`**.
- The action is **thin**: parse with Zod, call the service, return its `Result<T>`.
- All business logic (ledger posting, transactions) lives in the **service**, never in the action.
- Use `requireUser()` from `src/lib/auth` to enforce the session.

```ts
// src/features/expenses/server/expenses.actions.ts
"use server";

import { requireUser } from "@/lib/auth";
import { fromZodError, type Result } from "@/lib/result";
import { createExpenseSchema } from "../schema";
import { createExpense } from "./expenses.service";
import type { Expense } from "@prisma/client";

export async function createExpenseAction(raw: unknown): Promise<Result<Expense>> {
  await requireUser();
  const parsed = createExpenseSchema.safeParse(raw);
  if (!parsed.success) return { ok: false, error: fromZodError(parsed.error) };
  return createExpense(parsed.data); // service returns Result<Expense>
}
```

The matching service is shown in [FEATURE-CONTRACT.md](./FEATURE-CONTRACT.md).

---

## 5. Money is ALWAYS integer **fils**

- **1 JOD = 1000 fils.** All money is stored and passed as `Int` fils. **NEVER use a float for money.**
- Quantities (kg / L) **may** be `Float` — that is the only place floats are allowed.
- All money columns are named with the `Fils` suffix (`amountFils`, `netFils`, `dailyRateFils`, …).
- Helpers live in `src/lib/money.ts`:

| Helper | Purpose |
| --- | --- |
| `jodToFils(jod)` | parse a numeric JOD → fils (`Math.round`) |
| `filsToJod(fils)` | fils → JOD number |
| `formatJod(fils)` | → `"12.500 د.أ"` (3 decimals, suffix on by default) |
| `parseMoneyInput(str)` | user text (Arabic/Western digits) → fils, or `null` if invalid/negative |
| `MONEY_SUFFIX` | `"د.أ"` |

In the UI, **always** input money through the shared `MoneyInput` and display it through
`MoneyText` — never hand-format money.

---

## 6. Enums are TS `as const` unions + Zod (no Prisma enums)

SQLite has no enum type, so enum-like values are **TypeScript `as const` unions + a Zod
schema**, stored in **`String`** columns. The shared ones live in `src/lib/enums.ts`:

| Union | Values | Zod | Label map (Arabic) |
| --- | --- | --- | --- |
| `Direction` | `IN` \| `OUT` | `DirectionSchema` | `directionLabels` |
| `Scope` | `FARM` \| `PERSONAL` | `ScopeSchema` | `scopeLabels` |
| `Unit` | `KG` \| `L` | `UnitSchema` | `unitLabels` |
| `LedgerSource` | `EXPENSE` \| `SALE` \| `SALARY` \| `ADJUSTMENT` | `LedgerSourceSchema` | `ledgerSourceLabels` |

Reuse these — do not redeclare your own copies. If a value is part of a shared model,
it is already here.

---

## 7. Naming conventions

| Thing | Convention | Example |
| --- | --- | --- |
| Files | kebab-case | `expenses.service.ts`, `money-input.tsx` |
| Feature folder | singular feature noun, kebab | `src/features/expenses/` |
| Service fn | verb + noun | `createExpense`, `reverseLedgerForRef` |
| Action fn | service fn + `Action` | `createExpenseAction` |
| Zod schema | `<thing>Schema` | `createExpenseSchema` |
| Money fields/vars | `*Fils` suffix, `Int` | `amountFils`, `netFils` |
| Enum-union values | `SCREAMING_CASE` strings | `"FARM"`, `"OUT"` |
| Arabic UI strings | plain language, no jargon | `"مصروف جديد"` |
| Icons | PascalCase + `Icon` suffix | `HomeIcon` |
| Import alias | `@/` → `src/` | `@/lib/money` |

RTL/CSS: use **logical** properties only (`ms`/`me`, `ps`/`pe`, `start`/`end`,
`text-start`) — **never** `left`/`right`. See [DESIGN.md](./DESIGN.md).

---

## 8. LOCKED / SHARED files — feature teams must **NEVER** modify

Editing any of these breaks the other three teams. They are owned by the foundation.

```
prisma/schema.prisma
prisma/seed.ts
prisma/migrations/*
src/config/nav.ts
src/config/categories.ts
src/config/site.ts
src/lib/db/**            (prisma client)
src/lib/result.ts
src/lib/money.ts
src/lib/dates.ts
src/lib/enums.ts
src/lib/ledger/**        (ledger.service.ts)
src/lib/auth/**          (getCurrentUser / requireUser)
src/lib/i18n/**          (ar.ts)
src/lib/utils.ts
src/components/ui/*       (shadcn primitives)
src/components/shared/*   (MoneyInput, MoneyText, DateField, PeriodPicker, StatCard, EmptyState, ScopeToggle, ConfirmDialog, PageHeader, FormError)
src/components/layout/*   (BottomNav, AppHeader, QuickAddSheet)
src/app/layout.tsx
src/app/(app)/layout.tsx
src/middleware.ts
src/app/globals.css
package.json
package-lock.json
.env
```

**What you MAY touch:** your own `src/features/<name>/**` and your own placeholder page
`src/app/(app)/<name>/page.tsx`. That is all.
