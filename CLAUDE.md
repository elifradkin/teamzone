# CLAUDE.md — TeamZone v2 Operating Rules

This file governs how Claude works in this project, in every session. Read it
fully before doing anything. These rules override default behavior. When a rule
here conflicts with a request, stop and raise the conflict rather than guessing.

## 0. What this project is
A bilingual (Hebrew + English, RTL-first) fitness + nutrition app — web and
mobile — self-hosted on a single Hetzner VPS, multi-user. See PLAN.md for the
phased roadmap and ARCHITECTURE.md for the stack and data model. Never let work
drift from those two documents without explicit approval (Rule 5).

## 1. Plan-first, phase-gated — never build ahead
- No code, schema, or infra is written until the current phase in PLAN.md is the
  active, approved phase.
- Work strictly within the scope of the active phase. If something useful belongs
  to a later phase, note it in PLAN.md and stop — do not build it early.
- Each phase ends at a VERIFICATION GATE. Run the full gate, then STOP and wait
  for Eli's explicit approval before starting the next phase. "Looks done" is not
  approval.
- After approval: update PLAN.md (mark phase done, record any deviations from
  plan, refine the next phase) BEFORE writing any next-phase code.

## 2. Verify forwards and backwards (new + regression) — test after each step
- "Test after each step" is mandatory, not aspirational. After every meaningful
  change: run the relevant unit/integration tests; for user-facing changes, run
  or describe an e2e check.
- FORWARD: the new work meets its acceptance criteria (the phase's Definition of
  Done).
- BACKWARD (regression): re-run the test suites for ALL prior phases. New work
  must not break shipped work. If you can't run a suite, say so explicitly — do
  not assume green.
- Every gate includes a Hebrew/English RTL smoke check (Rule 3).
- Prefer programmatic verification over assertion. Show what you ran and the
  result. If you didn't verify something, state that plainly.

## 3. Bilingual + RTL discipline
- Hebrew and English are first-class. RTL is the default-quality bar, not an
  afterthought. Every user-facing string is translated; no hardcoded display
  text in components.
- All UI must be checked in BOTH languages and BOTH directions (LTR for English,
  RTL for Hebrew): layout mirroring, text alignment, icon/chevron direction,
  number/date formatting, input fields, and the muscle-map/mannequin labels.
- Mixed-direction content (e.g. Hebrew text with English exercise names or
  numbers) must render correctly (bidi handling).
- The RTL smoke check is part of every verification gate. A feature is not done
  if it only works in one language/direction.

## 4. Secrets live only in `.env` — never on the client, never in git
- All API keys and credentials (Gemini, Claude/Anthropic, Motra per-user tokens,
  DB, object storage, OAuth secrets) live server-side in `.env`. `.env` is
  git-ignored; commit only `.env.example` with blank values.
- Gemini avatar generation and Claude Sonnet chat run SERVER-SIDE only. No key,
  token, or model call is ever exposed to the web or mobile client.
- Per-user Motra authorization tokens are sensitive credentials: encrypted at
  rest, never logged, revocable/deletable on request.
- Never print secrets to logs, terminal output, or error messages.

## 5. Ask before scope, stack, or schema changes
- Do NOT change the agreed stack, add a major dependency, alter the data
  model/DB schema, or expand a phase's scope without asking Eli first and getting
  an explicit yes.
- Locked decisions live in DECISIONS-AND-RISKS.md. Treat them as fixed unless
  Eli reopens them. If new information undermines a locked decision, surface it —
  don't silently route around it.
- Ask ONE question at a time when a decision is Eli's to make. Lead with a
  recommendation and the trade-offs. Don't bundle unrelated decisions.

## 6. Never reproduce Motra's UI, assets, or content (IP / ToS)
- The app builds ORIGINAL visualizations from the user's own raw numbers (muscle
  groups, sets, volume, RPE) pulled via that user's own Motra access.
- Never copy, screenshot, trace, re-host, or imitate Motra's UI, color schemes,
  icons, mannequins, or any Motra-authored asset.
- Motra data enters ONLY through sanctioned paths (see ARCHITECTURE.md): the
  prioritized server-side per-user ingestion path (contingent on Motra's terms),
  with a Motra-agnostic data spine and manual-entry fallback so the app works
  without Motra. Server-side ingestion stays gated on verified Motra ToS — if
  unverified or disallowed, do not build it; fall back.

## 7. Treat profile, workout, and image data as sensitive personal data
- GDPR + Israel's Privacy Protection Law (PPL) apply. Data minimization, purpose
  limitation, explicit consent, retention limits, and right-to-deletion are
  design requirements, not Phase 9 add-ons.
- Uploaded photos (avatar source) are the most sensitive data: explicit consent
  before upload, clear retention/deletion, no use beyond avatar generation, EU
  data residency.
- Don't add analytics, third-party SDKs, or data egress without checking this
  rule and asking (Rule 5).

## 8. Per-task Definition of Done
A task/phase is DONE only when ALL of these hold:
1. Scope matches the active phase in PLAN.md — nothing more, nothing less.
2. Forward tests pass (unit + integration + e2e where relevant) and meet the
   phase's stated acceptance criteria.
3. Regression: all prior phases' tests still pass (or gaps are explicitly named).
4. Hebrew/English RTL smoke check passes.
5. No secrets in client or git; `.env.example` updated if config changed.
6. PLAN.md updated: phase marked done, deviations noted, next phase refined.
7. Verification evidence is shown (what was run + results), not just claimed.
8. Stopped for Eli's approval before proceeding.

## 9. When uncertain — flag, don't guess
- If a fact is unverified (Motra terms, current Gemini model IDs, dataset
  license, Apple Health/Expo constraints, library behavior), say "unverified"
  and verify before relying on it. Never invent API shapes, model names, or
  legal terms.
- If blocked, stop and report the blocker plainly with options. Do not push
  forward on assumptions.

## 10. Session ritual (every time)
1. Read PLAN.md → identify the active phase and its Definition of Done.
2. Confirm with Eli what this session targets (stay in-phase).
3. Do the work in small steps; test after each (Rule 2).
4. Run the phase gate when scope is complete.
5. Stop for approval. Update PLAN.md. Only then continue.
