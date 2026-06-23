# CLAUDE.md — Project conventions for Claude Code

Team Zone is a bilingual (Hebrew/English) fitness & nutrition assistant. Read this
before making changes.

## What this project is
- A Node/TypeScript web app whose "brain" is the Claude API.
- Knowledge = Markdown **Skills** in `knowledge/skills/`. App = `src/`. Private
  per-user memory = `users/<id>/` (git-ignored).
- Text-only today; voice is planned (see `ARCHITECTURE.md` → phase 2).

## Golden rules for changes
1. **Knowledge vs. code stay in sync.** The calorie/macro logic exists twice on
   purpose: prose in `knowledge/skills/nutrition-engine/calorie-macros.md` and code
   in `src/profile.ts`. If you change one, change the other.
2. **Never break the dietary guarantees.** Every suggestion must stay kosher,
   fish-free, and eggplant-free. The plan files already have fish removed with swaps;
   don't reintroduce fish/eggplant. The `kosher-rules` skill is always loaded.
3. **Keep the cached prefix stable.** `agent.ts` puts static skills + the user's plan
   in a `cache_control: ephemeral` block, and small per-user state in a separate
   uncached block. Don't move volatile data into the cached block (it kills cache hits).
4. **Progressive disclosure.** Add big reference content as a file under a skill and
   expose it via `read_reference` (register it in `memory.ts` → `REFERENCES`), rather
   than inflating the system prompt.
5. **Privacy.** Code paths must scope to a single `userId`. Never load or mix two
   users' data. Don't commit anything under `users/` except `_example/`.

## Conventions
- TypeScript, ESM, run via `tsx` (`npm run dev`). `npm run typecheck` before commits.
- Bilingual: reply logic must respect the user's message language (the `bilingual`
  skill). Keep new user-facing strings available in both Hebrew and English.
- Metric units, 24-hour time.
- Models come from env (`MODEL_MAIN`, `MODEL_TRIAGE`) — don't hardcode model IDs.

## Where things live
- Add/adjust meal logic → `knowledge/skills/nutrition-engine/`.
- Add a memory field → update `src/profile.ts` (type + math), `src/memory.ts`
  (render), the `update_profile` tool schema in `src/agent.ts`, and
  `knowledge/skills/user-memory/memory-schema.md`.
- Add a new tool → define it in `src/agent.ts` (`TOOLS` + `runTool`).

## Verifying
There's no test suite yet. To sanity-check: `npm run typecheck`, then `npm run dev`
and exercise onboarding + a meal request in both languages. Confirm no fish/eggplant
ever appears and portions track the user's targets.
