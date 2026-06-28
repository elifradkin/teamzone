# ARCHITECTURE.md — TeamZone v2

Status: v1 draft (Phase 0 output). Facts marked [verified <date>] were checked
against sources on 2026-06-27; re-confirm at build time. Facts marked
[unverified] still need checking.

## 1. Stack (locked)
- **Language:** TypeScript end-to-end (monorepo).
- **Monorepo tooling:** Turborepo or Nx (pick in Phase 1) with pnpm workspaces.
  Packages: `web`, `mobile`, `api`, `shared` (types, i18n strings, muscle-map +
  scoring logic), `ui` (shared components).
- **Backend:** Node + NestJS (structured DI/modules suit auth + integrations +
  background jobs). Fastify is the lighter alternative — decide in Phase 1.
- **Web:** React (Vite or Next.js — decide in Phase 1; Next.js if SSR/SEO wanted).
- **Mobile:** React Native + Expo (dev client; custom build for HealthKit).
- **DB:** PostgreSQL. **Cache/queues/sessions:** Redis. **Object storage:**
  MinIO (S3-compatible, self-hosted) for uploaded photos + generated avatars.
- **ORM:** Prisma or Drizzle (decide Phase 1; both give typed schema in `shared`).
- **Infra:** Docker Compose on a single Hetzner Cloud VPS. **Actual server: a
  pre-existing US box (Hillsboro, 2GB RAM)** per Eli's choice — this overrides
  the original EU/8GB target and waives EU residency (see 🔴 R-14; migrate to
  fsn1/nbg1 + ≥8GB before any real launch). **No custom domain** — the
  server is reached directly by its IP. HTTPS without a domain via Caddy using a
  free `sslip.io` hostname (real Let's Encrypt cert) or Caddy's internal CA
  (self-signed) for pure IP-only. Automated daily backups (DB dump + object
  storage) to a Hetzner Storage Box; volume snapshots. CI via GitHub Actions.
  (Production-with-real-users should revisit a proper domain — see R-13.)

## 2. Authentication
- v1: **self-hosted local accounts** — email + password. Library: Lucia or
  Auth.js (decide Phase 1). Argon2id password hashing; HTTP-only secure session
  cookies (web) + secure token storage (mobile); password-reset via email;
  optional TOTP 2FA later.
- Google/Apple sign-in: deferred to a later phase, brokered server-side (your
  server holds the session; no third-party IdP holds the user table).
- All auth secrets (session keys, OAuth client secrets when added) in `.env`.

## 3. Data spine (Motra-agnostic) — the core abstraction
Everything reads from an internal normalized schema, never from a vendor's shape.
Sources map INTO it:
- **Source: Motra** (primary, path B — see §4 and the accepted ToS risk in
  DECISIONS-AND-RISKS.md).
- **Source: Manual entry** (always available; no external dependency).
- **Source: Apple Health** (iOS, Phase 9).
This keeps the mannequin, scoring, and visualizations independent of any single
provider, and lets the app work fully without Motra.

## 4. Motra integration (path B — server-side per-user ingestion)
**Verified facts [verified 2026-06-27]:**
- Endpoint: `https://mcp.motra.com/mcp`, Streamable HTTP transport, OAuth 2.1
  with PKCE. Read-only. Requires the end-user's **Motra Pro** subscription.
- Available tools: Query Workouts; Exercise History (weight, reps, volume, RPE);
  Stats Aggregation; Achievements; Search Exercises; Get Exercise Details; List
  Templates.
- Motra documents this as an interactive, per-session AI-assistant integration
  ("no background data collection"); their ToS §8 prohibits automated/systematic
  retrieval and database compilation without written permission. **Eli has
  elected to proceed with server-side ingestion (a permission request to Motra
  has been drafted; see MOTRA-PERMISSION-EMAIL.md), accepting the residual risk**
  (DECISIONS-AND-RISKS.md, R-1).
**Design:**
- Backend acts as a per-user OAuth client; each end-user authorizes access to
  their own Motra account. Tokens stored **encrypted at rest** (per CLAUDE.md
  Rule 4/7), never logged, user-revocable/deletable.
- Ingestion worker (BullMQ on Redis) pulls each user's workout/exercise data and
  normalizes it into the data spine.
- **Known technical constraint [verified]:** Motra access tokens expire and the
  flow is built around interactive re-auth; unattended refresh is fragile.
  Mitigation: re-auth prompts on the user's next active session; graceful
  fallback to last-synced data + manual entry. Document token-lifecycle behavior
  in Phase 0/3.
- **Read-only — no write-back to Motra.** Motra's MCP is read-only; pushing
  workout plans/templates into Motra is on Motra's "Coming Soon" list but
  unshipped (D13). Workout templates/plans are therefore **native to our app**;
  we do not write to Motra. Since Motra auto-detects sessions from the watch, the
  actual workout still flows back via the read path. "Push to Motra" is a possible
  future add-on if/when Motra ships a write API.
- **Fallback (always built):** manual entry; Apple Health (Phase 10). If Motra
  access breaks or is cut off, the app still functions on these sources.

## 5. Effort/recovery scoring + visualizations
- Pure functions in `shared` over normalized per-muscle numbers (sets, volume,
  RPE, recency) → per-muscle effort + recovery scores. Deterministic, unit-tested
  with fixtures.
- Original visualizations only (CLAUDE.md Rule 6). The front/back mannequin
  renders a warm single-hue/heat gradient from the scores. North-star assets:
  `front_example.png`, `back_example.png`. `motra_reference.jpeg` is a
  do-not-copy benchmark only.

## 6. Avatar generation (Gemini, server-side)
- **Model [verified 2026-06-27]:** Gemini image line ("Nano Banana"). Current
  IDs: `gemini-3-pro-image` (Nano Banana Pro — best fidelity + native image
  edit/compositing) and `gemini-3.1-flash-image` (cheaper/faster). Recommend
  Flash for cost, Pro where fidelity matters. Re-confirm IDs at build time.
- Pipeline: user uploads photo (explicit consent) → server-side face presence
  check → if face: Gemini composites the head onto the ORIGINAL illustrated body
  → if no face: default template head. Keys server-side only; nothing on client.
- Photo + avatar stored in MinIO (EU); strict retention/deletion (CLAUDE.md
  Rule 7). Phase 5 adds a parametric character-creator alternative so users can
  skip photo upload entirely.

## 7. In-app AI chat (Claude, server-side)
- **Model [verified 2026-06-27]:** `claude-sonnet-4-6`. Server-side only; key in
  `.env`. Client never sees the key or calls Anthropic directly.
- Backend injects the user's own context (scores, profile, plans) with strict
  data minimization. Bilingual + RTL rendering, incl. mixed-direction messages.
- Guardrails: no secret/token exposure; sanitise context; rate-limit.
- **Coach actions (tool-calling):** the Coach can not only answer but *act* —
  log/edit food, weight, water, and workouts from natural language ("I ate 2 eggs
  for breakfast"; "the cottage cheese was 9%, not 5%"). Routed through the same
  pipelines as the tabs (food via the Phase 8 DB-grounded parser → macros from the
  DB, not the model); edits first locate the existing entry, then re-pull macros.
  Every action requires an **explicit confirm before it writes** — no silent
  writes (R-18); undo as a backstop. Tools scoped to the user's own data; on-domain.
- (Optional/explore) The chat may also let the user attach their own Motra
  connector for in-conversation queries — Motra's sanctioned per-session pattern.

## 8. Exercise library
- Source: **free-exercise-db** (yuhonas) — **Unlicense / public domain**
  [verified 2026-06-27]. 800+ exercises as structured JSON (primaryMuscles,
  secondaryMuscles, equipment, level, category, instructions, images) mapping ~1:1
  to the `exercises` table; ships Postgres-import tooling. No attribution/
  share-alike. Imported + curated into your DB.
- English-only source → Hebrew names/instructions added via the i18n layer (§9).
- Demo images are real-person photos of varying quality — spot-check provenance
  before relying on them (R-4); may use our own/none instead.
- HE/EN naming with bidi handling; selection via list or mannequin.

## 8b. Food / nutrition data (food logging — Phase 8)
- Source: **Open Food Facts** [verified 2026-06-27] — **ODbL** (attribution +
  share-alike, R-15). ~4M products, 150 countries (incl. Israel), barcode lookup
  (EAN-13/UPC), self-hostable dumps (JSON/CSV/SQLite) or API.
- Architecture: server-side food search + barcode lookup; barcode capture runs
  client-side (camera), the lookup runs server-side. Keep OFF as a separate
  queryable source (self-hosted dump preferred) — do NOT merge it into a
  proprietary DB (avoids triggering ODbL share-alike). Attribute OFF in-app.
- Our own food-log entries/totals are stored separately from OFF data.
- Optional later: USDA FoodData Central (CC0) for generic whole foods.
- Dietary intake is sensitive health data (R-16) — consent + retention/deletion.
- **AI-assisted logging (O11 — split by modality):** natural-language meal text
  is parsed by **Claude Sonnet** (structured extraction; reuses the chat engine);
  meal photos (fast-follow) are analyzed by **Gemini** (vision; reuses the avatar
  engine). App-wide rule: language→Claude, vision→Gemini. Critically, **macros
  come from the food DB (OFF/USDA), not the model** — the model identifies foods
  + portions, it does not invent numbers; unmatched items get a clearly flagged
  estimate. A user confirm/edit step precedes every save (R-17). Runs server-side;
  meal text/photos are health data (consent, R-16). No new providers.

## 9. Internationalization & RTL
- Library: i18next (web) + react-i18next / expo-localization (mobile); shared
  HE/EN string catalogs in `shared`. No hardcoded display text.
- RTL: logical CSS properties (margin-inline, etc.), `dir` switching, RN
  `I18nManager`; mirrored icons/chevrons; locale-aware number/date formatting;
  bidi for mixed HE/EN+numbers. RTL smoke check is part of every gate.

## 10. Security & privacy (GDPR + Israel PPL)
- Secrets only in `.env` (git-ignored); `.env.example` committed blank.
- Motra tokens + any credentials encrypted at rest; never logged.
- Photos = most sensitive: explicit consent, purpose-limited to avatar, retention
  limit + right-to-deletion. NOTE: data currently resides in the **US** (R-14),
  not the EU — residency must be restored (move to EU) before real users.
- Dietary intake (food log) + weight log = sensitive health data (R-16): explicit
  consent, retention/deletion, included in export.
- Per-user data export + deletion endpoints (Phase 11, designed from day one).
- Destructive actions (delete account / delete data) require explicit typed
  confirmation + an "export first?" nudge; logout asks a quick confirm.
- TLS everywhere; rate limiting; dependency audit; backups + restore drill.
- No analytics/third-party SDKs/data egress without an explicit Rule-5 decision.

## 11. v1 data model (sketch — refine in Phase 1)
- `users` (id, auth fields, locale, created_at, consent flags)
- `profiles` (user_id, age, height, body_type, goals[], food_prefs_text,
  target_weight, target_body_fat_pct, starting_weight)  // targets/body fat
  optional. CURRENT weight is the single source of truth = latest `body_metrics`
  entry, not an editable profile field; editing weight adds a new measurement
- `workout_sessions` (id, user_id, source[motra|manual|health], occurred_at)
- `muscle_efforts` (session_id, muscle_group, sets, volume, rpe)
- `muscle_scores` (user_id, muscle_group, effort_score, recovery_score, as_of)
- `motra_connections` (user_id, encrypted_tokens, status, last_synced_at)
- `avatars` (user_id, source[photo|generated|template|custom], asset_key,
  consent_at, retention_until)
- `avatar_configs` (user_id, attributes JSON)  // Phase 5 character creator
- `exercises` (id, name_i18n, primary_muscles[], secondary_muscles[], equipment,
  difficulty, license_attribution)
- `meal_plans` (id, sex_baseline, attributes) + `meal_plan_adjustments`
- `foods` (id, source[off|usda], barcode, name_i18n, serving, kcal, protein,
  carbs, fat, …)  // cached/looked-up reference data, kept separate from OFF dump
- `food_log_entries` (user_id, food_id, portion, meal_slot, logged_at,
  source[manual|barcode|nl_ai|photo_ai], confirmed)
- `nutrition_settings` (user_id, water_goal_ml, calorie_target_override,
  macro_overrides)  // editable from Profile or Nutrition (one value)
- `notification_settings` (user_id, training_readiness, motra_sync, meal_logging,
  water, weekly_weight, … — defaults all on)
- `avatar_configs` adds the focused character-creator attributes (skin tone, hair,
  facial hair, top/shorts color, glasses)
- `daily_nutrition_totals` (user_id, date, kcal, protein, carbs, fat, vs targets)
- `body_metrics` (user_id, weight, body_fat_pct, measured_at)  // body fat optional; can come from smart scale / Apple Health
- `hydration_log` (user_id, amount_ml, logged_at)
- `consents` (user_id, type, granted_at, revoked_at)
- `chat_messages` (user_id, role, content, created_at)  // retention-limited
