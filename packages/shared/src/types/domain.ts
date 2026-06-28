// Core domain entities for the data spine. Mirrors ARCHITECTURE.md §11 (v1 sketch).
// These are the shared shapes; the DB schema (Prisma) is the source of truth at runtime.

import type {
  BodyType,
  FoodLogSource,
  Goal,
  Locale,
  MealSlot,
  MuscleGroup,
  Sex,
  WorkoutSource,
} from "./enums.js";

export interface User {
  id: string;
  email: string;
  locale: Locale;
  createdAt: string;
}

export interface Profile {
  userId: string;
  age?: number;
  heightCm?: number;
  bodyType?: BodyType;
  sex?: Sex;
  goals: Goal[];
  foodPreferencesText?: string;
  /** Optional targets (see DECISIONS D-targets). Body fat is optional. */
  targetWeightKg?: number;
  targetBodyFatPct?: number;
  startingWeightKg?: number;
}

/** Current weight/body fat = latest measurement (single source of truth). */
export interface BodyMetric {
  id: string;
  userId: string;
  weightKg: number;
  bodyFatPct?: number;
  measuredAt: string;
}

export interface WorkoutSession {
  id: string;
  userId: string;
  source: WorkoutSource;
  occurredAt: string;
  efforts: MuscleEffort[];
}

export interface MuscleEffort {
  sessionId: string;
  muscleGroup: MuscleGroup;
  sets: number;
  volume: number;
  rpe?: number;
}

/** Per-muscle effort + recovery, as of a moment. */
export interface MuscleScore {
  userId: string;
  muscleGroup: MuscleGroup;
  effortScore: number;
  recoveryScore: number;
  asOf: string;
}

export interface FoodLogEntry {
  id: string;
  userId: string;
  foodId: string;
  portion: number;
  mealSlot: MealSlot;
  loggedAt: string;
  source: FoodLogSource;
  /** AI-created entries are not persisted until the user confirms (R-17/R-18). */
  confirmed: boolean;
}

export interface HydrationLog {
  id: string;
  userId: string;
  amountMl: number;
  loggedAt: string;
}
