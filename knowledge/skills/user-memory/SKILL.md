---
name: user-memory
description: How the assistant remembers each user across conversations. Use to read a user's profile, targets, schedule, and history at the start of a turn, and to update them when the user shares new info (new weight, changed goal, logged a meal, stated a preference).
---

# User Memory

Each user has a folder `users/<userId>/` with these files. The app loads the small
ones into context every turn; the assistant decides when to update them.

| File | Purpose | Loaded each turn? |
|---|---|---|
| `profile.md` | Identity, body metrics, goal, activity, restrictions, preferences | Yes (small) |
| `targets.md` | Computed daily calories + macros + per-meal protein targets | Yes (small) |
| `schedule.md` | Weekly training schedule + notes | Yes (small) |
| `summary.md` | Rolling summary of history & relationship | Yes (small) |
| `log/YYYY-MM-DD.md` | Per-day meals, weights, check-ins | On demand only |

## Reading
At the start of every turn the app injects `profile.md`, `targets.md`,
`schedule.md`, and `summary.md`. Use them as ground truth. Read a specific
`log/` file only if the user references a past day.

## Updating (use the memory tools the app exposes)
Update memory when the user reveals durable information:
- **New body metric** (weight, body-fat %, measurement) → update `profile.md`,
  then recompute and rewrite `targets.md` (see `../nutrition-engine/calorie-macros.md`).
- **Goal / activity change** → update `profile.md` + recompute `targets.md`.
- **Training schedule change** → update `schedule.md`.
- **New dislike / allergy / preference** → update `profile.md` restrictions.
- **A meal eaten or a daily check-in** → append to today's `log/` file.
- **Anything important about the relationship/progress** → fold into `summary.md`
  (keep it short — a rolling digest, not a transcript).

## Rolling summary discipline (keeps tokens low)
`summary.md` should stay roughly under ~300 words. When it grows, compress: keep
goals, trajectory, recurring preferences, and recent milestones; drop day-to-day
detail that's already in logs. This is what lets history stay cheap forever.

## Privacy
Never reveal one user's data to another. Each turn is scoped to a single userId.
See `memory-schema.md` for the exact file formats.
