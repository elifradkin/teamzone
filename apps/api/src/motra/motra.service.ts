import { Injectable } from "@nestjs/common";
import { WorkoutSource } from "@prisma/client";
import { PrismaService } from "../prisma/prisma.service";
import type { NormalizedSession } from "./normalizer";

@Injectable()
export class MotraService {
  constructor(private readonly prisma: PrismaService) {}

  async status(userId: string) {
    const conn = await this.prisma.motraConnection.findUnique({ where: { userId } });
    return {
      connected: conn != null,
      status: conn?.status ?? null,
      lastSyncedAt: conn?.lastSyncedAt ?? null,
    };
  }

  async disconnect(userId: string) {
    await this.prisma.motraConnection.deleteMany({ where: { userId } });
    return { ok: true };
  }

  /**
   * Persist normalized Motra workouts into the Motra-agnostic spine
   * (source = motra). The live OAuth + MCP fetch that produces these sessions is
   * increment 2 — verified manually against a real Motra account on staging.
   */
  async importWorkouts(userId: string, sessions: NormalizedSession[]) {
    for (const session of sessions) {
      await this.prisma.workoutSession.create({
        data: {
          userId,
          source: WorkoutSource.motra,
          occurredAt: session.occurredAt,
          efforts: {
            create: session.efforts.map((e) => ({
              muscleGroup: e.muscleGroup,
              sets: e.sets,
              volume: e.volume,
              rpe: e.rpe,
            })),
          },
        },
      });
    }
    await this.prisma.motraConnection.updateMany({
      where: { userId },
      data: { lastSyncedAt: new Date() },
    });
    return { imported: sessions.length };
  }
}
