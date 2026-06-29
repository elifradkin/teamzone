import { type INestApplication, ValidationPipe } from "@nestjs/common";
import { Test } from "@nestjs/testing";
import cookieParser from "cookie-parser";
import request from "supertest";
import { AppModule } from "../src/app.module";
import { PrismaService } from "../src/prisma/prisma.service";

describe("Auth (e2e)", () => {
  let app: INestApplication;
  let prisma: PrismaService;

  const email = "eli@example.com";
  const password = "supersecret1";
  let cookie: string;

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({ imports: [AppModule] }).compile();
    app = moduleRef.createNestApplication();
    app.use(cookieParser());
    app.setGlobalPrefix("api");
    app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));
    await app.init();

    prisma = app.get(PrismaService);
    await prisma.muscleEffort.deleteMany();
    await prisma.workoutSession.deleteMany();
    await prisma.session.deleteMany();
    await prisma.user.deleteMany();
  });

  afterAll(async () => {
    await app.close();
  });

  it("signs up and sets a session cookie", async () => {
    const res = await request(app.getHttpServer())
      .post("/api/auth/signup")
      .send({ email, password })
      .expect(201);
    expect(res.body.email).toBe(email);
    const setCookie = res.headers["set-cookie"] as unknown as string[];
    expect(setCookie?.[0]).toContain("tz_session=");
    cookie = setCookie[0];
  });

  it("rejects /me without a cookie", async () => {
    await request(app.getHttpServer()).get("/api/auth/me").expect(401);
  });

  it("returns the user from /me with a valid cookie", async () => {
    const res = await request(app.getHttpServer())
      .get("/api/auth/me")
      .set("Cookie", cookie)
      .expect(200);
    expect(res.body.email).toBe(email);
  });

  it("rejects a duplicate signup", async () => {
    await request(app.getHttpServer())
      .post("/api/auth/signup")
      .send({ email, password })
      .expect(409);
  });

  it("logs in with correct credentials", async () => {
    const res = await request(app.getHttpServer())
      .post("/api/auth/login")
      .send({ email, password })
      .expect(200);
    expect(res.body.email).toBe(email);
  });

  it("rejects bad credentials", async () => {
    await request(app.getHttpServer())
      .post("/api/auth/login")
      .send({ email, password: "wrongpassword" })
      .expect(401);
  });

  it("rejects invalid input (short password)", async () => {
    await request(app.getHttpServer())
      .post("/api/auth/signup")
      .send({ email: "other@example.com", password: "short" })
      .expect(400);
  });

  it("logs out and clears the session", async () => {
    await request(app.getHttpServer())
      .post("/api/auth/logout")
      .set("Cookie", cookie)
      .expect(200);
    await request(app.getHttpServer())
      .get("/api/auth/me")
      .set("Cookie", cookie)
      .expect(401);
  });
});
