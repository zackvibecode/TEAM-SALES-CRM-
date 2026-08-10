import { createHmac, randomBytes, timingSafeEqual, createHash } from "crypto";
import { CRM_PUBLIC_BASE_URL, resolveCrmApiKey } from "@/lib/agent-api-key";

const CODE_TTL_SEC = 10 * 60;
const TOKEN_TTL_SEC = 30 * 24 * 60 * 60; // 30 days

export const MCP_SCOPES = ["mcp:read"] as const;

type CodePayload = {
  typ: "mcp_code";
  client_id: string;
  redirect_uri: string;
  code_challenge: string;
  code_challenge_method: "S256" | "plain";
  exp: number;
};

type AccessPayload = {
  typ: "mcp_access";
  client_id: string;
  scope: string;
  exp: number;
};

function b64url(buf: Buffer | string): string {
  const b = typeof buf === "string" ? Buffer.from(buf, "utf8") : buf;
  return b.toString("base64url");
}

function fromB64url(s: string): Buffer {
  return Buffer.from(s, "base64url");
}

async function signingSecret(): Promise<string> {
  const env = process.env.CRM_MCP_OAUTH_SECRET?.trim();
  if (env) return env;
  const key = await resolveCrmApiKey();
  if (key) return `mcp-oauth:${key}`;
  throw new Error("MCP OAuth secret unavailable — generate CRM API key first");
}

async function sign(payload: object): Promise<string> {
  const body = b64url(JSON.stringify(payload));
  const secret = await signingSecret();
  const sig = createHmac("sha256", secret).update(body).digest();
  return `${body}.${b64url(sig)}`;
}

async function verify<T extends { exp: number }>(token: string): Promise<T | null> {
  const parts = token.split(".");
  if (parts.length !== 2) return null;
  const [body, sig] = parts;
  if (!body || !sig) return null;
  try {
    const secret = await signingSecret();
    const expected = createHmac("sha256", secret).update(body).digest();
    const given = fromB64url(sig);
    if (expected.length !== given.length || !timingSafeEqual(expected, given)) {
      return null;
    }
    const payload = JSON.parse(fromB64url(body).toString("utf8")) as T;
    if (!payload.exp || Date.now() / 1000 > payload.exp) return null;
    return payload;
  } catch {
    return null;
  }
}

export function isAllowedRedirectUri(uri: string): boolean {
  try {
    const u = new URL(uri);
    if (u.protocol !== "https:" && u.hostname !== "localhost" && u.hostname !== "127.0.0.1") {
      return false;
    }
    const host = u.hostname.toLowerCase();
    return (
      host === "chatgpt.com" ||
      host === "chat.openai.com" ||
      host.endsWith(".chatgpt.com") ||
      host === "localhost" ||
      host === "127.0.0.1"
    );
  } catch {
    return false;
  }
}

export function pkceChallenge(verifier: string, method: "S256" | "plain"): string {
  if (method === "plain") return verifier;
  return createHash("sha256").update(verifier).digest("base64url");
}

export async function issueAuthCode(input: {
  client_id: string;
  redirect_uri: string;
  code_challenge: string;
  code_challenge_method: "S256" | "plain";
}): Promise<string> {
  const payload: CodePayload = {
    typ: "mcp_code",
    client_id: input.client_id,
    redirect_uri: input.redirect_uri,
    code_challenge: input.code_challenge,
    code_challenge_method: input.code_challenge_method,
    exp: Math.floor(Date.now() / 1000) + CODE_TTL_SEC,
  };
  return sign(payload);
}

export async function exchangeAuthCode(input: {
  code: string;
  client_id: string;
  redirect_uri: string;
  code_verifier: string;
}): Promise<{ access_token: string; expires_in: number; scope: string; token_type: "Bearer" } | null> {
  const payload = await verify<CodePayload>(input.code);
  if (!payload || payload.typ !== "mcp_code") return null;
  if (payload.client_id !== input.client_id) return null;
  if (payload.redirect_uri !== input.redirect_uri) return null;

  const challenge = pkceChallenge(input.code_verifier, payload.code_challenge_method);
  const a = Buffer.from(challenge);
  const b = Buffer.from(payload.code_challenge);
  if (a.length !== b.length || !timingSafeEqual(a, b)) return null;

  const access: AccessPayload = {
    typ: "mcp_access",
    client_id: input.client_id,
    scope: MCP_SCOPES.join(" "),
    exp: Math.floor(Date.now() / 1000) + TOKEN_TTL_SEC,
  };
  const access_token = await sign(access);
  return {
    access_token,
    expires_in: TOKEN_TTL_SEC,
    scope: access.scope,
    token_type: "Bearer",
  };
}

export async function verifyMcpAccessToken(token: string): Promise<{
  token: string;
  clientId: string;
  scopes: string[];
} | null> {
  const payload = await verify<AccessPayload>(token);
  if (!payload || payload.typ !== "mcp_access") return null;
  const scopes = payload.scope.split(/\s+/).filter(Boolean);
  if (!scopes.includes("mcp:read")) return null;
  return { token, clientId: payload.client_id, scopes };
}

export async function assertApiKeyMatches(provided: string): Promise<boolean> {
  const configured = await resolveCrmApiKey();
  if (!configured || !provided) return false;
  const a = Buffer.from(configured);
  const b = Buffer.from(provided.trim());
  if (a.length !== b.length) return false;
  return timingSafeEqual(a, b);
}

export function newClientId(): string {
  return `mcp_${randomBytes(16).toString("hex")}`;
}

export function oauthIssuer(): string {
  return CRM_PUBLIC_BASE_URL;
}

export function mcpResourceUrl(): string {
  return `${CRM_PUBLIC_BASE_URL}/api/mcp`;
}

export function authorizationServerMetadata() {
  const issuer = oauthIssuer();
  return {
    issuer,
    authorization_endpoint: `${issuer}/api/mcp/oauth/authorize`,
    token_endpoint: `${issuer}/api/mcp/oauth/token`,
    registration_endpoint: `${issuer}/api/mcp/oauth/register`,
    scopes_supported: [...MCP_SCOPES],
    response_types_supported: ["code"],
    grant_types_supported: ["authorization_code"],
    code_challenge_methods_supported: ["S256"],
    token_endpoint_auth_methods_supported: ["none"],
    client_id_metadata_document_supported: true,
  };
}
