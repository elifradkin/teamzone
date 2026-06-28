# TeamZone v2

Bilingual (Hebrew + English, RTL-first) fitness + nutrition app — web + mobile,
self-hosted. Planning docs: `PLAN.md`, `ARCHITECTURE.md`, `DECISIONS-AND-RISKS.md`,
`UI-SPEC.md`, `CLAUDE.md` (operating rules). Active phase: **Phase 1 — Foundations**.

## Monorepo layout
```
packages/shared   shared TS types (data spine) + i18n/RTL  (✅ tested)
apps/api          NestJS backend + Prisma schema (Postgres)
apps/web          (added in Phase 1)  Vite + React SPA
apps/mobile       (later)             React Native + Expo
```

## Prerequisites
- Node 22+
- pnpm 9 (`npm i -g pnpm` or via corepack)
- Postgres (local or Docker) for the API

## Develop
```bash
pnpm install
# API: generate the Prisma client + sync the schema to your DB
pnpm --filter @teamzone/api exec prisma generate
pnpm --filter @teamzone/api exec prisma db push
# Run checks across the monorepo
pnpm typecheck
pnpm test
pnpm build
```
Copy `.env.example` to `.env` and fill it in (never commit `.env`).

## CI
`.github/workflows/ci.yml` runs typecheck + tests + build on every push/PR, with a
Postgres service and Prisma migrate — the place DB-backed code is verified.
