// HTTP server: simple PIN auth, per-session conversation history, chat endpoint,
// and static web UI. Designed for ~20 known users on a single VPS.

import "dotenv/config";
import express from "express";
import cookieSession from "cookie-session";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { promises as fs } from "node:fs";
import { runTurn, ChatMessage } from "./agent.js";
import { ensureUser, loadProfile, loadTargets, saveProfile } from "./memory.js";
import * as motra from "./motra-oauth.js";
import { motraCall } from "./motra-client.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();
const PORT = Number(process.env.PORT || 3000);

// ---- Simple auth: AUTH_USERS="id:pin,id2:pin2" ----
const CREDENTIALS = new Map<string, string>(
  (process.env.AUTH_USERS || "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean)
    .map((pair) => {
      const idx = pair.indexOf(":");
      return [pair.slice(0, idx), pair.slice(idx + 1)] as [string, string];
    })
);

// In-memory conversation history per userId (last N messages). Survives within a
// process; long-term continuity lives in each user's summary.md.
const HISTORY = new Map<string, ChatMessage[]>();
const MAX_HISTORY = 12; // ~6 turns; older context is captured in summary.md

app.use(express.json({ limit: "1mb" }));
app.use(
  cookieSession({
    name: "tz",
    secret: process.env.SESSION_SECRET || "dev-insecure-secret",
    maxAge: 30 * 24 * 60 * 60 * 1000,
    httpOnly: true,
    sameSite: "lax",
  })
);

function requireAuth(req: any, res: any, next: any) {
  if (req.session?.userId) return next();
  res.status(401).json({ error: "not_authenticated" });
}

app.post("/api/login", async (req, res) => {
  const { userId, pin } = req.body ?? {};
  if (!userId || CREDENTIALS.get(userId) !== String(pin)) {
    return res.status(401).json({ error: "bad_credentials" });
  }
  await ensureUser(userId);
  req.session!.userId = userId;
  res.json({ ok: true, userId });
});

app.post("/api/logout", (req, res) => {
  req.session = null;
  res.json({ ok: true });
});

app.get("/api/me", (req: any, res) => {
  res.json({ userId: req.session?.userId ?? null });
});

app.post("/api/chat", requireAuth, async (req: any, res) => {
  const userId: string = req.session.userId;
  const text: string = (req.body?.message ?? "").toString().slice(0, 4000);
  if (!text.trim()) return res.status(400).json({ error: "empty_message" });

  const nowISO = new Date().toISOString();
  const prior = HISTORY.get(userId) ?? [];
  try {
    const { reply, history } = await runTurn(userId, prior, text, nowISO);
    HISTORY.set(userId, history.slice(-MAX_HISTORY));
    res.json({ reply });
  } catch (e: any) {
    console.error("chat error", e);
    res.status(500).json({ error: "assistant_error", detail: e?.message });
  }
});

app.post("/api/reset", requireAuth, (req: any, res) => {
  HISTORY.delete(req.session.userId);
  res.json({ ok: true });
});

// ---- Motra OAuth routes ----

function redirectUri(req: any): string {
  const proto = (req.headers["x-forwarded-proto"] as string) ?? req.protocol;
  const host = (req.headers["x-forwarded-host"] as string) ?? req.get("host");
  return `${proto}://${host}/api/motra/callback`;
}

app.get("/api/motra/connect", requireAuth, async (req: any, res) => {
  try {
    const { url, pkce } = await motra.buildConnectUrl(redirectUri(req));
    req.session!.motraState = pkce.state;
    req.session!.motraVerifier = pkce.verifier;
    res.redirect(url);
  } catch (e: any) {
    console.error("Motra connect error", e);
    res.status(500).json({ error: "motra_connect_error", detail: e?.message });
  }
});

app.get("/api/motra/callback", requireAuth, async (req: any, res) => {
  const { code, state } = req.query as Record<string, string>;
  if (!code || state !== req.session?.motraState) {
    return res.status(400).send("Invalid OAuth state. Please try connecting again.");
  }
  const verifier = req.session!.motraVerifier as string;
  req.session!.motraState = undefined;
  req.session!.motraVerifier = undefined;
  try {
    await motra.exchangeCode(req.session.userId, code, verifier, redirectUri(req));
    res.redirect("/?motra=connected");
  } catch (e: any) {
    console.error("Motra callback error", e);
    res.redirect("/?motra=error");
  }
});

app.post("/api/motra/disconnect", requireAuth, async (req: any, res) => {
  await motra.disconnect(req.session.userId);
  res.json({ ok: true });
});

app.get("/api/motra/status", requireAuth, async (req: any, res) => {
  const connected = await motra.isConnected(req.session.userId);
  res.json({ connected });
});

// ---- Data API routes (dashboard, workouts, nutrition, profile) ----

// Aggregated dashboard snapshot — fetches up to 4 Motra sources in parallel
app.get("/api/dashboard", requireAuth, async (req: any, res) => {
  const userId: string = req.session.userId;
  const connected = await motra.isConnected(userId);
  const today = new Date().toISOString().slice(0, 10);

  const [profile, targets] = await Promise.all([
    loadProfile(userId),
    loadTargets(userId),
  ]);

  let readiness: any = null;
  let health: any = null;
  let lastWorkout: any = null;
  let latestAchievement: any = null;

  if (connected) {
    [readiness, health, lastWorkout, latestAchievement] = await Promise.all([
      motraCall(userId, "motra_health_readiness", { date: today }).catch(() => null),
      motraCall(userId, "motra_health_snapshot", {
        date: today,
        types: ["stepCount", "sleepAnalysis", "restingHeartRate"],
      }).catch(() => null),
      motraCall(userId, "motra_query_workouts", { limit: 1, orderBy: "timeStarted", orderDirection: "desc" }).catch(() => null),
      motraCall(userId, "motra_achievements", { limit: 1 }).catch(() => null),
    ]);
  }

  // Parse today's log for macro progress
  const logPath = path.join(__dirname, "..", "users", userId, "log", `${today}.md`);
  const logText = await fs.readFile(logPath, "utf8").catch(() => "");
  const logLines = logText.split("\n").filter((l) => l.trim().startsWith("-")).map((l) => l.replace(/^-\s*/, ""));

  res.json({
    motraConnected: connected,
    readiness,
    health,
    lastWorkout: Array.isArray((lastWorkout as any)?.workouts) ? (lastWorkout as any).workouts[0] ?? null : null,
    latestAchievement: Array.isArray((latestAchievement as any)?.achievements) ? (latestAchievement as any).achievements[0] ?? null : null,
    profile: profile ? { name: profile.name, sex: profile.sex, language: profile.language } : null,
    targets: targets ?? null,
    todayLog: logLines,
  });
});

app.get("/api/workouts", requireAuth, async (req: any, res) => {
  const userId: string = req.session.userId;
  const limit = Math.min(Number(req.query.limit ?? 20), 50);
  const data = await motraCall(userId, "motra_query_workouts", {
    limit,
    orderBy: "timeStarted",
    orderDirection: "desc",
  }).catch(() => null);
  res.json(data ?? { workouts: [] });
});

app.get("/api/workouts/:id", requireAuth, async (req: any, res) => {
  const userId: string = req.session.userId;
  const data = await motraCall(userId, "motra_get_workout_details", {
    workoutId: req.params.id,
  }).catch(() => null);
  if (!data) return res.status(404).json({ error: "not_found" });
  res.json(data);
});

app.get("/api/calendar", requireAuth, async (req: any, res) => {
  const userId: string = req.session.userId;
  const { from, to } = req.query as Record<string, string>;
  if (!from || !to) return res.status(400).json({ error: "from and to required" });
  const data = await motraCall(userId, "motra_get_calendar", { from, to }).catch(() => null);
  res.json(data ?? { activities: {} });
});

app.get("/api/achievements", requireAuth, async (req: any, res) => {
  const userId: string = req.session.userId;
  const limit = Math.min(Number(req.query.limit ?? 20), 50);
  const data = await motraCall(userId, "motra_achievements", { limit }).catch(() => null);
  res.json(data ?? { achievements: [] });
});

app.get("/api/stats", requireAuth, async (req: any, res) => {
  const userId: string = req.session.userId;
  // Fetch total workouts this month + top 5 exercises by volume + total volume
  const now = new Date();
  const monthStart = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-01`;
  const [totalWorkouts, topExercises, totalVolume] = await Promise.all([
    motraCall(userId, "motra_stats", { aggregationType: "count", metric: "workouts", scope: "all", startDate: monthStart }).catch(() => null),
    motraCall(userId, "motra_stats", { aggregationType: "top", metric: "tvl", scope: "exercise", limit: 5 }).catch(() => null),
    motraCall(userId, "motra_stats", { aggregationType: "sum", metric: "tvl", scope: "all", startDate: monthStart }).catch(() => null),
  ]);
  res.json({ totalWorkouts, topExercises, totalVolume });
});

app.get("/api/health/trend", requireAuth, async (req: any, res) => {
  const userId: string = req.session.userId;
  const { type, subType, aggregation, period, from, to } = req.query as Record<string, string>;
  if (!type || !subType || !aggregation || !period || !from || !to) {
    return res.status(400).json({ error: "type, subType, aggregation, period, from, to required" });
  }
  const data = await motraCall(userId, "motra_health_trend", {
    dataType: type,
    subType,
    aggregationKey: aggregation,
    period,
    startDate: from,
    endDate: to,
  }).catch(() => null);
  res.json(data ?? { data: [] });
});

app.get("/api/profile", requireAuth, async (req: any, res) => {
  const userId: string = req.session.userId;
  const [profile, targets] = await Promise.all([loadProfile(userId), loadTargets(userId)]);
  res.json({ profile, targets });
});

app.patch("/api/profile", requireAuth, async (req: any, res) => {
  const userId: string = req.session.userId;
  const existing = await loadProfile(userId);
  if (!existing) return res.status(400).json({ error: "no_profile" });
  const allowed = ["name", "sex", "age", "height_cm", "weight_kg", "bodyfat_pct", "activity", "goal", "goal_rate", "language", "dislikes", "notes"];
  const patch: any = {};
  for (const k of allowed) {
    if (req.body[k] !== undefined) patch[k] = req.body[k];
  }
  const merged = { ...existing, ...patch, userId };
  if (merged.weight_kg <= 0) return res.status(400).json({ error: "invalid_weight" });
  const targets = await saveProfile(userId, merged);
  res.json({ profile: merged, targets });
});

app.get("/api/nutrition/log", requireAuth, async (req: any, res) => {
  const userId: string = req.session.userId;
  const date = (req.query.date as string) || new Date().toISOString().slice(0, 10);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) return res.status(400).json({ error: "bad date" });
  const logPath = path.join(__dirname, "..", "users", userId, "log", `${date}.md`);
  const text = await fs.readFile(logPath, "utf8").catch(() => "");
  const entries = text.split("\n").filter((l) => l.trim().startsWith("-")).map((l) => l.replace(/^-\s*/, ""));
  res.json({ date, entries });
});

// Static web UI
app.use(express.static(path.join(__dirname, "web")));

app.listen(PORT, () => {
  console.log(`TeamZone assistant on http://localhost:${PORT}`);
  if (CREDENTIALS.size === 0) console.warn("⚠ No AUTH_USERS configured — set it in .env");
});
