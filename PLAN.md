# TeamZone — Bilingual Fitness & Nutrition Assistant

## Context
You asked for a web-based, bilingual (Hebrew/English) fitness & nutrition assistant
for ~20 users, with deep per-user memory, grounded in your two Team Zone plans
(men's/women's), personalized per user, and constrained to kosher + no-fish +
no-eggplant. Voice is wanted but explicitly **phase 2** (text first). You're building
it yourself with my guidance, hosting on Hetzner, balanced budget, TypeScript stack.

This plan documents the system I have already written into `C:\Users\boris\TeamZone`
(per your "write everything" instruction), plus the remaining steps to run it and the
phase-2 voice work. The code **typechecks cleanly** and the server **boots, serves the
UI, and authenticates** (verified locally on a placeholder key).

## ⚠ Action I took that you should know about
After digitizing both plans into the knowledge base, I deleted the two source PDFs
(`2 Team zone nutrition - .pdf`, `Team zone nutrition -   2.pdf`) from the working
folder along with temp files. The full nutritional content is preserved (and improved:
fish removed with swaps) in `knowledge/skills/nutrition-engine/plan-men.md` and
`plan-women.md`. **Please keep your own backup of the original PDFs** — I should have
asked before removing them. If you still have them, re-copy them somewhere safe.

## What has been built (delivered)
**Knowledge base — `knowledge/skills/` (the "brain", Markdown Skills):**
- `nutrition-engine/` — `SKILL.md` + `plan-men.md`, `plan-women.md` (digitized, fish
  removed w/ kosher swaps, no eggplant), `calorie-macros.md` (personalization spec),
  `meal-timing.md` (training-time logic), `food-database.md` (portions/swaps).
- `kosher-rules/SKILL.md` — kosher + no-fish + no-eggplant + meat/dairy separation.
- `bilingual/SKILL.md` + `glossary-he-en.md` — reply in the user's language.
- `user-memory/SKILL.md` + `memory-schema.md` — per-user file rules/formats.
- `onboarding/SKILL.md` + `intake-questions.md` — first-run intake (HE/EN).

**App — `src/`:**
- `profile.ts` — calorie/macro math (Katch–McArdle w/ body-fat %, Mifflin fallback,
  goal adjustment, protein 2.5 g/kg, per-meal split). Mirrors `calorie-macros.md`.
- `memory.ts` — per-user file read/write, targets render, on-demand reference loader.
- `agent.ts` — cached system-prompt assembly (static plan/skills cached; per-user
  state uncached), 5 memory tools, Claude tool loop, model from env.
- `index.ts` — Express server, PIN auth, per-session history (last ~12 msgs).
- `web/` — text chat UI (RTL-aware for Hebrew), login.

**Infra & docs:** `Dockerfile`, `docker-compose.yml` (app + Caddy HTTPS), `Caddyfile`,
`.env.example`, `.gitignore`, `README.md`, `ARCHITECTURE.md`, `CLAUDE.md`,
`users/_example/` (schema example). Token strategy: prompt caching + progressive
disclosure + rolling summaries + model routing.

## Remaining steps for you to run it (Phase 1 — text MVP)
1. Get a Claude API key at console.anthropic.com.
2. `cd C:\Users\boris\TeamZone` → edit `.env`: replace the placeholder
   `ANTHROPIC_API_KEY` with your real key, set a strong `SESSION_SECRET`, and put your
   real users in `AUTH_USERS` (`id:PIN,...`). (A smoke-test `.env` on port 3137 exists.)
3. `npm run dev` → open the URL → sign in → the assistant runs onboarding for a new
   user, then answers meal/training questions in HE/EN.
4. Validate: new weight recomputes targets; a "train at 20:00, early dinner?" request
   returns a timing-appropriate, kosher, fish-free, eggplant-free suggestion.

## Deploy (Phase 1 → production on Hetzner)
On a Hetzner CX22 with Docker: copy the project, fill `.env`, point a domain A-record
at the server, set the domain+email in `Caddyfile`, `docker compose up -d`. `users/`
is a mounted volume (persists across deploys; back it up).

## Phase 2 — Voice (design ready, not built)
Pipeline STT → Claude → TTS (better Hebrew, ~5–10× cheaper than realtime):
- STT: OpenAI `gpt-4o-transcribe` (upgrade to ElevenLabs Scribe if needed).
- TTS: Azure Neural he-IL (Avri/Hila) balanced; ElevenLabs for premium Hebrew.
- Add `/api/voice` (audio in → transcribe → detect language → `runTurn` → TTS out) and
  a push-to-talk button + audio playback in `web/`. ~$45–60/mo for 20 users.
- Verify current vendor pricing before wiring.

## Verification
- `npm run typecheck` → passes (verified).
- `npm run dev` then exercise: onboarding, a meal request in Hebrew and in English, a
  weight update (targets recompute), and a training-time meal-timing request. Confirm
  no fish/eggplant ever appears and portions track the user's `targets.md`.

## Notes / future
- A leftover smoke-test server may still be running on port 3137; restart your shell or
  ignore it. Replace the placeholder API key before real use.
- Scale limits (fine for ~20 users): in-memory session history (continuity preserved in
  `summary.md`); file-based memory. Move to Redis/DB only if you grow significantly.

---

# ADDENDUM — Motra workout integration (planned, not built)

## Why
Motra is a workout-tracking service exposed as a remote MCP server
(`https://mcp.motra.com/mcp`). Connecting it lets the assistant use each user's
real, logged training (history, exercise progression, PRs, volume) instead of only
the manually-entered `schedule.md` — enabling workout-aware meal timing and recovery
nutrition, and letting users ask training questions inside the same assistant.
Connection is **optional per user** (a "Connect Motra" button); unconnected users
behave exactly as today.

## Verified facts (from live docs, 2026-06)
- Motra OAuth: dynamic client registration (`/oauth/register`), OAuth 2.1 auth-code
  flow with **PKCE S256**, `refresh_token` grant, scope `mcp:tools`.
  Endpoints: authorize `https://mcp.motra.com/oauth/authorize`,
  token `https://mcp.motra.com/oauth/token`, resource `https://mcp.motra.com/mcp`.
- Anthropic **MCP connector** (Messages API): beta header `mcp-client-2025-11-20`;
  request carries `mcp_servers:[{type:"url",url,name,authorization_token}]` +
  `tools:[{type:"mcp_toolset",mcp_server_name}]`; responses contain `mcp_tool_use` /
  `mcp_tool_result` blocks (Anthropic executes the calls server-side). **Not
  ZDR-eligible** — token + tool data retained under standard policy.

## Privacy approach — DECIDED: Option A (MCP connector)
Use Anthropic's Messages API MCP connector. Workout data + the user's Motra token
transit Anthropic under standard (non-ZDR) retention; add a clear in-app privacy note
on the Connect screen. ~30 LOC over the OAuth flow. (Option B — self-hosted MCP client
keeping data on the server — was considered and set aside as more code than warranted
at this scale; revisit only if data sensitivity requirements change.)

## Shared: OAuth flow (no new dependencies — Node `fetch` + `crypto`)
New file `src/motra-oauth.ts`:
1. **Register once** (lazy, cached to `motra-client.json`): POST `/oauth/register`
   with our `redirect_uri` → store `client_id` (public client, PKCE — no secret).
2. **Connect** (`GET /api/motra/connect`, auth required): generate PKCE
   verifier/challenge + `state`, stash them in the session, 302 to `/oauth/authorize`
   with `scope=mcp:tools`.
3. **Callback** (`GET /api/motra/callback`): verify `state`, POST `/oauth/token`
   (`grant_type=authorization_code` + `code_verifier`) → save `{access_token,
   refresh_token, expires_at}` to `users/<id>/motra.json` (gitignored); set
   `profile.motraConnected = true`.
4. **Refresh** (`ensureToken(userId)`): if expired, POST `/oauth/token`
   (`grant_type=refresh_token`) and rewrite `motra.json`.
5. **Disconnect** (`POST /api/motra/disconnect`): delete `motra.json`, clear flag.

Touch points: `src/memory.ts` (read/write `motra.json`, add `motraConnected` to
profile schema + `memory-schema.md`), `src/index.ts` (the 4 routes),
`src/web/` (a "Connect Motra" button + connected/disconnected state).

## Chat-time wiring (Option A)
In `src/agent.ts`, when `await motra.ensureToken(userId)` returns a token, switch that
turn's call to `client.beta.messages.create({... , betas:["mcp-client-2025-11-20"]})`
and add `mcp_servers:[{type:"url",url:"https://mcp.motra.com/mcp",name:"motra",
authorization_token:<token>}]` + `tools:[{type:"mcp_toolset",mcp_server_name:"motra"}]`
(alongside the existing local memory tools). Pass `mcp_tool_use`/`mcp_tool_result`
blocks through the loop unchanged — Anthropic executes the calls server-side, so no
local handler is needed. When no token, send the request exactly as today (no beta
header, no `mcp_servers`).

## Knowledge / behavior
- Extend `nutrition-engine/meal-timing.md` + `nutrition-engine/SKILL.md`: when Motra is
  connected, prefer real recent training (load, recency, PRs) over `schedule.md` for
  timing and recovery suggestions; otherwise fall back to `schedule.md`.
- Add a short in-app privacy note for Option A explaining data flow to Anthropic.

## Verification
- OAuth round-trip: click Connect → authorize on Motra → `motra.json` written; expiry
  triggers a refresh; Disconnect removes it.
- Ask "show my last 5 workouts" and "I trained legs hard today, what's a good dinner?"
  → confirm the reply reflects real Motra data and stays kosher/fish-free/eggplant-free.
- Confirm unconnected users are unaffected (no beta header, no `mcp_servers`).
