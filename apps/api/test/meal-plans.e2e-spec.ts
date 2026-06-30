import { type INestApplication, ValidationPipe } from "@nestjs/common";
import { Test } from "@nestjs/testing";
import cookieParser from "cookie-parser";
import request from "supertest";
import { AppModule } from "../src/app.module";
import { PrismaService } from "../src/prisma/prisma.service";

describe("Meal plans (e2e)", () => {
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
    await prisma.profile.deleteMany();
    await prisma.session.deleteMany();
    await prisma.user.deleteMany();

    const res = await request(app.getHttpServer())
      .post("/api/auth/signup")
      .send({ email: "meals@example.com", password: "supersecret1" })
      .expect(201);
    cookie = (res.headers["set-cookie"] as unknown as string[])[0];
  });

  afterAll(async () => {
    await app.close();
  });

  it("requires a session", async () => {
    await request(app.getHttpServer()).get("/api/meal-plans/baseline").expect(401);
  });

  it("returns the male baseline by default (no sex set)", async () => {
    const res = await request(app.getHttpServer())
      .get("/api/meal-plans/baseline")
      .set("Cookie", cookie)
      .expect(200);
    expect(res.body.sex).toBe("male");
    expect(res.body.dailyTargets.kcal).toBe(2400);
    expect(res.body.meals).toHaveLength(4);
    expect(res.body.meals[0].items[0].nameHe).toBeDefined();
  });

  it("returns the female baseline after the profile sets sex=female", async () => {
    await request(app.getHttpServer())
      .put("/api/profile")
      .set("Cookie", cookie)
      .send({ sex: "female" })
      .expect(200);

    const res = await request(app.getHttpServer())
      .get("/api/meal-plans/baseline")
      .set("Cookie", cookie)
      .expect(200);
    expect(res.body.sex).toBe("female");
    expect(res.body.dailyTargets.kcal).toBe(1900);
  });
});
