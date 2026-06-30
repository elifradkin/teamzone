import { ConsentType } from "@prisma/client";
import { IsEnum } from "class-validator";

export class GrantConsentDto {
  @IsEnum(ConsentType)
  type!: ConsentType;
}
