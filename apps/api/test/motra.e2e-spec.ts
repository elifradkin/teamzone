import { type INestApplication, ValidationPipe } from "@nestjs/common";
import { Test } from "@nestjs/testing";
import cookieParser from "cookie-parser";
import request from "supertest";
import { AppModule } from "../src/app.module";
import { MotraService } from "../src/motra/motra.service";
import { normalizeMotraWorkouts } from "../src/motra/normalizer";
import { PrismaService } from "../src/prisma/prisma.service";

interface WorkoutRow {
  source: string;
  efforts: unknown[];
}

describe("Motra (e2e)", () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let motra: MotraService;
  let cookie: string;
  let userId: string;

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({ imports: [AppModule] }).compile();
    app = moduleRef.createNestApplication();
    app.use(cookieParser());
    app.setGlobalPrefix("api");
    app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));
    await app.init();

    prisma = app.get(PrismaService);
    motra = app.get(MotraService);
    await prisma.muscleEffort.deleteMany();
    await prisma.workoutSession.deleteMany();
    await prisma.motraConnection.deleteMany();
    await prisma.session.deleteMany();
    await prisma.user.deleteMany();

    const res = await request(app.getHttpServer())
      .post("/api/auth/signup")
      .send({ email: "motra@example.com", password: "supersecret1" })
      .expect(201);
    userId = res.body.id;
    cookie = (res.headers["set-cookie"] as unknown as string[])[0];
  });

  afterAll(async () => {
    await app.close();
  });

  it("requires a session for status", async () => {
    await request(app.getHttpServer()).get("/api/motra/status").expect(401);
  });

  it("reports not connected initially", async () => {
    const res = await request(app.getHttpServer())
      .get("/api/motra/status")
      .set("Cookie", cookie)
      .expect(200);
    expect(res.body.connected).toBe(false);
  });

  it("imports normalized Motra workouts into the spine as source=motra", async () => {
    const sessions = normalizeMotraWorkouts([
      {
        date: "2026-06-29T10:00:00.000Z",
        exercises: [
          { muscles: ["chest", "triceps"], sets: [{ weight: 80, reps: 8, rpe: 8 }] },
        ],
      },
    ]);
    await motra.importWorkouts(userId, sessions);

    const res = await request(app.getHttpServer())
      .get("/api/workouts")
      .set("Cookie", cookie)
      .expect(200);
    const motraSession = (res.body as WorkoutRow[]).find((w) => w.source === "motra");
    expect(motraSession).toBeDefined();
    expect(motraSession?.efforts).toHaveLength(2); // chest + triceps
  });

  it("disconnects", async () => {
    await request(app.getHttpServer())
      .post("/api/motra/disconnect")
      .set("Cookie", cookie)
      .expect(201);
  });
});
