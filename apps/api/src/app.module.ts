import { Module } from "@nestjs/common";
import { AuthModule } from "./auth/auth.module";
import { ConsentModule } from "./consent/consent.module";
import { HealthModule } from "./health/health.module";
import { MealPlansModule } from "./meal-plans/meal-plans.module";
import { PrismaModule } from "./prisma/prisma.module";
import { ProfileModule } from "./profile/profile.module";
import { WorkoutsModule } from "./workouts/workouts.module";

@Module({
  imports: [
    PrismaModule,
    HealthModule,
    AuthModule,
    WorkoutsModule,
    ProfileModule,
    MealPlansModule,
    ConsentModule,
  ],
})
export class AppModule {}
