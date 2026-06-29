import { type INestApplication, ValidationPipe } from "@nestjs/common";
import { Test } from "@nestjs/testing";
import cookieParser from "cookie-parser";
import request from "supertest";
import { AppModule } from "../src/app.module";
import { PrismaService } from "../src/prisma/prisma.service";

describe("Password reset (e2e)", () => {
  let app: INestApplication;
  let prisma: PrismaService;

  const email = "reset@example.com";
  const oldPassword = "oldpassword1";
  const newPassword = "brandnewpass2";

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({ imports: [AppModule] }).compile();
    app = moduleRef.createNestApplication();
    app.use(cookieParser());
    app.setGlobalPrefix("api");
    app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));
    await app.init();

    prisma = app.get(PrismaService);
    await prisma.passwordResetToken.deleteMany();
    await prisma.session.deleteMany();
    await prisma.user.deleteMany();

    await request(app.getHttpServer())
      .post("/api/auth/signup")
      .send({ email, password: oldPassword })
      .expect(201);
  });

  afterAll(async () => {
    await app.close();
  });

  let token: string;

  it("issues a reset token (dev token outside production)", async () => {
    const res = await request(app.getHttpServer())
      .post("/api/auth/forgot-password")
      .send({ email })
      .expect(200);
    expect(res.body.ok).toBe(true);
    expect(typeof res.body.devToken).toBe("string");
    token = res.body.devToken;
  });

  it("returns 200 for an unknown email without revealing it", async () => {
    const res = await request(app.getHttpServer())
      .post("/api/auth/forgot-password")
      .send({ email: "nobody@example.com" })
      .expect(200);
    expect(res.body.ok).toBe(true);
    expect(res.body.devToken).toBeUndefined();
  });

  it("resets the password with a valid token", async () => {
    await request(app.getHttpServer())
      .post("/api/auth/reset-password")
      .send({ token, password: newPassword })
      .expect(200);
  });

  it("no longer accepts the old password", async () => {
    await request(app.getHttpServer())
      .post("/api/auth/login")
      .send({ email, password: oldPassword })
      .expect(401);
  });

  it("accepts the new password", async () => {
    await request(app.getHttpServer())
      .post("/api/auth/login")
      .send({ email, password: newPassword })
      .expect(200);
  });

  it("rejects an invalid reset token", async () => {
    await request(app.getHttpServer())
      .post("/api/auth/reset-password")
      .send({ token: "deadbeefdeadbeefdeadbeef", password: "anothernew3" })
      .expect(400);
  });
});
