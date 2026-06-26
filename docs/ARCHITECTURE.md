# Architecture — مزارع أبو صبح (Abu Subh Farms)

How the app is layered, how the central **ledger** works, and the rules that keep the
database **portable** (SQLite now → PostgreSQL / SQL Server later with no code rewrite).

---

## 1. Backend model

The backend lives **inside the same Next.js app** — there is no separate server.

- **Reads** happen in **Server Components** (call services directly, render on the server).
- **Writes** happen in **Server Actions** (`'use server'`), which wrap the same services.
- Both sit on top of a **framework-agnostic service layer**.
- A REST `/api` layer is **not built now**, but the services take plain inputs and return
  `Result<T>`, so a future `/api` route can be added by simply **wrapping the same services** —
  no business logic moves.

### Layering

```
            ┌─────────────────────────────────────────────┐
            │  UI  (React 19 Server + Client Components)    │
            │  reads via Server Components                  │
            │  writes via Server Actions                    │
            └───────────────┬──────────────┬───────────────┘
              read           │              │  write
                             ▼              ▼
                    ┌──────────────────────────────┐
                    │  Server Actions ('use server')│   thin: validate (Zod) →
                    │  src/features/<f>/server/      │   call service → return Result<T>
                    │  <f>.actions.ts                │
                    └───────────────┬────────────────┘
                                    ▼
                    ┌──────────────────────────────┐
                    │  Services                     │   business logic; opens
                    │  src/features/<f>/server/      │   prisma.$transaction;
                    │  <f>.service.ts                │   posts to the ledger
                    └───────────────┬────────────────┘
                                    ▼
                    ┌──────────────────────────────┐
                    │  Prisma "repositories"        │   shared models + the shared
                    │  prisma + ledger.service.ts    │   ledger service (src/lib/ledger)
                    └───────────────┬────────────────┘
                                    ▼
                    ┌──────────────────────────────┐
                    │  Prisma Client → SQLite       │   src/lib/db/prisma.ts (singleton)
                    └──────────────────────────────┘
```

**Direction of dependency is one-way and downward.** A feature never reaches sideways
into another feature. The only shared write surface is the **ledger service** plus the
shared **Prisma models**.

### Feature isolation rule

> Features **NEVER import another feature's code.** They coordinate only via shared Prisma
> models + the ledger service.

Concrete example: an **inventory purchase** creates an `Expense` row (category `أسمدة`)
**and** posts one `LedgerEntry`, using the shared pieces directly. It does **not** call the
Expenses feature's service. Each feature owns its own domain rows but writes to the same
journal through the same shared function.

---

## 2. The Ledger — the central journal

Every money movement in the app is recorded in **one** place: the `LedgerEntry` table.
This is the single source of truth for cash balance and for all reports.

### The golden rule

> **Every money movement creates a domain row AND posts exactly ONE `LedgerEntry`,
> atomically, inside a single `prisma.$transaction`.**

- An **Expense** → one `Expense` row + one `LedgerEntry` (`direction: OUT`, `source: EXPENSE`).
- A **Sale** → one `Sale` row + one `LedgerEntry` (`direction: IN`, `source: SALE`).
- A **SalaryPayment** → one `SalaryPayment` row + one `LedgerEntry` (`direction: OUT`, `source: SALARY`).
- `Expense`, `Sale`, and `SalaryPayment` each carry a **1-to-1 `ledgerEntryId`** (`@unique`,
  `onDelete: Cascade`). The ledger row's `refId` points back at the domain row.

`Advance`, `RecurringExpense`, `InventoryItem`, and `InventoryTransaction` are domain
records that do **not** themselves move cash, so they do not post a ledger entry on their
own (an advance is reconciled against salary; a recurring expense posts a normal `Expense`
when it fires; inventory cash movement rides on the linked `Expense`).

### Ledger service contract — `src/lib/ledger/ledger.service.ts`

| Function | Signature (conceptual) | Behaviour |
| --- | --- | --- |
| `postLedgerEntry` | `(tx, input) → Promise<LedgerEntry>` | Creates one `LedgerEntry` **inside an existing Prisma transaction** `tx`; returns it. |
| `reverseLedgerForRef` | `(tx, source, refId) → Promise<void>` | Deletes/voids the ledger entry for a domain row. Used on **edit** and **delete**. |
| `getCashBalanceFils` | `() → Promise<number>` | `sum(IN) − sum(OUT)` over all `LedgerEntry` rows (fils). |
| `getLedgerEntries` | `(filter) → Promise<LedgerEntry[]>` | Filter by date range, `direction`, `scope`, `source`, `categoryId`, `cropId` (for reports). |

`postLedgerEntry` takes the active `tx` (not the global client) on purpose: the domain row
and its ledger row must commit or roll back **together**.

### Worked example — create

```ts
import { prisma } from "@/lib/db/prisma";
import { postLedgerEntry } from "@/lib/ledger/ledger.service";

// inside the feature service:
const expense = await prisma.$transaction(async (tx) => {
  const ledger = await postLedgerEntry(tx, {
    date: input.date,
    direction: "OUT",
    amountFils: input.amountFils,
    scope: input.scope,          // "FARM" | "PERSONAL"
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
      ledgerEntryId: ledger.id, // 1-to-1 link
    },
  });
});
```

If either write throws, the whole transaction rolls back — you can never end up with a
domain row that has no ledger entry, or a ledger entry with no domain row.

### Worked example — edit / delete (reversal)

On **edit**: reverse the old ledger entry, then re-post the corrected one — atomically.

```ts
await prisma.$transaction(async (tx) => {
  // 1. remove the stale ledger row tied to this domain record
  await reverseLedgerForRef(tx, "EXPENSE", expenseId);

  // 2. re-post the corrected entry
  const ledger = await postLedgerEntry(tx, {
    date: next.date,
    direction: "OUT",
    amountFils: next.amountFils,
    scope: next.scope,
    source: "EXPENSE",
    categoryId: next.categoryId,
    cropId: next.cropId ?? null,
    note: next.note ?? null,
  });

  // 3. update the domain row to point at the new ledger entry
  await tx.expense.update({
    where: { id: expenseId },
    data: { ...next, ledgerEntryId: ledger.id },
  });
});
```

On **delete**: inside one transaction, call `reverseLedgerForRef(tx, source, refId)` then
delete the domain row (or rely on the `onDelete: Cascade` from domain → ledger, depending
on the direction you delete — keep it inside the single transaction either way).

---

## 3. Database models (LOCKED)

Defined in `prisma/schema.prisma`. 13 models, all with `cuid()` ids and `DateTime`
timestamps:

`User`, `Category`, `Crop`, `LedgerEntry`, `Expense`, `RecurringExpense`, `Sale`,
`InventoryItem`, `InventoryTransaction`, `Employee`, `SalaryPayment`, `Advance`.

Key relations:
- `Expense.ledgerEntryId`, `Sale.ledgerEntryId`, `SalaryPayment.ledgerEntryId` → `@unique`, `onDelete: Cascade`.
- `LedgerEntry` optionally links `category` and `crop` for report grouping; `refId` points to the domain row.
- `InventoryTransaction.relatedExpenseId` ties stock-in to the expense that bought it.

**Feature teams must not edit the schema.** All models they need already exist.

---

## 4. DB-portability rules (SQLite → PostgreSQL / SQL Server)

The whole point of the conventions below is that switching databases later is **only**:

```diff
  datasource db {
-   provider = "sqlite"
+   provider = "postgresql"   // or "sqlserver"
    url      = env("DATABASE_URL")
  }
```

…plus changing `DATABASE_URL` in `.env`, then running a fresh migration. **No application
code changes.** This works because the schema deliberately avoids anything DB-specific:

| Rule | Why it keeps us portable |
| --- | --- |
| **No Prisma enums** — enum-like values are TS unions + Zod in `src/lib/enums.ts`, stored as `String`. | SQLite has no enum type; `String` columns behave identically on every provider. |
| **No DB-specific column types** — only `String`, `Int`, `Float`, `Boolean`, `DateTime`. | These map cleanly across SQLite, PostgreSQL, and SQL Server. |
| **Money is `Int` (fils)**, never `Float`/`Decimal`. | Integers are exact and identical everywhere; avoids `Decimal` precision/driver differences. |
| **ids are `cuid()`** (app-generated strings), not DB auto-increment. | No reliance on a DB-specific sequence/identity feature; ids are stable across a migration. |
| **`url = env("DATABASE_URL")`** | The connection string is the only environment-specific knob. |

`.env.example` already documents the three connection-string shapes (sqlite, postgres,
sqlserver) for when that day comes.
