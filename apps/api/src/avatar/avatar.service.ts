import { ForbiddenException, Injectable } from "@nestjs/common";
import { ConsentType } from "@prisma/client";
import { PrismaService } from "../prisma/prisma.service";

const RETENTION_DAYS = 365;

@Injectable()
export class AvatarService {
  constructor(private readonly prisma: PrismaService) {}

  async hasPhotoConsent(userId: string): Promise<boolean> {
    const consent = await this.prisma.consent.findUnique({
      where: { userId_type: { userId, type: ConsentType.avatar_photo } },
    });
    return consent != null && consent.revokedAt === null;
  }

  async savePhoto(userId: string, data: Buffer, contentType: string) {
    if (!(await this.hasPhotoConsent(userId))) {
      throw new ForbiddenException("avatar_photo consent required");
    }
    const retentionUntil = new Date(Date.now() + RETENTION_DAYS * 24 * 3_600_000);
    await this.prisma.avatarPhoto.upsert({
      where: { userId },
      create: { userId, data, contentType, retentionUntil },
      update: { data, contentType, retentionUntil, uploadedAt: new Date() },
    });
    return { ok: true };
  }

  getPhoto(userId: string) {
    return this.prisma.avatarPhoto.findUnique({ where: { userId } });
  }

  async deletePhoto(userId: string) {
    await this.prisma.avatarPhoto.deleteMany({ where: { userId } });
    return { ok: true };
  }
}
