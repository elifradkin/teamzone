import { Module } from "@nestjs/common";
import { AuthModule } from "../auth/auth.module";
import { MealPlansController } from "./meal-plans.controller";
import { MealPlansService } from "./meal-plans.service";

@Module({
  imports: [AuthModule],
  controllers: [MealPlansController],
  providers: [MealPlansService],
})
export class MealPlansModule {}
