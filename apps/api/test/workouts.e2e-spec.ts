import { type INestApplication, ValidationPipe } from "@nestjs/common";
import { Test } from "@nestjs/testing";
import cookieParser from "cookie-parser";
import request from "supertest";
import { AppModule } from "../src/app.module";
import { PrismaService } from "../src/prisma/prisma.service";

describe("Workouts (e2e)", () => {
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
    await prisma.muscleEffort.deleteMany();
    await prisma.workoutSession.deleteMany();
    await prisma.session.deleteMany();
    await prisma.user.deleteMany();

    const res = await request(app.getHttpServer())
      .post("/api/auth/signup")
      .send({ email: "lifter@example.com", password: "supersecret1" })
      .expect(201);
    cookie = (res.headers["set-cookie"] as unknown as string[])[0];
  });

  afterAll(async () => {
    await app.close();
  });

  it("rejects creating a workout without a session", async () => {
    await request(app.getHttpServer())
      .post("/api/workouts")
      .send({ efforts: [{ muscleGroup: "chest", sets: 4, volume: 3200 }] })
      .expect(401);
  });

  it("creates a manual workout in the data spine", async () => {
    const res = await request(app.getHttpServer())
      .post("/api/workouts")
      .set("Cookie", cookie)
      .send({
        occurredAt: "2026-06-28T08:00:00.000Z",
        efforts: [
          { muscleGroup: "chest", sets: 4, volume: 3200, rpe: 8 },
          { muscleGroup: "triceps", sets: 3, volume: 1500 },
        ],
      })
      .expect(201);
    expect(res.body.source).toBe("manual");
    expect(res.body.efforts).toHaveLength(2);
    expect(res.body.id).toBeDefined();
  });

  it("lists the user's workouts", async () => {
    const res = await request(app.getHttpServer())
      .get("/api/workouts")
      .set("Cookie", cookie)
      .expect(200);
    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body).toHaveLength(1);
    expect(res.body[0].efforts).toHaveLength(2);
  });

  it("rejects an empty efforts array", async () => {
    await request(app.getHttpServer())
      .post("/api/workouts")
      .set("Cookie", cookie)
      .send({ efforts: [] })
      .expect(400);
  });

  it("rejects an invalid muscle group", async () => {
    await request(app.getHttpServer())
      .post("/api/workouts")
      .set("Cookie", cookie)
      .send({ efforts: [{ muscleGroup: "not_a_muscle", sets: 3, volume: 100 }] })
      .expect(400);
  });
});
