import { NextRequest, NextResponse } from "next/server";
import { isAllowedRedirectUri, newClientId } from "@/lib/mcp/oauth";

export const runtime = "nodejs";

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
  "Cache-Control": "no-store",
};

export async function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: cors });
}

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json().catch(() => ({}))) as {
      redirect_uris?: string[];
      client_name?: string;
      token_endpoint_auth_method?: string;
      grant_types?: string[];
      response_types?: string[];
    };

    const redirectUris = Array.isArray(body.redirect_uris) ? body.redirect_uris : [];
    if (redirectUris.length === 0 || !redirectUris.every(isAllowedRedirectUri)) {
      return NextResponse.json(
        { error: "invalid_redirect_uri" },
        { status: 400, headers: cors }
      );
    }

    const clientId = newClientId();
    return NextResponse.json(
      {
        client_id: clientId,
        client_id_issued_at: Math.floor(Date.now() / 1000),
        client_name: body.client_name || "ChatGPT",
        redirect_uris: redirectUris,
        grant_types: body.grant_types || ["authorization_code"],
        response_types: body.response_types || ["code"],
        token_endpoint_auth_method: body.token_endpoint_auth_method || "none",
      },
      { status: 201, headers: cors }
    );
  } catch {
    return NextResponse.json({ error: "server_error" }, { status: 500, headers: cors });
  }
}
