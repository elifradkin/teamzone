import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Req,
  UseGuards,
} from "@nestjs/common";
import { ConsentType } from "@prisma/client";
import type { Request } from "express";
import { AuthGuard } from "../auth/auth.guard";
import { ConsentService } from "./consent.service";
import { GrantConsentDto } from "./dto";

type AuthedRequest = Request & { user: { id: string } };

@Controller("consents")
@UseGuards(AuthGuard)
export class ConsentController {
  constructor(private readonly consent: ConsentService) {}

  @Get()
  list(@Req() req: AuthedRequest) {
    return this.consent.list(req.user.id);
  }

  @Post()
  grant(@Req() req: AuthedRequest, @Body() dto: GrantConsentDto) {
    return this.consent.grant(req.user.id, dto.type);
  }

  @Delete(":type")
  revoke(@Req() req: AuthedRequest, @Param("type") type: string) {
    if (!Object.values(ConsentType).includes(type as ConsentType)) {
      throw new BadRequestException("Unknown consent type");
    }
    return this.consent.revoke(req.user.id, type as ConsentType);
  }
}
