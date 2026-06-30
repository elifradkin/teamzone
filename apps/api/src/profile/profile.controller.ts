import { Body, Controller, Get, Put, Req, UseGuards } from "@nestjs/common";
import type { Request } from "express";
import { AuthGuard } from "../auth/auth.guard";
import { UpdateProfileDto } from "./dto";
import { ProfileService } from "./profile.service";

type AuthedRequest = Request & { user: { id: string } };

@Controller("profile")
@UseGuards(AuthGuard)
export class ProfileController {
  constructor(private readonly profile: ProfileService) {}

  @Get()
  get(@Req() req: AuthedRequest) {
    return this.profile.get(req.user.id);
  }

  @Put()
  update(@Req() req: AuthedRequest, @Body() dto: UpdateProfileDto) {
    return this.profile.upsert(req.user.id, dto);
  }
}
