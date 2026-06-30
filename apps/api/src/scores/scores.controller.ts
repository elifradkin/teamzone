import { Controller, Get, Req, UseGuards } from "@nestjs/common";
import type { Request } from "express";
import { AuthGuard } from "../auth/auth.guard";
import { ScoresService } from "./scores.service";

type AuthedRequest = Request & { user: { id: string } };

@Controller("scores")
@UseGuards(AuthGuard)
export class ScoresController {
  constructor(private readonly scores: ScoresService) {}

  @Get()
  get(@Req() req: AuthedRequest) {
    return this.scores.getScores(req.user.id);
  }
}
