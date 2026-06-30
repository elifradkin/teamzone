import { randomBytes } from "node:crypto";
import type { OAuthClientProvider } from "@modelcontextprotocol/sdk/client/auth.js";
import type {
  OAuthClientInformationMixed,
  OAuthClientMetadata,
  OAuthTokens,
} from "@modelcontextprotocol/sdk/shared/auth.js";
import type { PrismaService } from "../prisma/prisma.service";
import { decrypt, encrypt } from "./crypto";

interface MotraAuthState {
  clientInformation?: OAuthClientInformationMixed;
  codeVerifier?: string;
  state?: string;
  tokens?: OAuthTokens;
}

/**
 * OAuthClientProvider for the Motra MCP, backed by the encrypted
 * MotraConnection row so the PKCE/code-verifier + tokens persist across the
 * connect → authorize → callback requests. Tokens never stored in plaintext.
 * (Live behavior verified manually against a real Motra account — R-1.)
 */
export class MotraOAuthProvider implements OAuthClientProvider {
  pendingAuthUrl?: URL;

  constructor(
    private readonly prisma: PrismaService,
    private readonly userId: string,
    private readonly baseUrl: string,
  ) {}

  private async loadState(): Promise<MotraAuthState> {
    const row = await this.prisma.motraConnection.findUnique({ where: { userId: this.userId } });
    if (!row?.encryptedTokens) return {};
    try {
      return JSON.parse(decrypt(row.encryptedTokens)) as MotraAuthState;
    } catch {
      return {};
    }
  }

  private async saveState(state: MotraAuthState): Promise<void> {
    const blob = encrypt(JSON.stringify(state));
    await this.prisma.motraConnection.upsert({
      where: { userId: this.userId },
      create: { userId: this.userId, encryptedTokens: blob, status: "pending" },
      update: { encryptedTokens: blob },
    });
  }

  get redirectUrl(): string {
    return `${this.baseUrl}/api/motra/callback`;
  }

  get clientMetadata(): OAuthClientMetadata {
    return {
      redirect_uris: [this.redirectUrl],
      client_name: "TeamZone",
      grant_types: ["authorization_code", "refresh_token"],
      response_types: ["code"],
      token_endpoint_auth_method: "none",
    };
  }

  async state(): Promise<string> {
    const value = randomBytes(16).toString("hex");
    const st = await this.loadState();
    st.state = value;
    await this.saveState(st);
    return value;
  }

  async clientInformation(): Promise<OAuthClientInformationMixed | undefined> {
    return (await this.loadState()).clientInformation;
  }

  async saveClientInformation(info: OAuthClientInformationMixed): Promise<void> {
    const st = await this.loadState();
    st.clientInformation = info;
    await this.saveState(st);
  }

  async tokens(): Promise<OAuthTokens | undefined> {
    return (await this.loadState()).tokens;
  }

  async saveTokens(tokens: OAuthTokens): Promise<void> {
    const st = await this.loadState();
    st.tokens = tokens;
    await this.saveState(st);
  }

  redirectToAuthorization(authorizationUrl: URL): void {
    this.pendingAuthUrl = authorizationUrl;
  }

  async saveCodeVerifier(verifier: string): Promise<void> {
    const st = await this.loadState();
    st.codeVerifier = verifier;
    await this.saveState(st);
  }

  async codeVerifier(): Promise<string> {
    const verifier = (await this.loadState()).codeVerifier;
    if (!verifier) throw new Error("Missing PKCE code verifier");
    return verifier;
  }
}
