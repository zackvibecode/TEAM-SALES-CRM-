import { NextRequest, NextResponse } from "next/server";
import { resolveCrmApiKey } from "@/lib/agent-api-key";

function extractProvidedKey(request: NextRequest): string | null {
  const xApiKey = request.headers.get("x-api-key")?.trim();
  if (xApiKey) return xApiKey;

  const auth = request.headers.get("authorization")?.trim() ?? "";
  const bearer = auth.match(/^Bearer\s+(.+)$/i);
  if (bearer?.[1]?.trim()) return bearer[1].trim();

  const queryKey = request.nextUrl.searchParams.get("api_key")?.trim();
  if (queryKey) return queryKey;

  return null;
}

export async function requireAgentAuth(request: NextRequest) {
  const configured = await resolveCrmApiKey();
  if (!configured) {
    return {
      error: NextResponse.json(
        {
          error:
            "CRM API key not configured. Admin: Settings → AI API Key to generate one.",
        },
        { status: 503 }
      ),
    };
  }

  const provided = extractProvidedKey(request);
  if (!provided || provided !== configured) {
    return {
      error: NextResponse.json(
        {
          error:
            "Invalid or missing API key. Use X-API-Key header, Authorization: Bearer, or ?api_key= query param",
        },
        { status: 401 }
      ),
    };
  }

  return { ok: true as const };
}
