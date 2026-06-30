import { Injectable } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";
import { UpdateProfileDto } from "./dto";

@Injectable()
export class ProfileService {
  constructor(private readonly prisma: PrismaService) {}

  async get(userId: string) {
    const profile = await this.prisma.profile.findUnique({ where: { userId } });
    const latest = await this.prisma.bodyMetric.findFirst({
      where: { userId },
      orderBy: { measuredAt: "desc" },
    });
    return {
      ...(profile ?? { userId, goals: [] }),
      currentWeightKg: latest?.weightKg ?? null,
      currentBodyFatPct: latest?.bodyFatPct ?? null,
    };
  }

  async upsert(userId: string, dto: UpdateProfileDto) {
    const { currentWeightKg, currentBodyFatPct, ...profileData } = dto;

    await this.prisma.profile.upsert({
      where: { userId },
      create: { userId, ...profileData, goals: dto.goals ?? [] },
      update: profileData,
    });

    if (currentWeightKg != null) {
      await this.prisma.bodyMetric.create({
        data: { userId, weightKg: currentWeightKg, bodyFatPct: currentBodyFatPct ?? null },
      });
    }

    return this.get(userId);
  }
}
