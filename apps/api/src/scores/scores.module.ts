import { Module } from "@nestjs/common";
import { AuthModule } from "../auth/auth.module";
import { ScoresController } from "./scores.controller";
import { ScoresService } from "./scores.service";

@Module({
  imports: [AuthModule],
  controllers: [ScoresController],
  providers: [ScoresService],
})
export class ScoresModule {}
