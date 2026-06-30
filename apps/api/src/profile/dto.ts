import { BodyType, Goal, Sex } from "@prisma/client";
import {
  IsArray,
  IsEnum,
  IsInt,
  IsNumber,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min,
} from "class-validator";

export class UpdateProfileDto {
  @IsOptional()
  @IsInt()
  @Min(13)
  @Max(120)
  age?: number;

  @IsOptional()
  @IsInt()
  @Min(50)
  @Max(260)
  heightCm?: number;

  @IsOptional()
  @IsEnum(Sex)
  sex?: Sex;

  @IsOptional()
  @IsEnum(BodyType)
  bodyType?: BodyType;

  @IsOptional()
  @IsArray()
  @IsEnum(Goal, { each: true })
  goals?: Goal[];

  @IsOptional()
  @IsString()
  @MaxLength(1000)
  foodPreferences?: string;

  @IsOptional()
  @IsNumber()
  @Min(30)
  @Max(400)
  targetWeightKg?: number;

  @IsOptional()
  @IsNumber()
  @Min(3)
  @Max(70)
  targetBodyFatPct?: number;

  // Recording a current weight creates a body-metric measurement (the single
  // source of truth for current weight).
  @IsOptional()
  @IsNumber()
  @Min(30)
  @Max(400)
  currentWeightKg?: number;

  @IsOptional()
  @IsNumber()
  @Min(3)
  @Max(70)
  currentBodyFatPct?: number;
}
