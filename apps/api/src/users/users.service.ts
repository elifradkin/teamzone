import { Injectable } from "@nestjs/common";
import * as argon2 from "argon2";
import { PrismaService } from "../prisma/prisma.service";

@Injectable()
export class UsersService {
  constructor(private readonly prisma: PrismaService) {}

  async create(email: string, password: string) {
    const passwordHash = await argon2.hash(password, { type: argon2.argon2id });
    return this.prisma.user.create({
      data: { email: email.toLowerCase(), passwordHash },
    });
  }

  findByEmail(email: string) {
    return this.prisma.user.findUnique({ where: { email: email.toLowerCase() } });
  }

  findById(id: string) {
    return this.prisma.user.findUnique({ where: { id } });
  }

  async updatePassword(userId: string, newPassword: string) {
    const passwordHash = await argon2.hash(newPassword, { type: argon2.argon2id });
    return this.prisma.user.update({ where: { id: userId }, data: { passwordHash } });
  }
}
