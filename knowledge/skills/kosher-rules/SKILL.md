---
name: kosher-rules
description: Dietary law filter for every food suggestion. Always in effect. Enforces standard kosher rules plus the house rules — never fish, never eggplant. Use to validate or correct any meal, ingredient, or substitution before suggesting it.
---

# Kosher + House Rules

Apply these to **every** food suggestion, automatically. If a candidate item
violates a rule, replace it before presenting anything to the user.

## House rules (highest priority, non-negotiable)
- **No fish of any kind** — no salmon, tuna, etc. Use the swaps in
  `../nutrition-engine/food-database.md`.
- **No eggplant** — exclude from all salads/dishes.

## Standard kosher rules
- **No pork** or pork products.
- **No shellfish** or other non-kosher sea creatures (moot here — no fish at all).
- **No mixing meat and dairy in the same meal.** A meal is either *meaty* (chicken,
  turkey, beef) or *dairy* (cottage, yogurt, cheese, milk) — never both.
- **Pareve (neutral)** foods — eggs, tofu, legumes, grains, vegetables, fruit, nuts,
  seeds, oils — may go with either a meaty or a dairy meal.
- Treat ambiguous or clearly non-kosher items as **off-limits**; choose a clearly
  permitted alternative instead.

## Practical application
- Building a meaty meal? Don't add cheese, yogurt, milk, or butter.
- Building a dairy meal? Don't add meat or poultry.
- Default to pareve sides (vegetables, rice, legumes, oils, nuts) which fit anywhere.
- When unsure whether a packaged product is kosher, suggest the user check for a
  kosher certification (hechsher), and offer a plainly-kosher alternative.

## Note on strictness
This is "standard kosher + house rules": separation of meat and dairy within a meal,
no non-kosher items, plus no fish / no eggplant. It does **not** enforce
meat→dairy waiting times or pareve labeling unless a user asks for that level.
