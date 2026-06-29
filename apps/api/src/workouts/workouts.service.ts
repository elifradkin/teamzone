import { Injectable } from "@nestjs/common";
import { WorkoutSource } from "@prisma/client";
import { PrismaService } from "../prisma/prisma.service";
import { CreateWorkoutDto } from "./dto";

@Injectable()
export class WorkoutsService {
  constructor(private readonly prisma: PrismaService) {}

  create(userId: string, dto: CreateWorkoutDto) {
    return this.prisma.workoutSession.create({
      data: {
        userId,
        source: WorkoutSource.manual,
        occurredAt: dto.occurredAt ? new Date(dto.occurredAt) : new Date(),
        efforts: {
          create: dto.efforts.map((e) => ({
            muscleGroup: e.muscleGroup,
            sets: e.sets,
            volume: e.volume,
            rpe: e.rpe ?? null,
          })),
        },
      },
      include: { efforts: true },
    });
  }

  list(userId: string) {
    return this.prisma.workoutSession.findMany({
      where: { userId },
      orderBy: { occurredAt: "desc" },
      include: { efforts: true },
    });
  }
}
