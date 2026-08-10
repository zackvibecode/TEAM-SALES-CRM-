import { NextRequest, NextResponse } from "next/server";
import {
  assertApiKeyMatches,
  isAllowedRedirectUri,
  issueAuthCode,
} from "@/lib/mcp/oauth";

export const runtime = "nodejs";

function htmlPage(body: string, status = 200) {
  return new NextResponse(
    `<!DOCTYPE html>
<html lang="ms">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>Sambung SaleCRM MCP</title>
  <style>
    :root { color-scheme: light; }
    body { margin:0; font-family: ui-sans-serif, system-ui, sans-serif; background:#0f172a; color:#e2e8f0; min-height:100vh; display:flex; align-items:center; justify-content:center; padding:24px; }
    .card { width:100%; max-width:440px; background:#111827; border:1px solid #334155; border-radius:16px; padding:28px; box-shadow:0 20px 50px rgba(0,0,0,.35); }
    h1 { margin:0 0 8px; font-size:1.35rem; }
    p { margin:0 0 16px; color:#94a3b8; font-size:.95rem; line-height:1.5; }
    label { display:block; font-size:.8rem; font-weight:600; margin-bottom:6px; color:#cbd5e1; }
    input[type=password], input[type=text] { width:100%; box-sizing:border-box; border-radius:10px; border:1px solid #475569; background:#0b1220; color:#f8fafc; padding:12px 14px; font-size:14px; }
    button { margin-top:16px; width:100%; border:0; border-radius:10px; padding:12px 16px; font-weight:700; background:#2563eb; color:white; cursor:pointer; font-size:15px; }
    button:hover { background:#1d4ed8; }
    .err { background:rgba(239,68,68,.12); border:1px solid rgba(239,68,68,.35); color:#fecaca; padding:10px 12px; border-radius:10px; margin-bottom:14px; font-size:.9rem; }
    code { font-size:.8rem; background:#1e293b; padding:2px 6px; border-radius:6px; }
  </style>
</head>
<body>${body}</body>
</html>`,
    {
      status,
      headers: {
        "Content-Type": "text/html; charset=utf-8",
        "Cache-Control": "no-store",
      },
    }
  );
}

export async function GET(request: NextRequest) {
  const p = request.nextUrl.searchParams;
  const clientId = p.get("client_id")?.trim() || "";
  const redirectUri = p.get("redirect_uri")?.trim() || "";
  const state = p.get("state")?.trim() || "";
  const codeChallenge = p.get("code_challenge")?.trim() || "";
  const method = (p.get("code_challenge_method")?.trim() || "S256") as "S256" | "plain";
  const responseType = p.get("response_type")?.trim() || "";

  if (responseType && responseType !== "code") {
    return htmlPage(`<div class="card"><h1>Error</h1><p>response_type mesti <code>code</code>.</p></div>`, 400);
  }
  if (!clientId || !redirectUri || !codeChallenge) {
    return htmlPage(
      `<div class="card"><h1>Error</h1><p>Missing OAuth params (client_id, redirect_uri, code_challenge).</p></div>`,
      400
    );
  }
  if (!isAllowedRedirectUri(redirectUri)) {
    return htmlPage(
      `<div class="card"><h1>Error</h1><p>redirect_uri tidak dibenarkan.</p></div>`,
      400
    );
  }

  return htmlPage(`
  <div class="card">
    <h1>Sambung ChatGPT → SaleCRM</h1>
    <p>Paste API key admin (<code>zaqone_...</code>) dari CRM → <strong>AI API Key / ChatGPT</strong>. Jangan guna email/password.</p>
    <form method="POST" action="/api/mcp/oauth/authorize">
      <input type="hidden" name="client_id" value="${escapeAttr(clientId)}" />
      <input type="hidden" name="redirect_uri" value="${escapeAttr(redirectUri)}" />
      <input type="hidden" name="state" value="${escapeAttr(state)}" />
      <input type="hidden" name="code_challenge" value="${escapeAttr(codeChallenge)}" />
      <input type="hidden" name="code_challenge_method" value="${escapeAttr(method)}" />
      <label for="api_key">CRM API Key</label>
      <input id="api_key" name="api_key" type="password" autocomplete="off" placeholder="zaqone_..." required />
      <button type="submit">Authorize ChatGPT</button>
    </form>
  </div>`);
}

export async function POST(request: NextRequest) {
  const form = await request.formData();
  const clientId = String(form.get("client_id") || "").trim();
  const redirectUri = String(form.get("redirect_uri") || "").trim();
  const state = String(form.get("state") || "").trim();
  const codeChallenge = String(form.get("code_challenge") || "").trim();
  const methodRaw = String(form.get("code_challenge_method") || "S256").trim();
  const method = methodRaw === "plain" ? "plain" : "S256";
  const apiKey = String(form.get("api_key") || "").trim();

  if (!clientId || !redirectUri || !codeChallenge) {
    return htmlPage(`<div class="card"><h1>Error</h1><p>Missing OAuth fields.</p></div>`, 400);
  }
  if (!isAllowedRedirectUri(redirectUri)) {
    return htmlPage(`<div class="card"><h1>Error</h1><p>redirect_uri tidak dibenarkan.</p></div>`, 400);
  }

  const ok = await assertApiKeyMatches(apiKey);
  if (!ok) {
    return htmlPage(`
    <div class="card">
      <h1>Sambung ChatGPT → SaleCRM</h1>
      <div class="err">API key salah atau belum dijana. Admin → AI API Key / ChatGPT → Jana key.</div>
      <form method="POST" action="/api/mcp/oauth/authorize">
        <input type="hidden" name="client_id" value="${escapeAttr(clientId)}" />
        <input type="hidden" name="redirect_uri" value="${escapeAttr(redirectUri)}" />
        <input type="hidden" name="state" value="${escapeAttr(state)}" />
        <input type="hidden" name="code_challenge" value="${escapeAttr(codeChallenge)}" />
        <input type="hidden" name="code_challenge_method" value="${escapeAttr(method)}" />
        <label for="api_key">CRM API Key</label>
        <input id="api_key" name="api_key" type="password" autocomplete="off" placeholder="zaqone_..." required />
        <button type="submit">Authorize ChatGPT</button>
      </form>
    </div>`, 401);
  }

  const code = await issueAuthCode({
    client_id: clientId,
    redirect_uri: redirectUri,
    code_challenge: codeChallenge,
    code_challenge_method: method,
  });

  const dest = new URL(redirectUri);
  dest.searchParams.set("code", code);
  if (state) dest.searchParams.set("state", state);
  return NextResponse.redirect(dest.toString(), 302);
}

function escapeAttr(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/"/g, "&quot;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}
