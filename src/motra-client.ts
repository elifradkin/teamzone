// Direct MCP JSON-RPC 2.0 client for Motra (streamable HTTP transport).
// Used by data API routes — fetches workout/health data without a Claude turn.
// Sessions are cached in-process (fine for ~20 users; lost on restart, re-initialised transparently).

import { ensureToken } from "./motra-oauth.js";

const MCP_URL = "https://mcp.motra.com/mcp";
const PROTOCOL = "2025-03-26";

// userId → Mcp-Session-Id (in-process, re-established on miss)
const _sessions = new Map<string, string>();
let _id = 1;

async function post(
  body: object,
  token: string,
  sessionId?: string
): Promise<any> {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    Accept: "application/json, text/event-stream",
    Authorization: `Bearer ${token}`,
  };
  if (sessionId) headers["Mcp-Session-Id"] = sessionId;

  const res = await fetch(MCP_URL, {
    method: "POST",
    headers,
    body: JSON.stringify(body),
  });

  // 202 = notification acknowledged (no body)
  if (res.status === 202) return null;

  if (!res.ok) {
    const txt = await res.text().catch(() => "");
    throw new Error(`Motra MCP ${res.status}: ${txt.slice(0, 200)}`);
  }

  const ct = res.headers.get("content-type") ?? "";
  const text = await res.text();
  if (!text.trim()) return null;

  if (ct.includes("text/event-stream")) {
    // SSE: find first data line that is a JSON-RPC response
    for (const line of text.split("\n")) {
      if (line.startsWith("data: ")) {
        const payload = line.slice(6).trim();
        if (payload && payload !== "[DONE]") {
          try { return JSON.parse(payload); } catch { /* skip */ }
        }
      }
    }
    return null;
  }

  return JSON.parse(text);
}

async function openSession(userId: string, token: string): Promise<string> {
  const res = await fetch(MCP_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json, text/event-stream",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({
      jsonrpc: "2.0",
      method: "initialize",
      params: {
        protocolVersion: PROTOCOL,
        capabilities: {},
        clientInfo: { name: "teamzone", version: "1.0" },
      },
      id: _id++,
    }),
  });

  const sessionId = res.headers.get("Mcp-Session-Id") ?? "";
  if (!res.ok) {
    const txt = await res.text().catch(() => "");
    throw new Error(`Motra init failed ${res.status}: ${txt.slice(0, 200)}`);
  }

  _sessions.set(userId, sessionId);

  // Send initialized notification (fire-and-forget; no response expected)
  post(
    { jsonrpc: "2.0", method: "notifications/initialized", params: {} },
    token,
    sessionId
  ).catch(() => {});

  return sessionId;
}

async function getSession(userId: string, token: string): Promise<string> {
  const cached = _sessions.get(userId);
  if (cached !== undefined) return cached;
  return openSession(userId, token);
}

function extractResult(rpc: any): unknown {
  if (!rpc) return null;
  if (rpc.error) throw new Error(`Motra tool error: ${JSON.stringify(rpc.error)}`);
  const content: any[] = rpc?.result?.content ?? [];
  const block = content.find((c: any) => c.type === "text");
  if (!block?.text) return null;
  try { return JSON.parse(block.text); } catch { return block.text; }
}

/**
 * Call a Motra MCP tool by name. Returns parsed result or null if the user has
 * no Motra token. Automatically initialises / refreshes the MCP session.
 *
 * @example
 * const data = await motraCall(userId, "motra_query_workouts", { limit: 10 });
 */
export async function motraCall(
  userId: string,
  toolName: string,
  params: Record<string, unknown> = {}
): Promise<unknown> {
  const token = await ensureToken(userId);
  if (!token) return null;

  const sessionId = await getSession(userId, token);

  const callBody = {
    jsonrpc: "2.0",
    method: "tools/call",
    params: { name: toolName, arguments: params },
    id: _id++,
  };

  let rpc: any;
  try {
    rpc = await post(callBody, token, sessionId);
  } catch (err: any) {
    // Session gone — clear and retry once with a fresh session
    if (err.message?.includes("404") || err.message?.includes("session")) {
      _sessions.delete(userId);
      const fresh = await openSession(userId, token);
      rpc = await post({ ...callBody, id: _id++ }, token, fresh);
    } else {
      throw err;
    }
  }

  // Handle JSON-RPC session errors in the response body
  if (rpc?.error?.code === -32001 || rpc?.error?.message?.toLowerCase().includes("session")) {
    _sessions.delete(userId);
    const fresh = await openSession(userId, token);
    rpc = await post({ ...callBody, id: _id++ }, token, fresh);
  }

  return extractResult(rpc);
}
