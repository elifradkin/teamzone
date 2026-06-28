# SETUP-CHECKLIST.md — TeamZone v2

Legend: 👤 = **you do this yourself** (your accounts/environment — I can't and
shouldn't). 🤝 = I can help/draft. ⏳ = not needed until its phase.

## 1. Accounts, keys & credentials (👤 you obtain; store in `.env` only)
- 👤 **Hetzner Cloud account** + payment; create the EU-region project.
- 👤 **No custom domain** (your choice) — connect directly to the Hetzner server
  by its IP. For HTTPS without buying a domain, use a free `sslip.io` hostname
  derived from the IP (e.g. `1-2-3-4.sslip.io`) so Let's Encrypt issues a valid
  cert. Pure IP-only (self-signed/HTTP) is a fallback — see §3 + R-13.
- 👤 **Google AI / Gemini API key** (for avatar generation). ⏳ Phase 4.
- 👤 **Anthropic API key** (for the in-app Claude Sonnet chat). ⏳ Phase 8.
- 👤 **Motra Pro subscription** — note: each END-USER needs their own Motra Pro to
  connect; you need one for testing. ⏳ Phase 3.
- 👤 **Apple Developer account** (for the iOS companion + HealthKit). ⏳ Phase 9.
- 🤝 `.env.example` (committed, blank) — I'll define the keys; you fill the real
  `.env` (git-ignored). Never paste real keys into chat.

## 2. `.env` keys (server-side only — filled by 👤 you)
```
# Core
DATABASE_URL=
REDIS_URL=
SESSION_SECRET=
# Object storage (MinIO)
S3_ENDPOINT=
S3_ACCESS_KEY=
S3_SECRET_KEY=
S3_BUCKET=
# AI (server-side)
GEMINI_API_KEY=
GEMINI_IMAGE_MODEL=gemini-3.1-flash-image   # or gemini-3-pro-image
ANTHROPIC_API_KEY=
CLAUDE_MODEL=claude-sonnet-4-6
# Motra (per-user OAuth; tokens encrypted at rest, not raw in .env)
MOTRA_MCP_URL=https://mcp.motra.com/mcp
MOTRA_OAUTH_CLIENT_ID=
MOTRA_OAUTH_CLIENT_SECRET=
TOKEN_ENCRYPTION_KEY=
# Auth (social added later)
# GOOGLE_OAUTH_CLIENT_ID= / APPLE_… (⏳ later phase)
```

## 3. Hetzner / infra (👤 you provision; 🤝 I script the configs)
- 👤 **Using an existing Hetzner VPS — US (Hillsboro), 2GB** (Eli's choice; EU
  residency waived, see R-14). SSH key installed + connection verified ✅. Note
  its public **IP** privately (not in this committed file). Recheck RAM/disk
  capacity before the Phase 1 deploy; migrate to EU + ≥8GB before real users.
- 👤 **No DNS needed.** Connect by IP. For HTTPS, 🤝 I'll configure Caddy to use
  the IP's free `sslip.io` hostname (real Let's Encrypt cert, no domain) — or, if
  you prefer pure IP-only, Caddy's internal self-signed CA (browser warning).
- ⏳ Backups — **deferred to start of Phase 1** (enable Hetzner server Backups +
  app-level DB dumps once we persist real data; nothing to back up yet).
- 🤝 `docker-compose.yml` (app, Postgres, Redis, MinIO, reverse proxy), backup
  scripts, CI workflow — I draft; 👤 you hold the server secrets and run deploys.
- ⚠️ Region = US (Hillsboro) — EU data residency NOT met (R-14); restore before launch.

## 4. Claude Desktop / Cowork — connectors & skills (👤 you install)
Installing anything into YOUR Claude/Cowork environment is something **you** do in
Settings; I can guide but can't install for you.
- 👤 (Optional, for testing path A) **Motra custom connector** in Claude:
  Settings → Connectors → Add custom connector → URL `https://mcp.motra.com/mcp`
  → sign in with your Motra account. Lets you explore your own data in chat.
- 👤 **File System** access to the project folder (already granted this session).
- 🤝 The output-format skills already available (docx/pdf/pptx/xlsx) cover any
  reports/specs we generate; no new install needed for those.

## 5. Custom skills worth creating later (described — NOT built yet)
These are project-specific skills I recommend we build in their relevant phase.
I'll author them when we get there (skills live in your environment — 👤 you'd
save/enable them).
- **muscle-map / mannequin generator skill** — given per-muscle effort/recovery
  scores, emit the front+back SVG mannequin with the warm single-hue heat
  gradient and HE/EN labels. Keeps visualization logic consistent + original
  (never Motra-derived). ⏳ around Phase 4.
- **Hebrew/English RTL skill** — a reusable checker/helper for the bilingual+RTL
  discipline: validates translations exist, flags hardcoded strings, runs the
  RTL/bidi smoke checklist (mirroring, alignment, number/date, mixed-direction).
  Supports the gate in every phase. ⏳ from Phase 1.
- **Motra-payload-normalizer skill** — maps Motra MCP tool outputs (Query
  Workouts, Exercise History, etc.) into the Motra-agnostic data spine schema,
  with fixtures/tests. Isolates vendor shape from your model. ⏳ Phase 3.

## 6. One-time legal/privacy prep (🤝 I draft; 👤 you own/decide)
- 🤝 Motra permission email (drafted: MOTRA-PERMISSION-EMAIL.md) — 👤 send it.
- ⏳ Privacy policy + consent copy (GDPR + Israel PPL), data export/deletion flows
  — drafted in Phase 10; 👤 you review/publish.
- 👤 Decide minimum-age / parental-consent stance (R-12) before launch.

## 7. Pre-build gate (do before Phase 1 code)
- [ ] CLAUDE.md, PROJECT-INSTRUCTIONS.md, PLAN.md, ARCHITECTURE.md,
      DECISIONS-AND-RISKS.md reviewed & approved.
- [ ] Open decisions O1–O9 resolved (or consciously deferred to their phase).
- [ ] Hetzner ready; staging reachable by IP (HTTPS via sslip.io or self-signed).
- [ ] `.env`/`.env.example` strategy in place; no secrets in chat or git.
- [ ] Eli says "go" to start Phase 1 (no building before that — Rule 1).
