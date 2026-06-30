import { type INestApplication, ValidationPipe } from "@nestjs/common";
import { Test } from "@nestjs/testing";
import cookieParser from "cookie-parser";
import request from "supertest";
import { AppModule } from "../src/app.module";
import { PrismaService } from "../src/prisma/prisma.service";

interface Score {
  muscleGroup: string;
  recoveryPct: number;
  effortSets: number;
  lastTrainedHoursAgo: number | null;
}

describe("Scores (e2e)", () => {
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
      .send({ email: "scores@example.com", password: "supersecret1" })
      .expect(201);
    cookie = (res.headers["set-cookie"] as unknown as string[])[0];
  });

  afterAll(async () => {
    await app.close();
  });

  it("requires a session", async () => {
    await request(app.getHttpServer()).get("/api/scores").expect(401);
  });

  it("computes a freshly-trained muscle as fatigued (low recovery)", async () => {
    await request(app.getHttpServer())
      .post("/api/workouts")
      .set("Cookie", cookie)
      .send({ efforts: [{ muscleGroup: "chest", sets: 4, volume: 3200, rpe: 8 }] })
      .expect(201);

    const res = await request(app.getHttpServer())
      .get("/api/scores")
      .set("Cookie", cookie)
      .expect(200);

    const chest = (res.body as Score[]).find((s) => s.muscleGroup === "chest");
    expect(chest).toBeDefined();
    expect(chest?.effortSets).toBe(4);
    expect(chest?.recoveryPct).toBeLessThanOrEqual(10); // just trained
    expect(chest?.lastTrainedHoursAgo).toBe(0);
  });
});
