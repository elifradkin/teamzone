// Baseline meal-plan seed templates (Phase 2). Static starting points for men and
// women; profile/load-based auto-adjustment is added in Phase 7. Item names carry
// both languages so the client can render bilingually.

import type { Sex } from "@prisma/client";

export interface MealItem {
  nameEn: string;
  nameHe: string;
  kcal: number;
  proteinG: number;
  carbsG: number;
  fatG: number;
}

export interface Meal {
  slot: "breakfast" | "lunch" | "dinner" | "snack";
  items: MealItem[];
}

export interface BaselinePlan {
  sex: Sex;
  dailyTargets: { kcal: number; proteinG: number; carbsG: number; fatG: number };
  meals: Meal[];
}

const male: BaselinePlan = {
  sex: "male",
  dailyTargets: { kcal: 2400, proteinG: 170, carbsG: 250, fatG: 70 },
  meals: [
    {
      slot: "breakfast",
      items: [
        { nameEn: "Oats with banana", nameHe: "שיבולת שועל עם בננה", kcal: 350, proteinG: 12, carbsG: 60, fatG: 7 },
        { nameEn: "Eggs (3)", nameHe: "ביצים (3)", kcal: 230, proteinG: 18, carbsG: 2, fatG: 16 },
      ],
    },
    {
      slot: "lunch",
      items: [
        { nameEn: "Grilled chicken breast", nameHe: "חזה עוף בגריל", kcal: 330, proteinG: 60, carbsG: 0, fatG: 8 },
        { nameEn: "Rice", nameHe: "אורז", kcal: 300, proteinG: 6, carbsG: 65, fatG: 1 },
        { nameEn: "Mixed vegetables", nameHe: "ירקות מעורבים", kcal: 90, proteinG: 4, carbsG: 16, fatG: 1 },
      ],
    },
    {
      slot: "dinner",
      items: [
        { nameEn: "Salmon fillet", nameHe: "פילה סלמון", kcal: 360, proteinG: 34, carbsG: 0, fatG: 24 },
        { nameEn: "Potatoes", nameHe: "תפוחי אדמה", kcal: 240, proteinG: 6, carbsG: 52, fatG: 0 },
        { nameEn: "Green salad", nameHe: "סלט ירוק", kcal: 80, proteinG: 2, carbsG: 8, fatG: 5 },
      ],
    },
    {
      slot: "snack",
      items: [
        { nameEn: "Greek yogurt", nameHe: "יוגורט יווני", kcal: 150, proteinG: 15, carbsG: 12, fatG: 4 },
        { nameEn: "Walnuts", nameHe: "אגוזי מלך", kcal: 130, proteinG: 3, carbsG: 3, fatG: 13 },
      ],
    },
  ],
};

const female: BaselinePlan = {
  sex: "female",
  dailyTargets: { kcal: 1900, proteinG: 130, carbsG: 190, fatG: 60 },
  meals: [
    {
      slot: "breakfast",
      items: [
        { nameEn: "Greek yogurt with berries", nameHe: "יוגורט יווני עם פירות יער", kcal: 220, proteinG: 18, carbsG: 22, fatG: 6 },
        { nameEn: "Whole-grain toast", nameHe: "טוסט מלא", kcal: 120, proteinG: 5, carbsG: 20, fatG: 2 },
      ],
    },
    {
      slot: "lunch",
      items: [
        { nameEn: "Grilled chicken breast", nameHe: "חזה עוף בגריל", kcal: 250, proteinG: 45, carbsG: 0, fatG: 6 },
        { nameEn: "Quinoa", nameHe: "קינואה", kcal: 220, proteinG: 8, carbsG: 39, fatG: 4 },
        { nameEn: "Mixed vegetables", nameHe: "ירקות מעורבים", kcal: 90, proteinG: 4, carbsG: 16, fatG: 1 },
      ],
    },
    {
      slot: "dinner",
      items: [
        { nameEn: "Baked cod", nameHe: "בקלה אפוי", kcal: 220, proteinG: 38, carbsG: 0, fatG: 6 },
        { nameEn: "Sweet potato", nameHe: "בטטה", kcal: 180, proteinG: 4, carbsG: 41, fatG: 0 },
        { nameEn: "Green salad", nameHe: "סלט ירוק", kcal: 80, proteinG: 2, carbsG: 8, fatG: 5 },
      ],
    },
    {
      slot: "snack",
      items: [
        { nameEn: "Cottage cheese", nameHe: "גבינת קוטג'", kcal: 120, proteinG: 14, carbsG: 6, fatG: 4 },
        { nameEn: "Apple", nameHe: "תפוח", kcal: 95, proteinG: 0, carbsG: 25, fatG: 0 },
      ],
    },
  ],
};

export const BASELINE_PLANS: Record<Sex, BaselinePlan> = { male, female };

/** Default to the male baseline when sex is unset (overridden by profile in Phase 7). */
export function baselineFor(sex: Sex | null | undefined): BaselinePlan {
  return sex ? BASELINE_PLANS[sex] : BASELINE_PLANS.male;
}
