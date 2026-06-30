// Maps Motra MCP workout payloads into the Motra-agnostic spine.
// IMPORTANT: the input shapes here are ASSUMED from Motra's documented tools and
// MUST be verified against real MCP responses before production use (R-1/Rule 9).
// Kept pure + isolated so the feature can be removed if Motra declines permission.

import type { MuscleGroup } from "@prisma/client";

export interface MotraSet {
  weight: number;
  reps: number;
  rpe?: number | null;
}

export interface MotraExercise {
  muscles: string[];
  sets: MotraSet[];
}

export interface MotraWorkout {
  date: string; // ISO timestamp
  exercises: MotraExercise[];
}

export interface NormalizedEffort {
  muscleGroup: MuscleGroup;
  sets: number;
  volume: number;
  rpe: number | null;
}

export interface NormalizedSession {
  occurredAt: Date;
  efforts: NormalizedEffort[];
}

// ASSUMED Motra muscle-name → canonical group mapping. Verify against real data.
const MUSCLE_MAP: Record<string, MuscleGroup> = {
  chest: "chest",
  pectorals: "chest",
  back: "back",
  lats: "back",
  "middle back": "back",
  "lower back": "back",
  traps: "back",
  shoulders: "shoulders",
  deltoids: "shoulders",
  biceps: "biceps",
  triceps: "triceps",
  forearms: "forearms",
  abs: "abs",
  abdominals: "abs",
  core: "abs",
  glutes: "glutes",
  quadriceps: "quadriceps",
  quads: "quadriceps",
  hamstrings: "hamstrings",
  calves: "calves",
};

export function normalizeMotraWorkouts(workouts: MotraWorkout[]): NormalizedSession[] {
  return workouts.map((w) => {
    const agg = new Map<MuscleGroup, { sets: number; volume: number; rpeSum: number; rpeCount: number }>();

    for (const ex of w.exercises) {
      const groups = [
        ...new Set(
          ex.muscles
            .map((m) => MUSCLE_MAP[m.toLowerCase()])
            .filter((g): g is MuscleGroup => g !== undefined),
        ),
      ];
      for (const g of groups) {
        const cur = agg.get(g) ?? { sets: 0, volume: 0, rpeSum: 0, rpeCount: 0 };
        for (const s of ex.sets) {
          cur.sets += 1;
          cur.volume += s.weight * s.reps;
          if (s.rpe != null) {
            cur.rpeSum += s.rpe;
            cur.rpeCount += 1;
          }
        }
        agg.set(g, cur);
      }
    }

    const efforts: NormalizedEffort[] = [...agg.entries()]
      .map(([muscleGroup, v]) => ({
        muscleGroup,
        sets: v.sets,
        volume: Math.round(v.volume),
        rpe: v.rpeCount > 0 ? Math.round((v.rpeSum / v.rpeCount) * 10) / 10 : null,
      }))
      .sort((a, b) => a.muscleGroup.localeCompare(b.muscleGroup));

    return { occurredAt: new Date(w.date), efforts };
  });
}
