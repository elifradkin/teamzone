import { type INestApplication, ValidationPipe } from "@nestjs/common";
import { Test } from "@nestjs/testing";
import cookieParser from "cookie-parser";
import request from "supertest";
import { AppModule } from "../src/app.module";
import { PrismaService } from "../src/prisma/prisma.service";

const PNG = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]); // PNG header bytes

describe("Avatar photo (e2e)", () => {
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
    await prisma.avatarPhoto.deleteMany();
    await prisma.consent.deleteMany();
    await prisma.session.deleteMany();
    await prisma.user.deleteMany();

    const res = await request(app.getHttpServer())
      .post("/api/auth/signup")
      .send({ email: "avatar@example.com", password: "supersecret1" })
      .expect(201);
    cookie = (res.headers["set-cookie"] as unknown as string[])[0];
  });

  afterAll(async () => {
    await app.close();
  });

  it("rejects upload without avatar_photo consent", async () => {
    await request(app.getHttpServer())
      .post("/api/avatar/photo")
      .set("Cookie", cookie)
      .attach("file", PNG, { filename: "me.png", contentType: "image/png" })
      .expect(403);
  });

  it("uploads after consent is granted", async () => {
    await request(app.getHttpServer())
      .post("/api/consents")
      .set("Cookie", cookie)
      .send({ type: "avatar_photo" })
      .expect(201);

    await request(app.getHttpServer())
      .post("/api/avatar/photo")
      .set("Cookie", cookie)
      .attach("file", PNG, { filename: "me.png", contentType: "image/png" })
      .expect(201);
  });

  it("returns the stored photo", async () => {
    const res = await request(app.getHttpServer())
      .get("/api/avatar/photo")
      .set("Cookie", cookie)
      .expect(200);
    expect(res.headers["content-type"]).toContain("image/png");
  });

  it("rejects a non-image upload", async () => {
    await request(app.getHttpServer())
      .post("/api/avatar/photo")
      .set("Cookie", cookie)
      .attach("file", Buffer.from("hello"), { filename: "x.txt", contentType: "text/plain" })
      .expect(400);
  });

  it("deletes the photo (right to deletion)", async () => {
    await request(app.getHttpServer())
      .delete("/api/avatar/photo")
      .set("Cookie", cookie)
      .expect(200);
    await request(app.getHttpServer()).get("/api/avatar/photo").set("Cookie", cookie).expect(404);
  });
});
