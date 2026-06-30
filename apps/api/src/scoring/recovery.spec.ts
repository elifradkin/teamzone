import { recoveryHoursFor, recoveryPct, scoreMuscles, type EffortInput } from "./recovery";

describe("recovery scoring (pure)", () => {
  it("scales recovery hours with sets and RPE", () => {
    expect(recoveryHoursFor(4, 8)).toBe(52); // 24 + 16 + (8-6)*6
    expect(recoveryHoursFor(0, null)).toBe(24); // floor
    expect(recoveryHoursFor(40, 10)).toBe(96); // ceiling
  });

  it("computes recovery percentage from time elapsed", () => {
    expect(recoveryPct(26, 4, 8)).toBe(50); // 26 / 52
    expect(recoveryPct(0, 4, 8)).toBe(0); // just trained
    expect(recoveryPct(1000, 4, 8)).toBe(100); // long ago → capped
  });

  it("aggregates per muscle and uses the latest session for recovery", () => {
    const now = new Date("2026-06-30T12:00:00.000Z");
    const efforts: EffortInput[] = [
      {
        muscleGroup: "chest",
        sets: 4,
        volume: 3200,
        rpe: 8,
        occurredAt: new Date("2026-06-29T10:00:00.000Z"), // 26h ago
      },
      {
        muscleGroup: "chest",
        sets: 2,
        volume: 1000,
        rpe: 7,
        occurredAt: new Date("2026-06-25T10:00:00.000Z"), // older, still in window
      },
      {
        muscleGroup: "legs-too-old",
        sets: 5,
        volume: 5000,
        rpe: 9,
        occurredAt: new Date("2026-06-01T10:00:00.000Z"), // outside 14d window
      },
    ];

    const scores = scoreMuscles(efforts, now);
    expect(scores).toHaveLength(1);
    const chest = scores[0];
    expect(chest.muscleGroup).toBe("chest");
    expect(chest.effortSets).toBe(6); // 4 + 2 in window
    expect(chest.recoveryPct).toBe(50); // from the latest (26h, 4 sets, rpe 8)
    expect(chest.lastTrainedHoursAgo).toBe(26);
  });
});
