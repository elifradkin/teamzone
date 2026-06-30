// Pure effort/recovery scoring over the data spine. Deterministic + unit-tested.
// Heuristic v1; refine with real data later. No DB or framework dependencies.

export interface EffortInput {
  muscleGroup: string;
  sets: number;
  volume: number;
  rpe: number | null;
  occurredAt: Date;
}

export interface MuscleScore {
  muscleGroup: string;
  /** 0 = just trained / fatigued, 100 = fully recovered. */
  recoveryPct: number;
  effortSets: number;
  effortVolume: number;
  lastTrainedHoursAgo: number | null;
}

const HOUR_MS = 3_600_000;

function clamp(n: number, lo: number, hi: number): number {
  return Math.min(hi, Math.max(lo, n));
}

/** How long a muscle needs to recover, scaled by how hard it was hit. */
export function recoveryHoursFor(sets: number, rpe: number | null): number {
  const base = 24;
  const fromSets = sets * 4;
  const fromRpe = rpe != null ? Math.max(0, rpe - 6) * 6 : 0;
  return clamp(base + fromSets + fromRpe, 24, 96);
}

export function recoveryPct(hoursSince: number, sets: number, rpe: number | null): number {
  const hours = recoveryHoursFor(sets, rpe);
  return clamp(Math.round((hoursSince / hours) * 100), 0, 100);
}

/**
 * Aggregate efforts per muscle within a window; recovery is computed from the
 * most recent session for that muscle.
 */
export function scoreMuscles(efforts: EffortInput[], now: Date, windowDays = 14): MuscleScore[] {
  const byMuscle = new Map<string, EffortInput[]>();
  for (const e of efforts) {
    const hoursAgo = (now.getTime() - e.occurredAt.getTime()) / HOUR_MS;
    if (hoursAgo <= windowDays * 24) {
      const arr = byMuscle.get(e.muscleGroup) ?? [];
      arr.push(e);
      byMuscle.set(e.muscleGroup, arr);
    }
  }

  const result: MuscleScore[] = [];
  for (const [muscleGroup, arr] of byMuscle) {
    const effortSets = arr.reduce((s, e) => s + e.sets, 0);
    const effortVolume = arr.reduce((s, e) => s + e.volume, 0);
    const latest = arr.reduce((a, b) => (a.occurredAt > b.occurredAt ? a : b));
    const hoursSince = (now.getTime() - latest.occurredAt.getTime()) / HOUR_MS;
    result.push({
      muscleGroup,
      recoveryPct: recoveryPct(hoursSince, latest.sets, latest.rpe),
      effortSets,
      effortVolume,
      lastTrainedHoursAgo: Math.round(hoursSince),
    });
  }
  return result.sort((a, b) => a.muscleGroup.localeCompare(b.muscleGroup));
}
