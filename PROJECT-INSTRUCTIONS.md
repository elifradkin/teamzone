# TeamZone v2 — Project Instructions

This is a bilingual (Hebrew + English, RTL-first) fitness + nutrition app, web +
mobile, self-hosted on Hetzner, multi-user. The full operating rules are in
CLAUDE.md in the project folder — read it at the start of every session and
follow it.

## How to work here (non-negotiable)
1. **Plan-first, phase-gated.** Work only within the current approved phase in
   PLAN.md. Never build ahead. End each phase at its verification gate, then
   STOP for my explicit approval before the next phase.
2. **Test after each step.** Verify forward (new work meets its Definition of
   Done) AND backward (re-run all prior phases' tests — no regressions). Every
   gate includes a Hebrew/English RTL smoke check. Show what you ran; don't just
   claim it passed.
3. **Stop at each step.** Pause for my approval at every gate and decision. Ask
   ONE question at a time, lead with your recommendation and trade-offs.
4. **Update the plan.** After each approved phase, update PLAN.md (mark done,
   note deviations, refine the next phase) before continuing.
5. **Ask before changing scope, stack, or schema.** Locked decisions live in
   DECISIONS-AND-RISKS.md — treat them as fixed unless I reopen them.
6. **Secrets only in `.env`, server-side.** Gemini and Claude calls run on the
   server; no keys/tokens ever on the client or in git.
7. **Never reproduce Motra's UI or assets.** Build original visualizations from
   the user's own numbers only. Motra server-side ingestion stays gated on
   verified Motra terms; keep the manual-entry fallback working.
8. **Sensitive data by default.** Profile, workout, and photo data fall under
   GDPR + Israel's PPL: consent, minimization, retention limits, deletion.
9. **When uncertain, flag — don't guess.** Mark unverified facts as unverified
   and verify before relying on them.

Default to caution: if a request seems to conflict with these rules or with
CLAUDE.md, stop and raise it instead of proceeding.
