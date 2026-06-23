// Motra OAuth 2.1 + PKCE flow for TeamZone.
// Dynamic client registration (lazy, cached to motra-client.json).
// One token file per user: users/<id>/motra.json (gitignored via users/*).

import { promises as fs } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import crypto from "node:crypto";

const MOTRA_BASE = "https://mcp.motra.com";
const AUTH_URL = `${MOTRA_BASE}/oauth/authorize`;
const TOKEN_URL = `${MOTRA_BASE}/oauth/token`;
const REGISTER_URL = `${MOTRA_BASE}/oauth/register`;

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");
const CLIENT_PATH = path.join(ROOT, "motra-client.json");

interface ClientReg {
  client_id: string;
  redirect_uri: string;
}

interface TokenSet {
  access_token: string;
  refresh_token?: string;
  expires_at: number; // unix ms
}

let _client: ClientReg | null = null;

async function loadClient(): Promise<ClientReg | null> {
  if (_client) return _client;
  try {
    _client = JSON.parse(await fs.readFile(CLIENT_PATH, "utf8")) as ClientReg;
    return _client;
  } catch {
    return null;
  }
}

async function registerClient(redirectUri: string): Promise<ClientReg> {
  const res = await fetch(REGISTER_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      client_name: "Team Zone Assistant",
      redirect_uris: [redirectUri],
      grant_types: ["authorization_code", "refresh_token"],
      response_types: ["code"],
      token_endpoint_auth_method: "none",
      scope: "mcp:tools",
    }),
  });
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`Motra registration failed: ${res.status} ${text}`);
  }
  const data = (await res.json()) as { client_id: string };
  const reg: ClientReg = { client_id: data.client_id, redirect_uri: redirectUri };
  await fs.writeFile(CLIENT_PATH, JSON.stringify(reg, null, 2));
  _client = reg;
  return reg;
}

async function getClient(redirectUri: string): Promise<ClientReg> {
  const existing = await loadClient();
  if (existing && existing.redirect_uri === redirectUri) return existing;
  return registerClient(redirectUri);
}

function genVerifier(): string {
  return crypto.randomBytes(32).toString("base64url");
}
function deriveChallenge(v: string): string {
  return crypto.createHash("sha256").update(v).digest("base64url");
}

export interface PkceState {
  state: string;
  verifier: string;
}

export async function buildConnectUrl(
  redirectUri: string
): Promise<{ url: string; pkce: PkceState }> {
  const client = await getClient(redirectUri);
  const verifier = genVerifier();
  const state = crypto.randomBytes(16).toString("base64url");
  const params = new URLSearchParams({
    response_type: "code",
    client_id: client.client_id,
    redirect_uri: redirectUri,
    code_challenge: deriveChallenge(verifier),
    code_challenge_method: "S256",
    state,
    scope: "mcp:tools",
    resource: `${MOTRA_BASE}/mcp`,
  });
  return { url: `${AUTH_URL}?${params}`, pkce: { state, verifier } };
}

function motraPath(userId: string): string {
  return path.join(ROOT, "users", userId, "motra.json");
}

export async function exchangeCode(
  userId: string,
  code: string,
  verifier: string,
  redirectUri: string
): Promise<void> {
  const client = await getClient(redirectUri);
  const res = await fetch(TOKEN_URL, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type: "authorization_code",
      client_id: client.client_id,
      code,
      code_verifier: verifier,
      redirect_uri: redirectUri,
    }),
  });
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`Motra token exchange failed: ${res.status} ${text}`);
  }
  const data = (await res.json()) as {
    access_token: string;
    refresh_token?: string;
    expires_in?: number;
  };
  const tokens: TokenSet = {
    access_token: data.access_token,
    refresh_token: data.refresh_token,
    expires_at: Date.now() + (data.expires_in ?? 3600) * 1000,
  };
  await fs.writeFile(motraPath(userId), JSON.stringify(tokens, null, 2));
}

export async function ensureToken(userId: string): Promise<string | null> {
  let tokens: TokenSet;
  try {
    tokens = JSON.parse(await fs.readFile(motraPath(userId), "utf8")) as TokenSet;
  } catch {
    return null;
  }

  // Still valid with 5-min buffer
  if (tokens.expires_at - Date.now() > 5 * 60 * 1000) return tokens.access_token;

  // Try refresh
  const { refresh_token } = tokens;
  if (!refresh_token) { await disconnect(userId); return null; }
  const client = await loadClient();
  if (!client) { await disconnect(userId); return null; }

  const res = await fetch(TOKEN_URL, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type: "refresh_token",
      client_id: client.client_id,
      refresh_token,
    }),
  });
  if (!res.ok) { await disconnect(userId); return null; }
  const data = (await res.json()) as {
    access_token: string;
    refresh_token?: string;
    expires_in?: number;
  };
  tokens = {
    access_token: data.access_token,
    refresh_token: data.refresh_token ?? refresh_token,
    expires_at: Date.now() + (data.expires_in ?? 3600) * 1000,
  };
  await fs.writeFile(motraPath(userId), JSON.stringify(tokens, null, 2));
  return tokens.access_token;
}

export async function disconnect(userId: string): Promise<void> {
  await fs.unlink(motraPath(userId)).catch(() => {});
}

export async function isConnected(userId: string): Promise<boolean> {
  try {
    await fs.access(motraPath(userId));
    return true;
  } catch {
    return false;
  }
}
