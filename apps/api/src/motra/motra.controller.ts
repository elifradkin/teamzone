import {
  BadRequestException,
  Controller,
  Get,
  Post,
  Query,
  Req,
  Res,
  UseGuards,
} from "@nestjs/common";
import type { Request, Response } from "express";
import { AuthGuard } from "../auth/auth.guard";
import { MotraService } from "./motra.service";

type AuthedRequest = Request & { user: { id: string } };

@Controller("motra")
@UseGuards(AuthGuard)
export class MotraController {
  constructor(private readonly motra: MotraService) {}

  @Get("status")
  status(@Req() req: AuthedRequest) {
    return this.motra.status(req.user.id);
  }

  /** Returns the Motra authorization URL for the client to redirect the user to. */
  @Get("connect")
  connect(@Req() req: AuthedRequest) {
    return this.motra.beginConnect(req.user.id);
  }

  /** OAuth redirect target. Completes the flow, then bounces back to the app. */
  @Get("callback")
  async callback(
    @Req() req: AuthedRequest,
    @Query("code") code: string | undefined,
    @Res() res: Response,
  ) {
    if (!code) throw new BadRequestException("Missing authorization code");
    await this.motra.handleCallback(req.user.id, code);
    res.redirect(process.env.APP_BASE_URL ?? "/");
  }

  @Post("sync")
  sync(@Req() req: AuthedRequest) {
    return this.motra.syncNow(req.user.id);
  }

  @Post("disconnect")
  disconnect(@Req() req: AuthedRequest) {
    return this.motra.disconnect(req.user.id);
  }
}
