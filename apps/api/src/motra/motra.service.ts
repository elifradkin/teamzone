import { Injectable, ServiceUnavailableException } from "@nestjs/common";
import { UnauthorizedError } from "@modelcontextprotocol/sdk/client/auth.js";
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StreamableHTTPClientTransport } from "@modelcontextprotocol/sdk/client/streamableHttp.js";
import { WorkoutSource } from "@prisma/client";
import { PrismaService } from "../prisma/prisma.service";
import { MotraOAuthProvider } from "./motra-oauth.provider";
import { type MotraWorkout, type NormalizedSession, normalizeMotraWorkouts } from "./normalizer";

@Injectable()
export class MotraService {
  constructor(private readonly prisma: PrismaService) {}

  private mcpUrl(): URL {
    return new URL(process.env.MOTRA_MCP_URL ?? "https://mcp.motra.com/mcp");
  }

  private baseUrl(): string {
    return process.env.APP_BASE_URL ?? "";
  }

  private ensureEnabled(): void {
    if (process.env.MOTRA_INGESTION_ENABLED !== "true") {
      // Off until Motra grants permission (R-1). Keeps the feature dormant in prod.
      throw new ServiceUnavailableException("Motra ingestion is not enabled");
    }
  }

  async status(userId: string) {
    const conn = await this.prisma.motraConnection.findUnique({ where: { userId } });
    return {
      enabled: process.env.MOTRA_INGESTION_ENABLED === "true",
      connected: conn?.status === "connected",
      status: conn?.status ?? null,
      lastSyncedAt: conn?.lastSyncedAt ?? null,
    };
  }

  async disconnect(userId: string) {
    await this.prisma.motraConnection.deleteMany({ where: { userId } });
    return { ok: true };
  }

  /** Start the per-user OAuth flow; returns the URL to send the user to. */
  async beginConnect(userId: string): Promise<{ authorizationUrl: string | null }> {
    this.ensureEnabled();
    const provider = new MotraOAuthProvider(this.prisma, userId, this.baseUrl());
    const transport = new StreamableHTTPClientTransport(this.mcpUrl(), { authProvider: provider });
    const client = new Client({ name: "teamzone", version: "0.0.0" });
    try {
      await client.connect(transport);
      await client.close();
      return { authorizationUrl: null }; // already authorized
    } catch (err) {
      if (err instanceof UnauthorizedError && provider.pendingAuthUrl) {
        return { authorizationUrl: provider.pendingAuthUrl.toString() };
      }
      throw err;
    }
  }

  /** Complete the OAuth flow with the authorization code from the callback. */
  async handleCallback(userId: string, code: string): Promise<void> {
    this.ensureEnabled();
    const provider = new MotraOAuthProvider(this.prisma, userId, this.baseUrl());
    const transport = new StreamableHTTPClientTransport(this.mcpUrl(), { authProvider: provider });
    await transport.finishAuth(code);
    await transport.close();
    await this.prisma.motraConnection.update({
      where: { userId },
      data: { status: "connected" },
    });
  }

  /** Pull the user's workouts from Motra and import them into the spine. */
  async syncNow(userId: string): Promise<{ imported: number }> {
    this.ensureEnabled();
    const provider = new MotraOAuthProvider(this.prisma, userId, this.baseUrl());
    const transport = new StreamableHTTPClientTransport(this.mcpUrl(), { authProvider: provider });
    const client = new Client({ name: "teamzone", version: "0.0.0" });
    await client.connect(transport);
    try {
      const tools = await client.listTools();
      const tool = tools.tools.find((t) => /workout/i.test(t.name));
      if (!tool) throw new ServiceUnavailableException("Motra workout tool not found");
      const result = await client.callTool({ name: tool.name, arguments: {} });
      const workouts = parseMotraWorkouts(result);
      const sessions: NormalizedSession[] = normalizeMotraWorkouts(workouts);
      return this.importWorkouts(userId, sessions);
    } finally {
      await client.close();
    }
  }

  async importWorkouts(userId: string, sessions: NormalizedSession[]) {
    for (const session of sessions) {
      await this.prisma.workoutSession.create({
        data: {
          userId,
          source: WorkoutSource.motra,
          occurredAt: session.occurredAt,
          efforts: {
            create: session.efforts.map((e) => ({
              muscleGroup: e.muscleGroup,
              sets: e.sets,
              volume: e.volume,
              rpe: e.rpe,
            })),
          },
        },
      });
    }
    await this.prisma.motraConnection.updateMany({
      where: { userId },
      data: { lastSyncedAt: new Date() },
    });
    return { imported: sessions.length };
  }
}

/**
 * Best-effort parse of a Motra MCP tool result into our assumed workout shape.
 * The exact payload is UNVERIFIED — returns [] on any mismatch so a wrong
 * assumption yields "0 imported" rather than a crash. Tune against real output.
 */
function parseMotraWorkouts(result: { content?: unknown; structuredContent?: unknown }): MotraWorkout[] {
  let candidate: unknown = result.structuredContent;
  if (candidate == null) candidate = extractTextJson(result.content);
  if (candidate == null) return [];

  const arr = Array.isArray(candidate)
    ? candidate
    : (candidate as { workouts?: unknown }).workouts;
  if (!Array.isArray(arr)) return [];

  const out: MotraWorkout[] = [];
  for (const raw of arr) {
    const w = raw as { date?: unknown; exercises?: unknown };
    if (typeof w.date !== "string" || !Array.isArray(w.exercises)) continue;
    const exercises = w.exercises
      .map((ex) => {
        const e = ex as { muscles?: unknown; sets?: unknown };
        const muscles = Array.isArray(e.muscles) ? e.muscles.filter((m): m is string => typeof m === "string") : [];
        const sets = Array.isArray(e.sets)
          ? e.sets
              .map((s) => s as { weight?: unknown; reps?: unknown; rpe?: unknown })
              .filter((s) => typeof s.weight === "number" && typeof s.reps === "number")
              .map((s) => ({
                weight: s.weight as number,
                reps: s.reps as number,
                rpe: typeof s.rpe === "number" ? (s.rpe as number) : null,
              }))
          : [];
        return { muscles, sets };
      })
      .filter((ex) => ex.muscles.length > 0 && ex.sets.length > 0);
    out.push({ date: w.date, exercises });
  }
  return out;
}

function extractTextJson(content: unknown): unknown {
  if (!Array.isArray(content)) return null;
  for (const part of content) {
    const p = part as { type?: unknown; text?: unknown };
    if (p.type === "text" && typeof p.text === "string") {
      try {
        return JSON.parse(p.text);
      } catch {
        // not JSON; ignore
      }
    }
  }
  return null;
}
