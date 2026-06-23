// Targets computation — the code mirror of knowledge/skills/nutrition-engine/calorie-macros.md
// Pure functions; no I/O. Used by onboarding and recompute flows.

export type Sex = "male" | "female";
export type Activity = "sedentary" | "light" | "moderate" | "high";
export type Goal = "fat_loss" | "maintain" | "build_muscle";

export interface Profile {
  userId: string;
  name?: string;
  language?: "he" | "en";
  sex: Sex;
  age?: number;
  height_cm?: number;
  weight_kg: number;
  bodyfat_pct?: number | null;
  activity: Activity;
  goal: Goal;
  goal_rate?: "slow" | "moderate" | "aggressive";
  restrictions?: string[];
  dislikes?: string;
  notes?: string;
}

export interface Targets {
  basis: "katch_mcardle" | "mifflin_st_jeor";
  rmr_kcal: number;
  tdee_kcal: number;
  calories_kcal: number;
  protein_g: number;
  carbs_g: number;
  fat_g: number;
  per_meal_protein_g: Record<string, number>;
}

const ACTIVITY_FACTOR: Record<Activity, number> = {
  sedentary: 1.2,
  light: 1.375,
  moderate: 1.55,
  high: 1.725,
};

const round = (n: number) => Math.round(n);

/** Step 1: resting metabolic rate. Katch–McArdle if body-fat % known, else Mifflin. */
export function computeRMR(p: Profile): { rmr: number; basis: Targets["basis"] } {
  if (p.bodyfat_pct != null && p.bodyfat_pct > 0 && p.bodyfat_pct < 70) {
    const lbm = p.weight_kg * (1 - p.bodyfat_pct / 100);
    return { rmr: 370 + 21.6 * lbm, basis: "katch_mcardle" };
  }
  // Mifflin–St Jeor fallback (needs height & age)
  const h = p.height_cm ?? 170;
  const a = p.age ?? 30;
  const base = 10 * p.weight_kg + 6.25 * h - 5 * a;
  return { rmr: p.sex === "male" ? base + 5 : base - 161, basis: "mifflin_st_jeor" };
}

/** Goal multiplier with sensible default rates. */
function goalAdjust(tdee: number, goal: Goal, rate: Profile["goal_rate"]): number {
  if (goal === "maintain") return tdee;
  if (goal === "build_muscle") {
    const pct = rate === "aggressive" ? 0.12 : rate === "slow" ? 0.08 : 0.1;
    return tdee * (1 + pct);
  }
  // fat_loss
  const pct = rate === "aggressive" ? 0.2 : rate === "slow" ? 0.15 : 0.18;
  return tdee * (1 - pct);
}

/** Full pipeline → Targets. Honors the plan's protein-first philosophy. */
export function computeTargets(p: Profile): Targets {
  const { rmr, basis } = computeRMR(p);
  const tdee = rmr * ACTIVITY_FACTOR[p.activity];

  let calories = goalAdjust(tdee, p.goal, p.goal_rate);
  // Safety floors: never below RMR or hard minimums.
  const hardFloor = p.sex === "male" ? 1500 : 1200;
  calories = Math.max(calories, rmr, hardFloor);

  // Protein anchor = 2.5 g/kg, adjusted toward lean mass for high body-fat users.
  let proteinWeight = p.weight_kg;
  const highFat =
    p.bodyfat_pct != null &&
    ((p.sex === "male" && p.bodyfat_pct > 25) || (p.sex === "female" && p.bodyfat_pct > 32));
  if (highFat && p.bodyfat_pct != null) {
    const lbm = p.weight_kg * (1 - p.bodyfat_pct / 100);
    proteinWeight = lbm / 0.85;
  }
  const protein_g = round(2.5 * proteinWeight);

  // Fat ~22% of calories, with a 0.6 g/kg floor for hormones.
  const fatFloor = 0.6 * p.weight_kg;
  const fat_g = round(Math.max((calories * 0.22) / 9, fatFloor));

  // Carbs fill the remainder (never negative).
  const usedKcal = protein_g * 4 + fat_g * 9;
  const carbs_g = round(Math.max((calories - usedKcal) / 4, 0));

  // Per-meal protein split (5 meals; night only on training days).
  const per_meal_protein_g = {
    breakfast: round(protein_g * 0.2),
    lunch: round(protein_g * 0.3),
    snack: round(protein_g * 0.15),
    dinner: round(protein_g * 0.25),
    night: round(protein_g * 0.1),
  };

  return {
    basis,
    rmr_kcal: round(rmr),
    tdee_kcal: round(tdee),
    calories_kcal: round(calories),
    protein_g,
    carbs_g,
    fat_g,
    per_meal_protein_g,
  };
}
