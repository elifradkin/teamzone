import { BadRequestException, Injectable } from "@nestjs/common";
import { createHash, randomBytes } from "node:crypto";
import { PrismaService } from "../prisma/prisma.service";
import { UsersService } from "../users/users.service";
import { SessionService } from "./session.service";

const RESET_TTL_MS = 1000 * 60 * 60; // 1 hour

function hashToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

@Injectable()
export class PasswordResetService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly users: UsersService,
    private readonly sessions: SessionService,
  ) {}

  /** Returns the plaintext token (caller decides whether to expose it). */
  async request(email: string): Promise<string | null> {
    const user = await this.users.findByEmail(email);
    if (!user) return null; // do not reveal whether the email exists
    const token = randomBytes(32).toString("hex");
    await this.prisma.passwordResetToken.create({
      data: {
        userId: user.id,
        tokenHash: hashToken(token),
        expiresAt: new Date(Date.now() + RESET_TTL_MS),
      },
    });
    return token;
  }

  async reset(token: string, newPassword: string): Promise<void> {
    const record = await this.prisma.passwordResetToken.findUnique({
      where: { tokenHash: hashToken(token) },
    });
    if (!record || record.expiresAt.getTime() < Date.now()) {
      throw new BadRequestException("Invalid or expired token");
    }
    await this.users.updatePassword(record.userId, newPassword);
    // Invalidate all reset tokens + sessions for the user.
    await this.prisma.passwordResetToken.deleteMany({ where: { userId: record.userId } });
    await this.sessions.destroyAllForUser(record.userId);
  }
}
