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
  listWorkouts: () => req<Workout[]>("/workouts"),
  createWorkout: (efforts: { muscleGroup: string; sets: number; volume: number }[]) =>
    req<Workout>("/workouts", { method: "POST", body: JSON.stringify({ efforts }) }),
};
