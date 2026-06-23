# Meal Timing Around Training / תזמון ארוחות סביב אימון

How to choose and adjust meals based on the user's training time. This is the logic
behind requests like *"I train at 20:00, what's a good early dinner?"*

## Inputs the assistant uses
- **If Motra is connected** (indicated in the system prompt): use Motra MCP tools to
  fetch the user's real logged workouts, exercise history, and health stats. Real data
  always takes priority over the static schedule for timing decisions and recovery
  nutrition. Use `motra_query_workouts` for recent sessions, `motra_health_readiness`
  for recovery state, `motra_health_snapshot` for today's context.
- **Fallback (no Motra):** The user's stored weekly schedule (`users/<id>/schedule.md`)
  AND any ad-hoc override in the message ("today I train at 20:00").
- Current time / the meal being asked about.
- Whether it's a morning or evening training day.

## Principles (from the plan)
- **Pre-workout (≈0.5–2 h before):** a balanced meal — protein + complex carbs +
  some fat. Complex carbs digest slowly → steady energy. Keep fat moderate so
  digestion isn't heavy right before training.
- **Immediately before (≤30 min), esp. morning training:** a fast carb in fruit
  form (date or banana) for quick, available energy. Optional.
- **Post-workout:** not mandatory. Eat if weak/dizzy/tired → a full balanced meal
  with all macros. Otherwise resume the normal meal schedule. A protein-forward
  meal/snack within ~1–2 h supports recovery.
- **Dinner finishes by 20:00** on normal days. **Exception:** on an evening-training
  day, the post-workout meal may be eaten after training, by ~21:00, and the
  optional night meal at ~21:30 (training days only).

## Decision guide
**"I train at 20:00, what can I eat for an early dinner?"**
→ The user wants a *pre-workout* meal ~17:30–18:30. Recommend a balanced dinner
option that is protein + complex carb + moderate fat, not too heavy:
- Choose a dinner option with a complex carb (bread/oats/lentils) so energy lasts
  through the session.
- Keep fat moderate (skip large avocado/heavy oil right before training).
- Suggest a small fast carb (banana/date) ~20–30 min before if they like.
- Note they can have the **night meal (~21:30)** option afterward since it's a
  training day (protein-forward, e.g. Pro yogurt / protein shake).

**Morning training (e.g. 06:30):**
→ Optional date/banana before; do breakfast *after* the workout (the plan's
breakfast window already assumes post-workout on training mornings).

**Midday training:**
→ Make lunch the pre/post anchor; put the carb side of lunch toward the workout.

## Macro shifts on training days
- Move ~10–15% of the day's fat calories into carbohydrate, placed around the
  workout (see `calorie-macros.md`).
- Training days unlock the **training-day snack option** and the **night meal**.

## Always
- Respect kosher + no-fish + no-eggplant and the user's personal restrictions when
  picking the specific option (see `kosher-rules`).
- Keep portions scaled to the user's `targets.md`.
- State *why* the option fits the timing in one short sentence.
