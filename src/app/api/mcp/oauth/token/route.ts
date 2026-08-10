import { NextRequest, NextResponse } from "next/server";
import { exchangeAuthCode } from "@/lib/mcp/oauth";

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
    const contentType = request.headers.get("content-type") || "";
    let body: Record<string, string> = {};

    if (contentType.includes("application/json")) {
      body = (await request.json()) as Record<string, string>;
    } else {
      const form = await request.formData();
      form.forEach((v, k) => {
        body[k] = String(v);
      });
    }

    const grantType = (body.grant_type || "").trim();
    if (grantType !== "authorization_code") {
      return NextResponse.json(
        { error: "unsupported_grant_type" },
        { status: 400, headers: cors }
      );
    }

    const code = (body.code || "").trim();
    const clientId = (body.client_id || "").trim();
    const redirectUri = (body.redirect_uri || "").trim();
    const codeVerifier = (body.code_verifier || "").trim();

    if (!code || !clientId || !redirectUri || !codeVerifier) {
      return NextResponse.json(
        { error: "invalid_request", error_description: "Missing required fields" },
        { status: 400, headers: cors }
      );
    }

    const token = await exchangeAuthCode({
      code,
      client_id: clientId,
      redirect_uri: redirectUri,
      code_verifier: codeVerifier,
    });

    if (!token) {
      return NextResponse.json(
        { error: "invalid_grant" },
        { status: 400, headers: cors }
      );
    }

    return NextResponse.json(token, { headers: cors });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "token_error";
    return NextResponse.json(
      { error: "server_error", error_description: msg },
      { status: 500, headers: cors }
    );
  }
}
