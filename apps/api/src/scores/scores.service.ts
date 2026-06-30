import { Injectable } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";
import { type EffortInput, scoreMuscles } from "../scoring/recovery";

const WINDOW_DAYS = 14;

@Injectable()
export class ScoresService {
  constructor(private readonly prisma: PrismaService) {}

  async getScores(userId: string) {
    const since = new Date(Date.now() - WINDOW_DAYS * 24 * 3_600_000);
    const sessions = await this.prisma.workoutSession.findMany({
      where: { userId, occurredAt: { gte: since } },
      include: { efforts: true },
    });

    const efforts: EffortInput[] = sessions.flatMap((s) =>
      s.efforts.map((e) => ({
        muscleGroup: e.muscleGroup,
        sets: e.sets,
        volume: e.volume,
        rpe: e.rpe,
        occurredAt: s.occurredAt,
      })),
    );

    return scoreMuscles(efforts, new Date(), WINDOW_DAYS);
  }
}
