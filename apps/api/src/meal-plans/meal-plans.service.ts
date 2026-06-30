import { Injectable } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";
import { type BaselinePlan, baselineFor } from "./baseline-plans";

@Injectable()
export class MealPlansService {
  constructor(private readonly prisma: PrismaService) {}

  async getBaselineForUser(userId: string): Promise<BaselinePlan> {
    const profile = await this.prisma.profile.findUnique({
      where: { userId },
      select: { sex: true },
    });
    return baselineFor(profile?.sex ?? null);
  }
}
