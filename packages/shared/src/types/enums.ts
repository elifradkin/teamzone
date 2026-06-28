// Shared enums / unions for the Motra-agnostic data spine (see ARCHITECTURE.md §11).

export const LOCALES = ["en", "he"] as const;
export type Locale = (typeof LOCALES)[number];

export type Direction = "ltr" | "rtl";

/** Where a workout/effort record originated. The spine is source-agnostic. */
export const WORKOUT_SOURCES = ["motra", "manual", "health"] as const;
export type WorkoutSource = (typeof WORKOUT_SOURCES)[number];

/** How a food-log entry was created. */
export const FOOD_LOG_SOURCES = ["manual", "barcode", "nl_ai", "photo_ai"] as const;
export type FoodLogSource = (typeof FOOD_LOG_SOURCES)[number];

export type Sex = "male" | "female";

/** Drives the mannequin figure variant (see DECISIONS D15). */
export const BODY_TYPES = ["lean", "average", "muscular"] as const;
export type BodyType = (typeof BODY_TYPES)[number];

export const GOALS = [
  "build_muscle",
  "lose_fat",
  "gain_strength",
  "maintain",
  "improve_endurance",
] as const;
export type Goal = (typeof GOALS)[number];

/** Canonical muscle groups used by the mannequin + scoring. */
export const MUSCLE_GROUPS = [
  "chest",
  "back",
  "shoulders",
  "biceps",
  "triceps",
  "forearms",
  "abs",
  "glutes",
  "quadriceps",
  "hamstrings",
  "calves",
] as const;
export type MuscleGroup = (typeof MUSCLE_GROUPS)[number];

export const MEAL_SLOTS = ["breakfast", "lunch", "dinner", "snack"] as const;
export type MealSlot = (typeof MEAL_SLOTS)[number];

export type FoodSource = "off" | "usda";
