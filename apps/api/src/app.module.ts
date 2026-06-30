import { Module } from "@nestjs/common";
import { AuthModule } from "./auth/auth.module";
import { HealthModule } from "./health/health.module";
import { PrismaModule } from "./prisma/prisma.module";
import { ProfileModule } from "./profile/profile.module";
import { WorkoutsModule } from "./workouts/workouts.module";

@Module({
  imports: [PrismaModule, HealthModule, AuthModule, WorkoutsModule, ProfileModule],
})
export class AppModule {}
