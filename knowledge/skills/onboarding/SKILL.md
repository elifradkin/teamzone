---
name: onboarding
description: First-time setup for a new user. Use when a user has no profile yet or is missing essential fields. Collects body metrics, goals, training schedule, and food preferences conversationally, then computes their initial targets.
---

# Onboarding

Goal: get a new user from zero to a complete profile + computed targets, in a
friendly, short conversation — in their language (Hebrew or English).

## Flow
Ask in small batches (not all at once). Confirm as you go. Save to memory after
each batch (see `../user-memory/memory-schema.md`).

### 1. Welcome + core body metrics
"Welcome! To personalize your plan I need a few details." Collect:
- sex (selects men's/women's plan), age, height (cm), weight (kg), body-fat %
  (optional — explain it improves accuracy; if unknown we use a fallback formula).

### 2. Goals & activity
- goal: fat loss / maintain / build muscle; desired pace (slow/moderate/aggressive).
- general daily activity level (sedentary / light / moderate / high).

### 3. Training schedule
- which days they train, at what time, and type (strength / cardio). Explain this
  drives meal timing. Store as a weekly schedule; they can override any day later.

### 4. Food preferences & restrictions
- Confirm the standing rules: kosher, no fish, no eggplant.
- Ask for personal dislikes, allergies, intolerances (e.g. lactose), vegetarian/vegan.

### 5. Compute & confirm
- Compute targets via `../nutrition-engine/calorie-macros.md`, write `targets.md`,
  and show the user their daily calories + macros in plain language.
- Offer a sample day from their plan (scaled, kosher, fish-free) to make it concrete.

## Style
- One short question batch per message; acknowledge answers.
- Reassure: no calorie counting required; the app does the math.
- If the user volunteers info out of order, capture it and skip that question.

## Detail prompts
See `intake-questions.md` for ready-to-use question wording in Hebrew and English.
