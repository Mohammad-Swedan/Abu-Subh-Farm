# مزارع أبو صبح — Abu Subh Farms

An **Arabic-first, fully RTL** farm-management web app for **مزارع أبو صبح**, built for an
older, non-technical farm owner in Jordan. It tracks the day-to-day money of the farm —
**expenses, sales (income), workers, and inventory** — in plain Arabic, with large touch
targets and one calm, readable screen at a time.

Everything runs on a single **cash ledger**: every money movement creates a domain record
**and** posts exactly one ledger entry, so the cash balance and all reports always reconcile.

---

## Stack

- **Next.js 15** (App Router, `src/` dir) + **React 19** + **TypeScript** (strict)
- **Prisma 6** + **SQLite** (portable to PostgreSQL / SQL Server later — provider + URL change only)
- **Tailwind CSS v4** (CSS-first `@theme` in `src/app/globals.css`; no `tailwind.config.js`)
- **shadcn/ui** style `base-nova` on **`@base-ui/react`**, **lucide-react** icons
- **Zod 4**, **react-hook-form 7** (+ `@hookform/resolvers`)
- **date-fns 4** (`ar` locale), **bcryptjs**, **recharts**, **sonner**, **tsx**

Money is always integer **fils** (1 JOD = 1000 fils) — never floats. See
[docs/CONVENTIONS.md](./docs/CONVENTIONS.md).

---

## Getting started

```bash
# 1. Install dependencies
npm install

# 2. Create your environment file
cp .env.example .env        # then review the values

# 3. Create the database + run migrations
npm run db:migrate

# 4. Seed the owner, categories, crops, and demo data
npm run db:seed

# 5. Start the dev server
npm run dev
```

Then open the app and **log in** with the password from **`SEED_OWNER_PASSWORD`** in your
`.env` (the seed default is `abusubh2026`). v1 auth is **single-owner, password-only**:
the password is checked against the seeded user's bcrypt hash, and a signed HTTP-only
session cookie protects the app routes. (Multi-user / NextAuth is the documented future path.)

> Edit `.env` before seeding if you want a different owner password. **Never commit `.env`**
> (it is gitignored); `.env.example` is the committed template and documents the
> sqlite / postgres / sqlserver connection-string shapes.

---

## Database scripts

| Script | What it does |
| --- | --- |
| `npm run db:migrate` | Create/apply a dev migration (`prisma migrate dev`) |
| `npm run db:seed` | Seed owner, categories, crops, and demo rows (`tsx prisma/seed.ts`) |
| `npm run db:reset` | Drop, re-migrate, and re-seed (`prisma migrate reset --force`) |
| `npm run db:studio` | Open Prisma Studio to browse the data |
| `npm run db:generate` | Regenerate the Prisma client |

Other scripts: `npm run dev`, `npm run build`, `npm run start`, `npm run lint`,
`npm run typecheck`.

---

## Run order for the whole project

This repo is built in three stages:

1. **Foundation (this stage).** Schema, seed, shared libs (`money`, `result`, `enums`,
   `dates`, `ledger`, `auth`), config, design system, shared + layout components, and these
   docs. **Locked** once done.
2. **The four feature teams build in parallel** — **Expenses, Income, Inventory,
   Employees** — each in its **own git worktree**, each touching only its own
   `src/features/<name>/**` and its own placeholder page. They coordinate only through the
   shared Prisma models + the ledger service, so they don't collide.
3. **Integration.** A final pass fills the **dashboard + reports** (cash balance, period
   summaries, recharts) on top of the now-complete ledger data.

### Parallel feature work with git worktrees

Each feature team gets an isolated checkout so the four streams never step on each other:

```bash
git worktree add ../abu-subh-expenses  -b feat/expenses
git worktree add ../abu-subh-income    -b feat/income
git worktree add ../abu-subh-inventory -b feat/inventory
git worktree add ../abu-subh-employees -b feat/employees
```

Because every team edits a **disjoint** set of files (its own feature folder + its own
page) and never touches locked files, the branches merge back cleanly.

---

## Documentation

| Doc | What's inside |
| --- | --- |
| [docs/CONVENTIONS.md](./docs/CONVENTIONS.md) | Stack, feature-folder layout, `Result<T>` pattern, Server Action pattern, money-as-fils, enums-as-unions, naming, the LOCKED files list |
| [docs/ARCHITECTURE.md](./docs/ARCHITECTURE.md) | Layering (UI → actions → services → repositories → Prisma), the ledger journal + full service contract with worked examples, DB-portability rules |
| [docs/DESIGN.md](./docs/DESIGN.md) | "Jordan Valley Citrus" palette, Cairo/Tajawal type, spacing/radius, older-user ergonomics, RTL rules, navigation map, the orange signature element |
| [docs/FEATURE-CONTRACT.md](./docs/FEATURE-CONTRACT.md) | Step-by-step template every feature team follows, with service + action code sketches |

**Feature teams:** start with [docs/FEATURE-CONTRACT.md](./docs/FEATURE-CONTRACT.md).
