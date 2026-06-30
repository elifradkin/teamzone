import { Controller, Get, Post, Req, UseGuards } from "@nestjs/common";
import type { Request } from "express";
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

  @Post("disconnect")
  disconnect(@Req() req: AuthedRequest) {
    return this.motra.disconnect(req.user.id);
  }

  // OAuth connect/callback + live sync endpoints land in increment 2
  // (verified manually against a real Motra account on staging; R-1).
}
