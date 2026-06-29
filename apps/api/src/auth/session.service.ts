import { Injectable } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";

const SESSION_TTL_MS = 1000 * 60 * 60 * 24 * 30; // 30 days

@Injectable()
export class SessionService {
  constructor(private readonly prisma: PrismaService) {}

  async create(userId: string) {
    const expiresAt = new Date(Date.now() + SESSION_TTL_MS);
    return this.prisma.session.create({ data: { userId, expiresAt } });
  }

  /** Returns the session's user if valid + unexpired, else null. */
  async validate(sessionId: string) {
    const session = await this.prisma.session.findUnique({
      where: { id: sessionId },
      include: { user: true },
    });
    if (!session || session.expiresAt.getTime() < Date.now()) return null;
    return session.user;
  }

  async destroy(sessionId: string) {
    await this.prisma.session.deleteMany({ where: { id: sessionId } });
  }
}
