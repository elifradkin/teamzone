import { Body, Controller, Get, Post, Req, UseGuards } from "@nestjs/common";
import type { Request } from "express";
import { AuthGuard } from "../auth/auth.guard";
import { CreateWorkoutDto } from "./dto";
import { WorkoutsService } from "./workouts.service";

type AuthedRequest = Request & { user: { id: string } };

@Controller("workouts")
@UseGuards(AuthGuard)
export class WorkoutsController {
  constructor(private readonly workouts: WorkoutsService) {}

  @Post()
  create(@Req() req: AuthedRequest, @Body() dto: CreateWorkoutDto) {
    return this.workouts.create(req.user.id, dto);
  }

  @Get()
  list(@Req() req: AuthedRequest) {
    return this.workouts.list(req.user.id);
  }
}
