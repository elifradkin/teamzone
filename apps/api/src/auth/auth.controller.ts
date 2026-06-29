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
import { PasswordResetService } from "./password-reset.service";
import { AuthGuard } from "./auth.guard";
import { ForgotPasswordDto, LoginDto, ResetPasswordDto, SignupDto } from "./dto";
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
    private readonly passwordReset: PasswordResetService,
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

  @Post("forgot-password")
  @HttpCode(200)
  async forgotPassword(@Body() dto: ForgotPasswordDto) {
    const token = await this.passwordReset.request(dto.email);
    // Always 200 (don't reveal whether the email exists). Email delivery is
    // stubbed for now; outside production we return the token so the flow is
    // testable until SMTP is wired in.
    const body: { ok: true; devToken?: string } = { ok: true };
    if (process.env.NODE_ENV !== "production" && token) body.devToken = token;
    return body;
  }

  @Post("reset-password")
  @HttpCode(200)
  async resetPassword(@Body() dto: ResetPasswordDto) {
    await this.passwordReset.reset(dto.token, dto.password);
    return { ok: true };
  }

  private async startSession(userId: string, res: Response): Promise<void> {
    const session = await this.sessions.create(userId);
    const maxAge = session.expiresAt.getTime() - Date.now();
    res.cookie(SESSION_COOKIE, session.id, sessionCookieOptions(maxAge));
  }
}
