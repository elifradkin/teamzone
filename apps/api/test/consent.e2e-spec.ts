import { type INestApplication, ValidationPipe } from "@nestjs/common";
import { Test } from "@nestjs/testing";
import cookieParser from "cookie-parser";
import request from "supertest";
import { AppModule } from "../src/app.module";
import { PrismaService } from "../src/prisma/prisma.service";

interface ConsentRow {
  type: string;
  granted: boolean;
}

describe("Consent (e2e)", () => {
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
    await prisma.consent.deleteMany();
    await prisma.session.deleteMany();
    await prisma.user.deleteMany();

    const res = await request(app.getHttpServer())
      .post("/api/auth/signup")
      .send({ email: "consent@example.com", password: "supersecret1" })
      .expect(201);
    cookie = (res.headers["set-cookie"] as unknown as string[])[0];
  });

  afterAll(async () => {
    await app.close();
  });

  it("requires a session", async () => {
    await request(app.getHttpServer()).get("/api/consents").expect(401);
  });

  it("starts with no consents", async () => {
    const res = await request(app.getHttpServer())
      .get("/api/consents")
      .set("Cookie", cookie)
      .expect(200);
    expect(res.body).toEqual([]);
  });

  it("grants a consent", async () => {
    await request(app.getHttpServer())
      .post("/api/consents")
      .set("Cookie", cookie)
      .send({ type: "health_data" })
      .expect(201);

    const res = await request(app.getHttpServer())
      .get("/api/consents")
      .set("Cookie", cookie)
      .expect(200);
    const row = (res.body as ConsentRow[]).find((c) => c.type === "health_data");
    expect(row?.granted).toBe(true);
  });

  it("rejects an unknown consent type", async () => {
    await request(app.getHttpServer())
      .post("/api/consents")
      .set("Cookie", cookie)
      .send({ type: "not_a_consent" })
      .expect(400);
  });

  it("revokes a consent", async () => {
    await request(app.getHttpServer())
      .delete("/api/consents/health_data")
      .set("Cookie", cookie)
      .expect(200);

    const res = await request(app.getHttpServer())
      .get("/api/consents")
      .set("Cookie", cookie)
      .expect(200);
    const row = (res.body as ConsentRow[]).find((c) => c.type === "health_data");
    expect(row?.granted).toBe(false);
  });
});
