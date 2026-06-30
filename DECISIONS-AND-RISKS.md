# DECISIONS-AND-RISKS.md — TeamZone v2

Two registers: (A) decisions, (B) risks. Locked decisions are fixed unless Eli
reopens them (CLAUDE.md Rule 5). Blockers are marked 🔴.

## A. Decisions

### A1. Locked decisions
| ID | Decision | Rationale |
|----|----------|-----------|
| D1 | TypeScript end-to-end, monorepo | Shared types + shared mannequin components + one i18n/RTL pipeline; strong AI/MCP SDKs |
| D2 | React Native + Expo (mobile) | Fastest iOS+Android; reuse web components; HealthKit via custom dev client |
| D3 | **Existing Hetzner VPS — US (Hillsboro), 2GB RAM**, per Eli's choice (overrides the earlier EU/8GB plan) + Docker Compose + staging | Reuse the box Eli already has. EU residency waived — see 🔴 R-14. Undersized + already in use — recheck capacity before Phase 1 deploy |
| D4 | Self-hosted local auth (email+password) in v1; Google/Apple later | Data residency; no third-party IdP holds the user table |
| D5 | Motra **server-side per-user ingestion (path B)** as primary | Eli's choice for best structured visualizations. Proceeding **without** prior permission (permission email drafted). See 🔴 R-1 |
| D6 | Open-licensed exercise dataset → own DB | Free, controllable, low cost; license to finalize (O5) |
| D7 | Gemini avatar = core v1 feature (Phase 4) | Eli's priority; North-star = front_example/back_example |
| D8 | Free in v1, billing-ready data model | Validate product first; users already pay Motra Pro |
| D9 | Avatar appearance customization = Phase 5 (character creator) | Personalization + a no-photo path (privacy win) |
| D10 | **Full food/calorie logging in v1** (food diary + macros + weight log), on top of meal plans | Eli's choice; expands Nutrition into two phases (meal plans + food logging) — see PLAN.md. Adds health-data + a food-DB dependency |
| D11 | Food/nutrition database = **Open Food Facts** (primary) | Barcodes + Israeli/international coverage + self-hostable dumps; ODbL (attribution + share-alike) — see R-15. USDA (CC0) optional later for generic foods |
| D12 | **AI-assisted food logging** — natural-language entry in v1, photo entry as fast-follow | Eli's choice; low-friction logging. Engine identifies foods/portions; **macros from the food DB, not the model** (R-17); confirm step before save. Engine = O11 |
| D13 | **No write-back to Motra; workout templates/plans are native to the app** | Motra MCP is read-only; push-to-Motra is unshipped ("Coming Soon"). Motra auto-detects sessions → still flows back via the read path. "Push to Motra" = possible future add-on |
| D14 | **Coach can take actions** (log/edit food, weight, water, workouts via chat), not just answer | Eli's request. Same DB-grounded pipelines; **explicit confirm before every action** (Eli's choice), no silent writes (R-18) |
| D15 | Mannequin **reflects sex + body type** (multiple base illustrations); avatar shown **on by default** | Relatable hero visual. Art scope = sex × body-type × front/back; body-type taxonomy defined in Phase 2 |
| D16 | Heat scale = **Option A** — warm yellow→orange→red ramp | Matches North-star; colorblind-safe via luminance + List/numbers; no on-figure glyphs |
| D17 | Character creator = **focused set** (skin tone, hair + color, facial hair, top/shorts color, glasses) | Recognizable without a huge art pipeline (Phase 5). Render approach decided at build |
| D18 | Nutrition targets **editable in both** Profile & Nutrition; **default notifications** all on (training readiness, Motra sync/re-auth, meal logging, water + weekly weight), individually toggleable | Eli's choices. One underlying target value; notifications timed/bundled to limit fatigue |

### A2. Open decisions (Eli's call — recommendation first)
| ID | Decision | Options | Recommendation |
|----|----------|---------|----------------|
| O1 | Backend framework | NestJS vs Fastify | ✅ **RESOLVED → NestJS** (Eli delegated; structure suits auth + integrations + jobs) |
| O2 | Web framework | Next.js vs Vite+React | ✅ **RESOLVED → Vite + React SPA** (Eli delegated; clean with the separate NestJS API) |
| O3 | ORM | Prisma vs Drizzle | ✅ **RESOLVED → Prisma** (maturity, typed client, migrations) |
| O4 | Monorepo tooling | Turborepo vs Nx | ✅ **RESOLVED → Turborepo + pnpm** (right-sized, fast) |
| O5 | Exercise dataset | wger vs free-exercise-db | ✅ **RESOLVED → free-exercise-db** (Unlicense/public-domain, verified 2026-06-27; English-only → add Hebrew via i18n; spot-check demo-image provenance before use) |
| O6 | Auth library | Passport vs Better Auth vs Auth.js | ✅ **RESOLVED → NestJS Passport + argon2id + sessions** (native, maintained, full control; Lucia dropped — deprecating. Google/Apple later via Passport strategies) |
| O7 | Reverse proxy/TLS | Caddy vs Traefik | **Caddy** — simplest automatic TLS |
| O8 | Default Gemini image model | gemini-3.1-flash-image vs gemini-3-pro-image | **Flash** for cost; **Pro** where avatar fidelity matters — can A/B in Phase 4 |
| O9 | Default avatar template (no-face fallback) art | (to design) | Commission/produce an original neutral template; never derive from Motra |
| O10 | Food database source | OFF vs USDA vs hybrid | ✅ **RESOLVED → Open Food Facts** (Eli delegated; ODbL verified 2026-06-27; add USDA CC0 later if needed) |
| O11 | AI engine for food parsing (text now, image later) | Gemini vs Claude vs split | ✅ **RESOLVED → split by modality**: Claude Sonnet for natural-language text parsing (best structured extraction; reuses chat engine), Gemini for photo analysis (best vision; reuses avatar engine). App-wide rule: language→Claude, vision→Gemini. No new providers |

(These are deferred to their relevant phase; none blocks planning.)

## B. Risk register
Likelihood/Impact: L/M/H. 🔴 = blocker.

| ID | Risk | L | I | Mitigation |
|----|------|---|---|------------|
| 🔴 R-1 | **Motra ToS §8 prohibits automated/systematic retrieval & DB compilation without written permission.** Path B (server-side ingestion). **Eli has SENT the permission email (2026-06-30) and is awaiting Motra's reply; committed to REMOVING the Motra-ingestion feature if Motra declines.** | M | M | Permission-pending (good-faith request sent, removal commitment lowers exposure). Build kept isolated in a `motra` module so it can be cleanly removed; Motra-agnostic spine + manual entry remain the always-on fallback; per-user tokens encrypted at rest, user-revocable. Do not enable in production until Motra replies. |
| R-2 | Motra token expiry / unattended refresh fragility (MCP built for interactive sessions) | H | M | Re-auth on next active session; serve last-synced data; manual-entry fallback; document token lifecycle in Phase 0/3 |
| R-3 | Motra access could be revoked or MCP changed at any time | M | H | Same fallback spine as R-1; treat Motra as an enhancer, not a single point of failure |
| R-4 | Exercise dataset license | L | L | ✅ Resolved: chose free-exercise-db (Unlicense/public domain) — no attribution/share-alike. Residual: verify demo-image provenance before using the images (text data is clear) |
| R-5 | Photo = biometric-adjacent sensitive data under GDPR + Israel PPL | M | H | Explicit consent, EU residency, purpose limitation (avatar only), retention limit + deletion; offer no-photo character creator (Phase 5) |
| R-6 | Gemini image model IDs / pricing change before build | M | M | Re-confirm IDs at Phase 4; isolate model choice behind a server-side adapter; cost-cap + caching |
| R-7 | Apple Health needs custom Expo dev client + App Store review (HealthKit usage justification) | M | M | Plan custom build pipeline (Phase 9); clear Info.plist usage strings; data used only as declared |
| R-8 | RTL/bidi defects (mixed HE/EN + numbers, mirrored icons, mannequin labels) | M | M | RTL smoke check in every gate; logical CSS props; test both directions on web + device |
| R-9 | Single VPS = single point of failure | M | M | Automated daily backups + restore drill; rebuild-from-Compose; vertical resize; HA deferred to Phase 10 |
| R-10 | Self-hosted auth security burden (hashing, sessions, resets, 2FA) | M | H | Use a vetted library (O6); Argon2id; security review in Phase 10; dependency audit |
| R-11 | AI cost scaling (Gemini avatars + Claude chat) | M | M | Server-side rate limits + caching; cost caps; model choice (O8); free-tier-friendly defaults |
| R-12 | Minors: Motra ToS is 18+; our profile has an age field | L | M | Set a minimum age / parental-consent gate; align with GDPR-K / PPL; never target under-18 features |
| R-13 | No custom domain (connect by IP). Risks: no domain-based TLS by default; IPs can change; Apple/OAuth often need a real domain; bare HTTP would expose sensitive data | M | M | HTTPS via free `sslip.io` hostname (Let's Encrypt) or Caddy internal CA; reserve a static/floating IP; revisit a real domain before public launch (esp. social login + iOS). Never serve PII over plain HTTP |
| R-15 | Open Food Facts is **ODbL** (attribution + share-alike); combining it into a merged DB forces open-data release of the result | L | M | Attribute OFF; keep it as a separate queryable source / self-hosted dump, not merged into a proprietary DB; store our own food-log entries separately. USDA (CC0) is the fallback if ODbL becomes a problem |
| R-18 | **Coach agentic actions** could mis-log or wrongly edit data, or be prompt-injected into unwanted writes | M | M | Explicit confirm before every action (undo as backstop); DB-grounded macros (not model); tools scoped to the user's own data + on-domain; never expose secrets; log actions for audit |
| R-17 | AI food parsing could produce **inaccurate calories/macros** (a trust + health risk if numbers are wrong) | M | M | Model only identifies foods + portions; **macros pulled from the food DB**, not generated; unmatched items flagged as estimates; mandatory user confirm/edit before save; show the source per item |
| R-16 | Full food/calorie logging = **dietary-intake health data** (GDPR/PPL) + bigger build (food DB, barcode, diary, weight log) | M | M | Treat as sensitive: explicit consent, retention/deletion, EU residency (caveated by R-14); split into its own phase (PLAN Phase 8); barcode scanning runs client-side, lookups server-side |
| 🔴 R-14 | **App hosted in the US (Hillsboro), not the EU — breaks the GDPR/Israel-PPL data-residency requirement (CLAUDE.md Rule 7) for sensitive profile/workout/photo data.** Eli accepted this to reuse the existing server. Also 2GB RAM + disk ~65% full + already in use = capacity risk for the full stack. | M | H | Documented as a conscious deviation. Avoid/minimize EU & Israel users' sensitive data until migrated; for any real/public launch, move to an EU region (fsn1/nbg1) with ≥8GB; encrypt at rest; any consent/privacy copy must disclose US processing + cross-border transfer. Recheck disk/RAM before Phase 1 deploy |

## C. Verification log (Phase 0)
| Item | Status | Source/date |
|------|--------|-------------|
| Motra MCP exists, per-user, read-only, Motra-Pro, OAuth2.1/PKCE, tools list | ✅ verified | help.motra.com, 2026-06-27 |
| Motra ToS prohibits automated retrieval/DB compilation w/o permission | ✅ verified | motra.com/terms §1,2,8, 2026-06-27 |
| Gemini image model IDs (gemini-3-pro-image, gemini-3.1-flash-image) | ✅ verified (re-confirm at build) | DeepMind/Google, 2026-06-27 |
| Claude Sonnet model id `claude-sonnet-4-6` | ✅ verified | platform.claude.com, 2026-06-27 |
| Apple Health on Expo needs custom dev client | ✅ verified | react-native-health, 2026-06-27 |
| wger exercise data = CC-BY-SA 3.0 | ✅ verified | github.com/wger-project, 2026-06-27 |
| free-exercise-db license = Unlicense (public domain) | ✅ verified | github.com/yuhonas/free-exercise-db, 2026-06-27 |
| Open Food Facts license = ODbL (attribution + share-alike); barcodes; self-host dumps | ✅ verified | world.openfoodfacts.org/data, 2026-06-27 |
| USDA FoodData Central = CC0 (public domain); ~300k foods; US-centric | ✅ verified | fdc.nal.usda.gov, 2026-06-27 |
