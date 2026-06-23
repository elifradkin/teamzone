# Calorie & Macro Personalization / חישוב קלוריות ומאקרו

This is how the assistant turns a user's body metrics + goal into concrete daily
targets, then scales the plan's reference portions to that user. The app computes
these numbers in `src/profile.ts` and stores them in `users/<id>/targets.md`; this
file is the human-readable spec and the reasoning the assistant should follow when
explaining choices.

## Step 1 — Resting metabolic rate (BMR/RMR)

**Preferred: Katch–McArdle** (uses body-fat %, most accurate when fat% is known — which we collect):
```
LBM (lean body mass, kg) = weight_kg × (1 − bodyfat_fraction)
RMR = 370 + (21.6 × LBM)
```

**Fallback: Mifflin–St Jeor** (when body-fat % is missing):
```
men:   RMR = 10×weight_kg + 6.25×height_cm − 5×age + 5
women: RMR = 10×weight_kg + 6.25×height_cm − 5×age − 161
```

## Step 2 — Total daily energy expenditure (TDEE)
`TDEE = RMR × activity_factor`, using general daily activity (training load is
handled separately by the plan's training-day options, so don't double-count):

| Activity level | Factor |
|---|---|
| Sedentary (desk, little movement) | 1.2 |
| Light (1–3 light sessions/wk, some walking) | 1.375 |
| Moderate (3–5 sessions/wk) | 1.55 |
| High (6+ sessions/wk, physical job) | 1.725 |

## Step 3 — Goal adjustment
| Goal | Calorie target |
|---|---|
| Fat loss / cut | TDEE − 15% to − 20% |
| Maintain | TDEE |
| Build muscle / lean gain | TDEE + 8% to + 12% |

Cap fat-loss deficits so intake never drops below **RMR** or below ~1,200 (women)
/ ~1,500 (men) kcal — if the math goes lower, flatten the deficit and flag it.

## Step 4 — Macros (honor the plan's protein-first philosophy)
1. **Protein = 2.5 g × bodyweight_kg** (the plan anchor). For higher body-fat
   users (men >25%, women >32%), compute on an *adjusted* weight =
   `LBM / 0.85` to avoid over-shooting; note this when it applies.
2. **Fat = ~20–25%** of total calories (min 0.6 g/kg for hormones).
3. **Carbohydrate = remaining calories.** On training days, shift ~10–15% of fat
   calories into carbs around the workout.
- Calories per gram: protein 4, carb 4, fat 9.

## Step 5 — Map targets to plan portions
The plan's reference portions assume a reference bodyweight (≈56 kg women, ≈76 kg
men). Scale the **protein source** proportionally to the user's protein target,
rounded to practical amounts:
- Chicken/turkey breast ≈ 31 g protein per 100 g cooked.
- Lean beef meatballs ≈ 26 g per 100 g.
- Tofu ≈ 12 g per 100 g; eggs ≈ 6 g each; cottage 5% ≈ 11 g per 100 g.
- Then set carbohydrate side to hit the day's carb target (rice/pita/oats), and fat
  via the listed oils/nuts/avocado.

Worked example (woman, 60 kg, 28% fat, moderate, fat-loss):
- LBM = 60 × 0.72 = 43.2 kg → RMR = 370 + 21.6×43.2 ≈ **1,303 kcal**
- TDEE = 1,303 × 1.55 ≈ 2,020 → −18% ≈ **1,656 kcal/day**
- Protein 2.5×60 = **150 g** (600 kcal) · Fat ~22% ≈ **40 g** (360 kcal) · Carbs ≈ **174 g** (696 kcal)
- Lunch protein target ~45 g → ~145 g cooked chicken breast, etc.

## Recompute triggers
Recompute targets whenever weight, body-fat %, activity, or goal changes, and at
least every 4 weeks. Always show the user the new numbers and what changed.

## Honesty rule
These formulas are estimates, not medical advice. If a user reports a medical
condition, pregnancy, an eating disorder, or medication that affects diet, advise
them to consult a physician/dietitian and keep suggestions conservative.
