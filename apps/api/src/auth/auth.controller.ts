import {
  Body,
  Controller,
  Get,
  HttpCode,
  Post,
  Req,
  Res,
  UseGuards,
} from "@nestjs/common";
import type { Request, Response } from "express";
import { AuthService } from "./auth.service";
import { SessionService } from "./session.service";
import { AuthGuard } from "./auth.guard";
import { LoginDto, SignupDto } from "./dto";
import { SESSION_COOKIE, sessionCookieOptions } from "./constants";

interface SessionUser {
  id: string;
  email: string;
}

@Controller("auth")
export class AuthController {
  constructor(
    private readonly auth: AuthService,
    private readonly sessions: SessionService,
  ) {}

  @Post("signup")
  async signup(@Body() dto: SignupDto, @Res({ passthrough: true }) res: Response) {
    const user = await this.auth.signup(dto.email, dto.password);
    await this.startSession(user.id, res);
    return { id: user.id, email: user.email };
  }

  @Post("login")
  @HttpCode(200)
  async login(@Body() dto: LoginDto, @Res({ passthrough: true }) res: Response) {
    const user = await this.auth.validateCredentials(dto.email, dto.password);
    await this.startSession(user.id, res);
    return { id: user.id, email: user.email };
  }

  @Post("logout")
  @HttpCode(200)
  async logout(@Req() req: Request, @Res({ passthrough: true }) res: Response) {
    const sessionId = req.cookies?.[SESSION_COOKIE];
    if (sessionId) await this.sessions.destroy(sessionId);
    res.clearCookie(SESSION_COOKIE, { path: "/" });
    return { ok: true };
  }

  @Get("me")
  @UseGuards(AuthGuard)
  me(@Req() req: Request & { user: SessionUser }) {
    return { id: req.user.id, email: req.user.email };
  }

  private async startSession(userId: string, res: Response): Promise<void> {
    const session = await this.sessions.create(userId);
    const maxAge = session.expiresAt.getTime() - Date.now();
    res.cookie(SESSION_COOKIE, session.id, sessionCookieOptions(maxAge));
  }
}
