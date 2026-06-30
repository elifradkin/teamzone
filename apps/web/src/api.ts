const BASE = "/api";

export interface User {
  id: string;
  email: string;
}

export interface Workout {
  id: string;
  occurredAt: string;
  source: string;
  efforts: unknown[];
}

export interface Profile {
  age: number | null;
  heightCm: number | null;
  sex: "male" | "female" | null;
  bodyType: "lean" | "average" | "muscular" | null;
  goals: string[];
  foodPreferences: string | null;
  targetWeightKg: number | null;
  currentWeightKg: number | null;
}

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
  sex: string;
  dailyTargets: { kcal: number; proteinG: number; carbsG: number; fatG: number };
  meals: Meal[];
}

export interface MuscleScore {
  muscleGroup: string;
  recoveryPct: number;
  effortSets: number;
  effortVolume: number;
  lastTrainedHoursAgo: number | null;
}

async function req<T>(path: string, options?: RequestInit): Promise<T> {
  const res = await fetch(BASE + path, {
    credentials: "include",
    headers: { "content-type": "application/json" },
    ...options,
  });
  if (!res.ok) {
    const body = (await res.json().catch(() => ({}))) as { message?: string };
    throw new Error(body.message ?? res.statusText);
  }
  return (res.status === 204 ? null : await res.json()) as T;
}

export const api = {
  me: () => req<User>("/auth/me"),
  signup: (email: string, password: string) =>
    req<User>("/auth/signup", { method: "POST", body: JSON.stringify({ email, password }) }),
  login: (email: string, password: string) =>
    req<User>("/auth/login", { method: "POST", body: JSON.stringify({ email, password }) }),
  logout: () => req<{ ok: boolean }>("/auth/logout", { method: "POST" }),
  getProfile: () => req<Profile>("/profile"),
  updateProfile: (data: Partial<Profile>) =>
    req<Profile>("/profile", { method: "PUT", body: JSON.stringify(data) }),
  getBaselinePlan: () => req<BaselinePlan>("/meal-plans/baseline"),
  getScores: () => req<MuscleScore[]>("/scores"),
  listWorkouts: () => req<Workout[]>("/workouts"),
  createWorkout: (efforts: { muscleGroup: string; sets: number; volume: number }[]) =>
    req<Workout>("/workouts", { method: "POST", body: JSON.stringify({ efforts }) }),
};
