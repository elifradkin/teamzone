# Architecture & Design

## Goal
A web-based, bilingual (Hebrew/English) fitness & nutrition assistant for ~20 users,
available in text (voice in phase 2), with deep per-user memory, grounded in the two
Team Zone plans, personalized per user, kosher + no-fish + no-eggplant.

## The core idea: static knowledge vs. dynamic user state
- **Static knowledge** (the two plans, kosher rules, meal-timing science, formulas,
  bilingual behavior) lives in `knowledge/skills/` as Markdown **Skills**. It rarely
  changes and is shared by all users → cacheable.
- **Dynamic state** (each user's metrics, goals, schedule, history) lives in
  `users/<id>/` as small Markdown/JSON files.
- Every turn, `agent.ts` fuses a cached static prefix + the user's small live state,
  then calls Claude with memory tools.

```
Browser (text; voice later)
   │  POST /api/chat
Express (src/index.ts) ── PIN auth, per-session history (last ~12 msgs)
   │
Agent (src/agent.ts)
   ├── system[0] CACHED: base rules + kosher + bilingual + nutrition-engine
   │                     + meal-timing + the user's plan (men/women)
   ├── system[1] LIVE:   now() + profile + targets + schedule + summary
   ├── tools: read_reference, update_profile, set_schedule, update_summary, append_log
   └── Claude (Sonnet) → tool loop → reply
        │
Memory (src/memory.ts) ── users/<id>/ : profile.json/.md, targets.json/.md,
                                        schedule.md, summary.md, log/YYYY-MM-DD.md
```

## Token & cost strategy (verify exact numbers in the Anthropic docs)
1. **Prompt caching** — the static prefix carries `cache_control: ephemeral`. Repeat
   turns read it at a large discount instead of re-paying for the full plan each time.
   Because the prefix varies only by sex, there are effectively two cache variants.
   - Docs: https://docs.claude.com/en/docs/build-with-claude/prompt-caching
2. **Progressive disclosure** — detail files (`food-database`, `calorie-macros`,
   `glossary`, etc.) are NOT in the prompt; the model pulls them via `read_reference`
   only when needed.
   - Docs (Skills): https://docs.claude.com/en/docs/agents-and-tools/agent-skills/overview
3. **Rolling summaries** — long history is compressed into `summary.md`; only the last
   ~12 messages are replayed. History stays cheap indefinitely.
4. **Model routing** — `MODEL_MAIN` (Sonnet) for answers; `MODEL_TRIAGE` (Haiku) is
   reserved for cheap classification/voice-language detection if you add it.
   - Models/pricing: https://docs.claude.com/en/docs/about-claude/models
5. **Compute in code, not tokens** — calorie/macro math runs in `profile.ts`, not by
   asking the model to do arithmetic.

## Personalization pipeline (see calorie-macros.md for the spec)
metrics → RMR (Katch–McArdle if body-fat % known, else Mifflin–St Jeor) → ×activity =
TDEE → goal adjustment → protein (2.5 g/kg, lean-adjusted for high body-fat) +
fat (~22%, floored) + carbs (remainder) → per-meal protein split → scaled plan portions.

## Kosher + house rules
Enforced on every suggestion by the `kosher-rules` skill: no pork/shellfish, no
fish (house rule), no eggplant (house rule), no meat+dairy in one meal. The two
source plans contained salmon and tuna — these are removed and replaced with
compliant swaps (chicken/turkey/tofu/eggs/dairy) in the plan files and
`food-database.md`.

## Voice — phase 2 (pipeline, not realtime)
Recommended: **STT → Claude → TTS** for best Hebrew control and ~5–10× lower cost
than an all-in-one realtime API.
- **STT:** OpenAI `gpt-4o-transcribe` (cheap, streaming, good Hebrew); upgrade to
  **ElevenLabs Scribe** if Hebrew accuracy needs it.
- **TTS:** **Azure Neural he-IL** voices (Avri/Hila) as the balanced default
  (~$15/1M chars); **ElevenLabs** for premium Hebrew naturalness.
- Rough cost: ~$45–60/mo for 20 users at moderate voice use.
- Implementation: a `/api/voice` endpoint that accepts audio, transcribes, detects
  language, runs the same `runTurn`, and returns text + synthesized audio. The web
  UI gets a push-to-talk button and audio playback.
- Verify current pricing before wiring: OpenAI, ElevenLabs, Azure Speech pricing pages.

## Security & privacy
- Per-user data is isolated by `userId`; one turn only ever loads one user's files.
- `users/` is git-ignored and mounted as a volume in production; back it up.
- Auth is a simple PIN list for a known, small group. For public scale, replace with
  real accounts (hashed passwords / OAuth) and a database.

## Known scale limits (fine for ~20 users; revisit if growing)
- Conversation history is in-memory per process (lost on restart; long-term
  continuity is preserved in `summary.md`). For multi-instance, move to Redis.
- File-based memory is great at this scale; migrate to a DB (SQLite/Postgres) if
  users or write volume grow substantially.
