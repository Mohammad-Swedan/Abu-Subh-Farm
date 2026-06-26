# Feature Contract — مزارع أبو صبح (Abu Subh Farms)

The **step-by-step template** every feature team follows. Four teams — **Expenses,
Income, Inventory, Employees** — build on the same foundation **in parallel**, in separate
git worktrees. If you follow this contract, your work merges cleanly with the other three.

Read [CONVENTIONS.md](./CONVENTIONS.md), [ARCHITECTURE.md](./ARCHITECTURE.md), and
[DESIGN.md](./DESIGN.md) first.

---

## The three non-negotiable rules

1. **Add ZERO new dependencies.** Use only what is in `package.json`.
2. **Never modify a LOCKED/SHARED file.** (Full list in [CONVENTIONS.md §8](./CONVENTIONS.md#8-locked--shared-files--feature-teams-must-never-modify).)
3. **Never import another feature's code.** Coordinate only via shared Prisma models + the ledger service.

---

## Step 1 — Replace your placeholder page

Each team owns exactly one route in the `(app)` group:

| Team | Page to replace |
| --- | --- |
| Expenses | `src/app/(app)/expenses/page.tsx` |
| Income | `src/app/(app)/income/page.tsx` |
| Inventory | `src/app/(app)/inventory/page.tsx` |
| Employees | `src/app/(app)/employees/page.tsx` |

The page is a **Server Component**: it reads data via your service (or a read function)
and renders your feature components. It calls `requireUser()` (auth is enforced at the edge
by middleware, but read the user where you need it).

## Step 2 — Put files only under your feature folder

```
src/features/<name>/
  server/<name>.actions.ts    # 'use server' — thin wrapper, returns Result<T>
  server/<name>.service.ts     # business logic; opens prisma.$transaction; posts to ledger
  components/...               # your UI
  schema.ts                   # Zod schemas
```

Nothing outside `src/features/<name>/` and your own `page.tsx`.

## Step 3 — Define the Zod schema (`schema.ts`)

Inputs are **fils** (`Int`) for money and reuse the shared enums from `@/lib/enums`.

```ts
// src/features/expenses/schema.ts
import { z } from "zod";
import { ScopeSchema } from "@/lib/enums";

export const createExpenseSchema = z.object({
  date: z.coerce.date(),
  amountFils: z.number().int().positive(),   // money is integer fils
  categoryId: z.string().min(1),
  scope: ScopeSchema,                         // "FARM" | "PERSONAL"
  cropId: z.string().min(1).nullable().optional(),
  vendor: z.string().trim().max(120).nullable().optional(),
  note: z.string().trim().max(500).nullable().optional(),
});

export type CreateExpenseInput = z.infer<typeof createExpenseSchema>;
```

## Step 4 — Write the service (the heart of the feature)

On **create**: open a `prisma.$transaction`, create your domain row, and post **one**
ledger entry via `postLedgerEntry(tx, …)` — atomically.

On **edit/delete**: inside one transaction, `reverseLedgerForRef(tx, source, refId)` then
re-post if the row still represents a cash movement.

Services return `Result<T>` — they do not throw for expected errors.

```ts
// src/features/expenses/server/expenses.service.ts
import { prisma } from "@/lib/db/prisma";
import { postLedgerEntry, reverseLedgerForRef } from "@/lib/ledger/ledger.service";
import { ok, err, type Result } from "@/lib/result";
import type { CreateExpenseInput } from "../schema";
import type { Expense } from "@prisma/client";

export async function createExpense(input: CreateExpenseInput): Promise<Result<Expense>> {
  try {
    const expense = await prisma.$transaction(async (tx) => {
      const ledger = await postLedgerEntry(tx, {
        date: input.date,
        direction: "OUT",            // expense = money out
        amountFils: input.amountFils,
        scope: input.scope,
        source: "EXPENSE",
        categoryId: input.categoryId,
        cropId: input.cropId ?? null,
        note: input.note ?? null,
      });

      return tx.expense.create({
        data: {
          date: input.date,
          amountFils: input.amountFils,
          categoryId: input.categoryId,
          scope: input.scope,
          cropId: input.cropId ?? null,
          vendor: input.vendor ?? null,
          note: input.note ?? null,
          ledgerEntryId: ledger.id,  // 1-to-1 link
        },
      });
    });
    return ok(expense);
  } catch {
    return err("CREATE_FAILED", "تعذّر حفظ المصروف، حاول مرة أخرى");
  }
}

// Edit/delete sketch — reverse first, then re-post:
export async function deleteExpense(id: string): Promise<Result<true>> {
  try {
    await prisma.$transaction(async (tx) => {
      await reverseLedgerForRef(tx, "EXPENSE", id);
      await tx.expense.delete({ where: { id } });
    });
    return ok(true);
  } catch {
    return err("DELETE_FAILED", "تعذّر حذف المصروف");
  }
}
```

> **Cross-feature note:** if your feature causes a side effect in another domain (e.g. an
> inventory purchase that should record an `Expense`), do it with the **shared Prisma
> models + ledger service inside your own transaction** — do **not** call the other
> feature's service. See [ARCHITECTURE.md §1](./ARCHITECTURE.md#feature-isolation-rule).

## Step 5 — Write the thin Server Action

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
  return createExpense(parsed.data);
}
```

The action only: enforces auth → validates → delegates → returns `Result<T>`. No business
logic, no ledger calls here.

## Step 6 — Build the UI from shared components

Use react-hook-form (+ `@hookform/resolvers` zodResolver) with your schema. Build screens
out of the **shared** components — do not re-implement them:

| Need | Use |
| --- | --- |
| Money entry | `MoneyInput` (numeric keypad, parses to fils) |
| Money display | `MoneyText` (formats fils → `"12.500 د.أ"`, tabular) |
| Date | `DateField` |
| Period filter | `PeriodPicker` |
| FARM/PERSONAL | `ScopeToggle` |
| Empty list | `EmptyState` (one primary action) |
| Page title bar | `PageHeader` |
| Inline field errors | `FormError` |
| Confirm destructive | `ConfirmDialog` |

**On submit:** call the action, then handle the `Result`:

```ts
const res = await createExpenseAction(values);
if (!res.ok) {
  // map res.error.fieldErrors → inline FormError under each field
  toast.error(res.error.message);   // sonner
  return;
}
toast.success("تم حفظ المصروف");
// close the sheet / refresh the list
```

Honor every [DESIGN.md](./DESIGN.md) ergonomics rule: 48px targets, ≥16px type, plain
Arabic, logical CSS (`ms`/`me`/`ps`/`pe`/`start`/`end`), pick-from-lists over free text.

## Step 7 — Re-check the rules before you open a PR

- [ ] No new dependencies.
- [ ] No LOCKED/SHARED file touched (only `src/features/<name>/**` + your own `page.tsx`).
- [ ] No import from another feature.
- [ ] Every money movement = one domain row **and** one ledger entry, in one `$transaction`.
- [ ] Edit/delete reverses the ledger via `reverseLedgerForRef` before re-posting.
- [ ] Money is integer fils everywhere; UI uses `MoneyInput`/`MoneyText`.
- [ ] Service **and** action return `Result<T>`; UI shows inline `fieldErrors` + a toast.
- [ ] `typecheck` and `lint` pass (`npm run typecheck`, `npm run lint`).
