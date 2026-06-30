import { type MotraWorkout, normalizeMotraWorkouts } from "./normalizer";

describe("Motra normalizer (assumed payload → spine)", () => {
  it("aggregates per canonical muscle group", () => {
    const workouts: MotraWorkout[] = [
      {
        date: "2026-06-29T10:00:00.000Z",
        exercises: [
          {
            muscles: ["chest", "triceps"],
            sets: [
              { weight: 80, reps: 8, rpe: 8 },
              { weight: 80, reps: 8, rpe: 8 },
            ],
          },
          { muscles: ["quadriceps", "glutes"], sets: [{ weight: 100, reps: 5 }] },
        ],
      },
    ];

    const [session] = normalizeMotraWorkouts(workouts);
    expect(session.occurredAt.toISOString()).toBe("2026-06-29T10:00:00.000Z");
    expect(session.efforts).toHaveLength(4); // chest, glutes, quadriceps, triceps

    const chest = session.efforts.find((e) => e.muscleGroup === "chest");
    expect(chest).toEqual({ muscleGroup: "chest", sets: 2, volume: 1280, rpe: 8 });

    const glutes = session.efforts.find((e) => e.muscleGroup === "glutes");
    expect(glutes).toEqual({ muscleGroup: "glutes", sets: 1, volume: 500, rpe: null });
  });

  it("drops unmapped muscle names", () => {
    const [session] = normalizeMotraWorkouts([
      {
        date: "2026-06-29T10:00:00.000Z",
        exercises: [{ muscles: ["unknown-muscle"], sets: [{ weight: 50, reps: 10 }] }],
      },
    ]);
    expect(session.efforts).toEqual([]);
  });
});
