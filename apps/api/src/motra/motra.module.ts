import { Module } from "@nestjs/common";
import { AuthModule } from "../auth/auth.module";
import { MotraController } from "./motra.controller";
import { MotraService } from "./motra.service";

@Module({
  imports: [AuthModule],
  controllers: [MotraController],
  providers: [MotraService],
  exports: [MotraService],
})
export class MotraModule {}
