import { type INestApplication, ValidationPipe } from "@nestjs/common";
import { Test } from "@nestjs/testing";
import cookieParser from "cookie-parser";
import request from "supertest";
import { AppModule } from "../src/app.module";
import { PrismaService } from "../src/prisma/prisma.service";

describe("Profile (e2e)", () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let cookie: string;

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({ imports: [AppModule] }).compile();
    app = moduleRef.createNestApplication();
    app.use(cookieParser());
    app.setGlobalPrefix("api");
    app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));
    await app.init();

    prisma = app.get(PrismaService);
    await prisma.bodyMetric.deleteMany();
    await prisma.profile.deleteMany();
    await prisma.session.deleteMany();
    await prisma.user.deleteMany();

    const res = await request(app.getHttpServer())
      .post("/api/auth/signup")
      .send({ email: "profile@example.com", password: "supersecret1" })
      .expect(201);
    cookie = (res.headers["set-cookie"] as unknown as string[])[0];
  });

  afterAll(async () => {
    await app.close();
  });

  it("rejects profile access without a session", async () => {
    await request(app.getHttpServer()).get("/api/profile").expect(401);
  });

  it("returns an empty profile shell before any data", async () => {
    const res = await request(app.getHttpServer())
      .get("/api/profile")
      .set("Cookie", cookie)
      .expect(200);
    expect(res.body.goals).toEqual([]);
    expect(res.body.currentWeightKg).toBeNull();
  });

  it("saves the profile and records a current weight", async () => {
    const res = await request(app.getHttpServer())
      .put("/api/profile")
      .set("Cookie", cookie)
      .send({
        age: 38,
        heightCm: 180,
        sex: "male",
        bodyType: "athletic-typo",
      })
      .expect(400); // invalid bodyType enum

    expect(res.body).toBeDefined();

    const ok = await request(app.getHttpServer())
      .put("/api/profile")
      .set("Cookie", cookie)
      .send({
        age: 38,
        heightCm: 180,
        sex: "male",
        bodyType: "muscular",
        goals: ["build_muscle", "lose_fat"],
        foodPreferences: "No pork, lactose-light",
        targetWeightKg: 78,
        currentWeightKg: 82.4,
      })
      .expect(200);

    expect(ok.body.age).toBe(38);
    expect(ok.body.bodyType).toBe("muscular");
    expect(ok.body.goals).toEqual(["build_muscle", "lose_fat"]);
    expect(ok.body.targetWeightKg).toBe(78);
    expect(ok.body.currentWeightKg).toBe(82.4);
  });

  it("persists the profile across requests", async () => {
    const res = await request(app.getHttpServer())
      .get("/api/profile")
      .set("Cookie", cookie)
      .expect(200);
    expect(res.body.age).toBe(38);
    expect(res.body.foodPreferences).toBe("No pork, lactose-light");
    expect(res.body.currentWeightKg).toBe(82.4);
  });

  it("rejects an out-of-range age", async () => {
    await request(app.getHttpServer())
      .put("/api/profile")
      .set("Cookie", cookie)
      .send({ age: 5 })
      .expect(400);
  });
});
