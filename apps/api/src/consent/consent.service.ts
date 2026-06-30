import { Injectable } from "@nestjs/common";
import { type ConsentType } from "@prisma/client";
import { PrismaService } from "../prisma/prisma.service";

@Injectable()
export class ConsentService {
  constructor(private readonly prisma: PrismaService) {}

  async list(userId: string) {
    const rows = await this.prisma.consent.findMany({ where: { userId } });
    return rows.map((c) => ({
      type: c.type,
      granted: c.revokedAt === null,
      grantedAt: c.grantedAt,
      revokedAt: c.revokedAt,
    }));
  }

  grant(userId: string, type: ConsentType) {
    return this.prisma.consent.upsert({
      where: { userId_type: { userId, type } },
      create: { userId, type },
      update: { revokedAt: null, grantedAt: new Date() },
    });
  }

  async revoke(userId: string, type: ConsentType) {
    await this.prisma.consent.updateMany({
      where: { userId, type },
      data: { revokedAt: new Date() },
    });
    return { ok: true };
  }
}
