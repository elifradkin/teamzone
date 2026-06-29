import { Module } from "@nestjs/common";
import { UsersModule } from "../users/users.module";
import { AuthController } from "./auth.controller";
import { AuthService } from "./auth.service";
import { SessionService } from "./session.service";
import { PasswordResetService } from "./password-reset.service";
import { AuthGuard } from "./auth.guard";

@Module({
  imports: [UsersModule],
  controllers: [AuthController],
  providers: [AuthService, SessionService, PasswordResetService, AuthGuard],
  exports: [AuthGuard, SessionService],
})
export class AuthModule {}
