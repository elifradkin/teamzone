import { Module } from "@nestjs/common";
import { AuthModule } from "./auth/auth.module";
import { AvatarModule } from "./avatar/avatar.module";
import { ConsentModule } from "./consent/consent.module";
import { HealthModule } from "./health/health.module";
import { MealPlansModule } from "./meal-plans/meal-plans.module";
import { MotraModule } from "./motra/motra.module";
import { PrismaModule } from "./prisma/prisma.module";
import { ProfileModule } from "./profile/profile.module";
import { ScoresModule } from "./scores/scores.module";
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
    ScoresModule,
    MotraModule,
    AvatarModule,
  ],
})
export class AppModule {}
