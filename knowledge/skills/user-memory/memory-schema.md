# Memory File Schemas

Exact formats for each per-user file. The app reads/writes these; keep them small
and Markdown-clean. All files live under `users/<userId>/`.

## profile.md
```markdown
# Profile — <name>
- userId: <id>
- language: he | en        # preferred reply language
- sex: male | female       # selects men's/women's plan
- age: <years>
- height_cm: <n>
- weight_kg: <n>           # update when it changes
- bodyfat_pct: <n or unknown>
- activity: sedentary | light | moderate | high
- goal: fat_loss | maintain | build_muscle
- goal_rate: slow | moderate | aggressive
- restrictions: kosher, no_fish, no_eggplant, <personal: e.g. lactose, peanut allergy>
- dislikes: <free text>
- notes: <anything else durable>
- updated: <YYYY-MM-DD>
```

## targets.md
```markdown
# Daily Targets — <name>
- basis: katch_mcardle | mifflin_st_jeor
- rmr_kcal: <n>
- tdee_kcal: <n>
- calories_kcal: <n>       # after goal adjustment
- protein_g: <n>
- carbs_g: <n>
- fat_g: <n>
- per_meal_protein_g: { breakfast: <n>, lunch: <n>, snack: <n>, dinner: <n>, night: <n> }
- computed: <YYYY-MM-DD>
```

## schedule.md
```markdown
# Training Schedule — <name>
- sunday: <e.g. strength 18:00 | rest>
- monday: ...
- tuesday: ...
- wednesday: ...
- thursday: ...
- friday: ...
- saturday: ...
- notes: <e.g. "often shifts evening sessions later">
- updated: <YYYY-MM-DD>
```

## summary.md
```markdown
# Summary — <name>
<≤300 words: goals, trajectory, what's working, recurring preferences,
recent milestones, anything to remember for continuity. Rolling digest.>
- updated: <YYYY-MM-DD>
```

## log/YYYY-MM-DD.md
```markdown
# Log — <YYYY-MM-DD>
- 08:10 breakfast: <what was eaten> (~Xg protein)
- 13:00 lunch: ...
- weight: <n kg>            # if measured
- training: <type @ time | none>
- note: <how they felt, adherence, etc.>
```
