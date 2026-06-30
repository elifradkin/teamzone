# PLAN.md — TeamZone v2 Phased Roadmap

Status legend: ☐ not started · ◐ in progress · ☑ done (gate passed + approved)
Active phase: **Phase 3 — Motra ingestion + visualizations + effort/recovery scoring** (started 2026-06-30, approved by Eli)
Phase 0: ☑. Phase 1: ☑. Phase 2: ☑ DONE (gate passed; onboarding + plan verified
HE/EN on staging). Body-type taxonomy = lean / average / muscular. UI polish is
per-phase (Eli's choice). Phase 3 order: build scoring/visualization data first
(Motra-agnostic, testable); Motra server-side ingestion is a gated sub-step
(needs OAuth/MCP client + carries R-1 ToS risk; not CI-testable without Motra).

## How every phase runs (the ritual)
1. Confirm with Eli that this phase is the active, approved target.
2. Build in small steps; test after each step (forward + regression).
3. Run the full VERIFICATION GATE for the phase.
4. STOP. Present verification evidence. Wait for Eli's explicit approval.
5. Update this file: mark phase done, record deviations, refine the next phase.
6. Only then begin the next phase.

Every gate, in every phase, includes:
- Forward tests: unit + integration + e2e (where user-facing) meeting the
  phase's Definition of Done.
- Regression: all prior phases' suites still green (or gaps named explicitly).
- Hebrew/English RTL smoke check (both languages, both directions).
- No secrets in client/git; `.env.example` current.

## Locked decisions (see DECISIONS-AND-RISKS.md)
TypeScript monorepo · Node backend · React web · React Native (Expo) mobile ·
existing Hetzner VPS — US/Hillsboro, 2GB (EU residency waived, see R-14) +
Docker Compose + staging · self-hosted local
auth in v1 (Google/Apple later) · Motra server-side per-user ingestion
prioritized behind a Motra-agnostic data spine, manual-entry fallback always
present (gated on Motra ToS) · open-licensed exercise dataset → own DB · Gemini
avatar a core v1 feature · free in v1, billing-ready.

---

## Phase 0 — Discovery & Grounding
**Goal:** Replace every unverified assumption with a verified fact before any
build decisions harden. No app code.
**Scope / deliverables:**
- Verify Motra's per-user MCP terms: does it permit SERVER-SIDE per-user access
  (path B)? Capture the actual payload shape (muscle groups, sets, volume, RPE).
  This is the project's top blocker — record the answer in DECISIONS-AND-RISKS.md.
- Verify current Gemini image-generation model IDs and their image-input/edit
  capability + EU data-handling terms.
- Verify the chosen exercise dataset's license permits storage, reshaping, and
  redistribution in a commercial-capable app.
- Verify Apple Health (HealthKit) access constraints under Expo (custom dev
  client, entitlements, what data is reachable).
- Confirm Claude Sonnet model ID + server-side usage approach.
- Produce ARCHITECTURE.md v1 and DECISIONS-AND-RISKS.md from verified facts.
**Verification gate:** Every item above is marked verified or explicitly
"unverified + blocker". No fabricated API shapes, model names, or terms.
**Definition of Done:** Eli has a grounded architecture + risk register; the
Motra-path decision is resolved or its blocker is explicit.

## Phase 1 — Foundations   ☑ DONE (gate passed 2026-06-30)
**Goal:** A running, multi-user, bilingual skeleton on staging.
**Scope / deliverables:**
- Monorepo scaffold (web, mobile, backend, shared packages).
- Self-hosted local auth (email + password): signup, login, session, password
  reset, logout. Google/Apple deferred.
- i18n + RTL spine: translation framework, HE/EN string files, direction
  switching, bidi handling, RTL-aware layout primitives.
- Motra-agnostic normalized data model (the "data spine"): internal schema for
  workouts/muscle-effort that any source (Motra, manual, Apple Health) maps into.
- Minimal manual workout entry (proves the spine works without Motra).
- Dockerized stack (app + Postgres + Redis + object storage + reverse proxy/TLS)
  via Docker Compose; CI pipeline; Hetzner staging VPS deploy; automated backups.
- `.env.example`; secrets handling baseline.
**Verification gate:** Unit/integration on auth + data spine; e2e signup→login;
staging deploy reachable by server IP over HTTPS (sslip.io cert or self-signed);
HE/EN RTL smoke on auth + shell.
**Definition of Done:** A user can register and log in on staging, switch
language/direction, and manually enter a workout that lands in the data spine.

## Phase 2 — Profile & Onboarding + Baseline Plan Seeds   ☑ DONE (gate passed 2026-06-30)
**Goal:** Capture the user and seed baseline plans.
**Scope / deliverables:**
- Profile: age, height, weight, body type, multiple goals, free-text food
  preferences, **target weight + (optional) target body-fat %** — with validation
  and i18n. Define the **body-type taxonomy** (small set, e.g. lean/average/
  muscular) that drives the Phase 4 figure variants.
- Onboarding flow (bilingual, RTL-correct).
- Baseline meal-plan seed data for men and women (static templates; auto-
  adjustment logic comes in Phase 7).
- Consent capture scaffolding for sensitive data (sets up Phase 8-rule needs).
**Verification gate:** Unit/integration on profile + validation; e2e onboarding;
regression (Phase 1); HE/EN RTL smoke on all new screens incl. number/date input.
**Definition of Done:** A user completes onboarding; profile persists; baseline
plan seeds exist and are retrievable.

## Phase 3 — Motra Per-User Ingestion + Visualizations + Effort/Recovery Scoring
**Goal:** Real workout data in, original visualizations out. (Gated on Phase 0
Motra verification; if server-side path is disallowed, fall back to chat-mediated
+ manual and re-plan this phase.)
**Scope / deliverables:**
- Server-side per-user Motra ingestion: secure per-user token storage (encrypted
  at rest, revocable), scheduled pull, normalize into the data spine.
- Effort/recovery scoring model over the user's own numbers (per muscle group).
- Original (non-Motra) data visualizations of effort/recovery and volume.
- Verify-Motra-Pro flow; graceful degradation to manual entry.
**Verification gate:** Unit on scoring math (programmatic, deterministic fixtures);
integration on ingestion→normalize→store; no token ever logged/leaked (test);
regression (1–2); HE/EN RTL smoke on visualizations incl. mixed-direction labels.
**Definition of Done:** A Motra-Pro user's real numbers drive original
visualizations + scores; a non-Motra user still works via manual entry.

## Phase 4 — Mannequin + Gemini Avatar
**Goal:** The front+back muscle-map mannequin with a warm single-hue/heat
effort-recovery gradient, optionally topped with a Gemini-generated avatar head.
**Design North Star (project assets):**
- Visual target: `front_example.png` + `back_example.png` — personalized
  illustrated avatar (user's head on a stylized body, shorts + watch, dark
  background) with muscle groups heat-shaded by effort/recovery.
- Source-photo example: `user_example.png` (the kind of upload that produces the
  head).
- DO-NOT-COPY benchmark: `motra_reference.jpeg` is Motra's own UI, kept ONLY to
  confirm the concept and to differentiate from. Never trace, re-host, ship, or
  imitate it (CLAUDE.md Rule 6). Our look must stay clearly original.
**Scope / deliverables:**
- Front + back mannequin component (shared web/mobile), shown together; the
  figure **reflects the user's sex + body type** (multiple base illustrations);
  **Option A** warm yellow→orange→red heat ramp driven by Phase 3 scores
  (luminance-safe + List/numbers backup); avatar shown **on by default**;
  muscle-group labels in HE/EN; original artwork only.
- Photo upload with explicit consent, EU residency, retention/deletion controls.
- Server-side Gemini avatar generation (verified model from Phase 0) that
  composites the user's head onto the original illustrated body; no-face-detected
  → default template head. Keys server-side only.
**Verification gate:** Unit on gradient mapping; integration on avatar pipeline
incl. no-face fallback; consent + deletion path tested; no key on client (test);
an explicit originality/IP check against the Motra benchmark; regression (1–3);
HE/EN RTL smoke on mannequin + labels in both directions.
**Definition of Done:** Mannequin reflects real scores in both languages and
visually matches the North Star examples; avatar generates with consent and falls
back cleanly; sensitive-photo rules enforced; design verified original vs Motra.

## Phase 5 — Avatar Appearance Customization (character creator)
**Goal:** Let users configure and fine-tune the avatar's appearance — like a
video/PC-game character creator — as an alternative or complement to the
photo-based head, all in original art.
**Scope / deliverables:**
- A customization UI — **focused attribute set**: skin tone, hair style + color,
  facial hair, top + shorts color, glasses (body type comes from the profile).
  Bilingual + RTL-correct controls. (Render approach — layered assets vs.
  Gemini-generated — decided at build.)
- Parametric avatar composition so choices render consistently on the front+back
  mannequin and persist per user.
- Privacy win: users who don't want to upload a photo can build an avatar
  instead — reduces reliance on the most sensitive (photo) path. Avatar config is
  personal data but far less sensitive than an uploaded face photo.
- Stays within the original-art rule; any generation runs server-side.
**Verification gate:** Unit on attribute→render mapping; integration on
save/load/persist; e2e build-an-avatar without a photo; regression (1–4); HE/EN
RTL smoke on the creator UI (sliders, pickers, labels) in both directions.
**Definition of Done:** A user can build and fine-tune an avatar without a photo,
it renders correctly front+back in both languages, and the config persists.

## Phase 6 — Muscle-Group → Recommended Exercises
**Goal:** Tap/select a muscle group (list or mannequin) → recommended exercises.
**Scope / deliverables:**
- Import + curate the open-licensed exercise dataset into the app DB (license
  verified in Phase 0); HE/EN exercise naming/handling incl. bidi.
- Selection from both the list and the mannequin; recommendation logic informed
  by profile + effort/recovery.
- Build/save **native workout templates/plans** in-app (from recommendations or
  manually). Motra MCP is read-only (D13) — templates live in our app; no push to
  Motra; Motra auto-detects the actual session and feeds it back via the read path.
**Verification gate:** Unit on recommendation logic; integration on
selection→results; regression (1–5); HE/EN RTL smoke on selection + results,
including English exercise names inside Hebrew layout.
**Definition of Done:** Selecting a muscle group anywhere yields correct,
localized exercise recommendations.

## Phase 7 — Nutrition: Meal Plans
**Goal:** Baseline meal plans auto-adjusted by profile + workout load. (Food
logging/diary is the separate Phase 8.)
**Scope / deliverables:**
- Adjustment logic over the Phase 2 seeds using profile (goals, body type, food
  prefs) and Phase 3 load/scores; daily calorie/protein targets.
- Bilingual plan presentation; respects free-text food preferences.
**Verification gate:** Unit on adjustment math (deterministic fixtures);
integration profile+load→plan; regression (1–6); HE/EN RTL smoke on plans.
**Definition of Done:** Plans visibly and correctly adjust to profile + load in
both languages, with daily targets shown.

## Phase 8 — Nutrition: Food Logging & Diary
**Goal:** Full food/calorie logging — diary, macros, weight log — against the
plan's targets (D10).
**Scope / deliverables:**
- Food database: **Open Food Facts** (D11) — server-side search + barcode lookup
  (EAN-13/UPC); self-hosted dump or API; attribution (ODbL, R-15). Optional USDA
  (CC0) for generic foods later.
- Logging methods: presets / recent / frequent foods; manual search; barcode
  scan (client-side camera → server-side lookup); **AI natural-language entry**
  ("2 eggs and toast") — an AI engine (O11) parses text into items + portions;
  macros come from the food DB, NOT invented by the model; unmatched items use a
  flagged estimate. Every AI entry has a **confirm/edit step before saving** (R-17).
- Food diary: log entries with portions → daily calorie/macro totals vs targets;
  weight & (optional) body-fat check-in/log with **progress toward target
  weight/body-fat**; hydration counter **with a user-set daily water goal**.
- Dietary intake + meal text/photos = sensitive health data (R-16): explicit
  consent, retention/deletion, bilingual + RTL.
- Fast-follow (after text logging ships): **AI photo logging** — snap a meal →
  engine (O11) detects ingredients → user edits items/portions → confirm → log.
**Verification gate:** Unit on macro/total math (fixtures); integration on
search/barcode→log→totals; consent + deletion tested; OFF attribution present;
regression (1–7); HE/EN RTL smoke on logging UI incl. mixed-direction + numbers.
**Definition of Done:** A user can search/scan a food, log it with a portion, see
daily totals vs targets, and log weight — in both languages, with consent.

## Phase 9 — Claude Sonnet In-App Chat
**Goal:** In-app AI chat for recovery / exercises / meal-plan questions.
**Scope / deliverables:**
- Server-side Claude Sonnet integration (verified model ID), keys in `.env`.
- Chat grounded in the user's own context (scores, profile, plans) with strict
  data-minimization; bilingual conversation incl. RTL rendering.
- **Coach actions (tool-calling):** log/edit food, weight, water, and workouts
  from chat — routed through the same pipelines (food via the Phase 8 DB-grounded
  parser); add and modify existing entries; **explicit confirm before every
  action**, no silent writes (R-18). Tools scoped to the user's own data.
- Guardrails: no secret/token exposure; sensitive-data handling.
**Verification gate:** Integration on chat round-trip + context injection; no key
on client (test); prompt-injection/leakage sanity checks; regression (1–8); HE/EN
RTL smoke on chat UI incl. mixed-direction messages.
**Definition of Done:** A user can ask recovery/exercise/meal questions and get
grounded, bilingual answers; no secrets exposed.

## Phase 10 — Mobile Parity + Apple Health
**Goal:** Mobile reaches feature parity; iOS companion reads Apple Health.
**Scope / deliverables:**
- Mobile parity for prior phases (shared components, RTL on device), incl.
  barcode scanning + food logging on device.
- Apple Health (HealthKit) ingestion via custom Expo dev/build client (verified
  constraints from Phase 0); maps into the data spine as a non-Motra source
  (workouts, plus optionally body mass + dietary energy).
- Consent + deletion for Health data.
**Verification gate:** Mobile e2e on core flows (iOS + Android); HealthKit
ingestion integration; regression (1–9); HE/EN RTL smoke on device in both
directions.
**Definition of Done:** Core features work on mobile in both languages; Apple
Health data flows into the spine with consent.

## Phase 11 — Hardening / Privacy / Launch
**Goal:** Production-ready, compliant, secure launch.
**Scope / deliverables:**
- GDPR + Israel-PPL pass: consent records, retention/deletion end-to-end, data
  export, DPA/privacy policy review, EU residency confirmed.
- Security review: authn/z, token encryption, secret handling, dependency audit,
  rate limiting, backups + restore drill.
- Performance pass; production deploy topology; monitoring/alerting; runbook.
- Final full regression + full HE/EN RTL audit.
**Verification gate:** Security + privacy checklist complete; restore drill
passes; full regression green; full bilingual RTL audit passes.
**Definition of Done:** App is deployable to production, compliant, and secure;
launch checklist signed off by Eli.

---

## Deviations log
(Record here, per phase, anything that diverged from this plan and why.)
- **Phase 1 (done 2026-06-30):** Stack resolved — Turborepo+pnpm, Vite SPA,
  Prisma, NestJS Passport+argon2id (O2/O3/O4/O6). Deviations + follow-ups to
  carry forward:
  (a) Sessions are **DB-backed** (Session table), Redis deferred.
  (b) **Web uses a local i18n catalog**, not @teamzone/shared — consolidate once
      shared is a built package consumable by Vite + NestJS. [follow-up]
  (c) API uses `@prisma/client` enums instead of importing @teamzone/shared
      (cross-package build not yet set up). [follow-up]
  (d) Schema synced via `prisma db push` (no migration files yet) — add proper
      Prisma migrations before launch. [follow-up]
  (e) Password-reset email is **stubbed** (devToken outside prod) — wire SMTP.
      [follow-up, Phase 11]
  (f) No committed `pnpm-lock.yaml` (CI/Docker use --no-frozen-lockfile) — commit
      a lockfile for reproducible builds. [follow-up]
  (g) Hosting = US box (R-14), no domain / sslip.io HTTPS (R-13), per Eli.
- **Phase 0:** Eli elected (a) Motra server-side ingestion **without** prior
  permission (accepted risk R-1; permission email drafted), (b) reuse of an
  existing **US** Hetzner box — EU residency waived (R-14), (c) **no domain**
  (connect by IP, R-13). Scope expanded during planning: full **food/calorie
  logging** + **AI-assisted logging** (D10–D12), **Coach actions** (D14), target
  weight/body-fat. UI fully specced (UI-SPEC.md). Nutrition split into Phases
  7 & 8; subsequent phases renumbered (chat 9, mobile 10, hardening 11).
