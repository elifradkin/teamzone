import { MuscleGroup } from "@prisma/client";
import { Type } from "class-transformer";
import {
  ArrayMinSize,
  IsArray,
  IsDateString,
  IsEnum,
  IsInt,
  IsNumber,
  IsOptional,
  Max,
  Min,
  ValidateNested,
} from "class-validator";

export class EffortDto {
  @IsEnum(MuscleGroup)
  muscleGroup!: MuscleGroup;

  @IsInt()
  @Min(1)
  sets!: number;

  @IsNumber()
  @Min(0)
  volume!: number;

  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(10)
  rpe?: number;
}

export class CreateWorkoutDto {
  @IsOptional()
  @IsDateString()
  occurredAt?: string;

  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => EffortDto)
  efforts!: EffortDto[];
}
