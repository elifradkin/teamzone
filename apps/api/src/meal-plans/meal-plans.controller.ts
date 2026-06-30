import { Controller, Get, Req, UseGuards } from "@nestjs/common";
import type { Request } from "express";
import { AuthGuard } from "../auth/auth.guard";
import { MealPlansService } from "./meal-plans.service";

type AuthedRequest = Request & { user: { id: string } };

@Controller("meal-plans")
@UseGuards(AuthGuard)
export class MealPlansController {
  constructor(private readonly mealPlans: MealPlansService) {}

  @Get("baseline")
  baseline(@Req() req: AuthedRequest) {
    return this.mealPlans.getBaselineForUser(req.user.id);
  }
}
