import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin-auth";
import { logAudit } from "@/lib/audit";
import {
  generateCrmAgentApiKey,
  getCrmApiKeyMeta,
  getCrmPublicBaseUrl,
  saveCrmApiKeyToDb,
} from "@/lib/agent-api-key";

export async function GET(request: NextRequest) {
  try {
    const auth = await requireAdmin();
    if (auth.error) return auth.error;

    const meta = await getCrmApiKeyMeta();
    const host = request.headers.get("host");
    const baseUrl = getCrmPublicBaseUrl(host);

    return NextResponse.json({
      ...meta,
      baseUrl,
      endpoints: [
        { method: "GET", path: "/api/agent/test", description: "Test connection (mula di sini)" },
        { method: "GET", path: "/api/agent/help", description: "Arahan API (tanpa key)" },
        { method: "GET", path: "/api/agent/sales-users", description: "Senarai sales (legacy CRM)" },
        {
          method: "GET",
          path: "/api/agent/sales-user/{slug}/summary?days=30",
          description: "Ringkasan prestasi (legacy)",
        },
        {
          method: "GET",
          path: "/api/agent/sales-user/{slug}/activity?limit=50",
          description: "Aktiviti terkini (legacy)",
        },
        {
          method: "GET",
          path: "/api/agent/sales-user/{slug}/daily-breakdown?days=30",
          description: "Pecahan mengikut hari (legacy)",
        },
        { method: "GET", path: "/api/agent/pics", description: "Senarai PIC (Sales Follow-Up)" },
        {
          method: "GET",
          path: "/api/agent/leads?pic=fatin&limit=50",
          description: "Senarai SFU leads",
        },
        {
          method: "GET",
          path: "/api/agent/follow-ups?queue=due_today&pic=fatin",
          description: "Queue follow-up (due today / overdue)",
        },
        {
          method: "GET",
          path: "/api/agent/leads/{id}/follow-ups",
          description: "Sejarah follow-up satu lead",
        },
        {
          method: "GET",
          path: "/api/agent/dashboard?pic=fatin",
          description: "Dashboard / report SFU",
        },
        {
          method: "GET",
          path: "/api/agent/pic-performance",
          description: "Laporan prestasi PIC",
        },
      ],
      headerHint: "X-API-Key: <key>  atau  ?api_key=<key> pada URL",
      importantNotes: [
        "Token zaqone_* = CRM API key (bukan login admin, bukan Vercel bypass).",
        "Guna domain https://salescrm.zaqone.com — jangan guna *.vercel.app preview.",
        "Jangan fetch halaman web (/admin) — guna /api/agent/... sahaja.",
        "Hermes: /api/agent/leads + /api/agent/follow-ups + /api/agent/dashboard sudah ada.",
        "Vercel bypass hanya perlu jika guna URL preview *.vercel.app (header x-vercel-protection-bypass).",
      ],
      exampleCurl:
        'curl -H "X-API-Key: YOUR_KEY" "https://salescrm.zaqone.com/api/agent/follow-ups?queue=due_today"',
      exampleUrlWithQuery:
        "https://salescrm.zaqone.com/api/agent/leads?pic=fatin&api_key=YOUR_KEY",
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Failed to load API key info";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const auth = await requireAdmin();
    if (auth.error) return auth.error;

    const body = await request.json().catch(() => ({}));
    if (body.confirm !== true) {
      return NextResponse.json(
        { error: 'Send { "confirm": true } to generate a new API key.' },
        { status: 400 }
      );
    }

    const newKey = generateCrmAgentApiKey();
    await saveCrmApiKeyToDb(newKey, auth.user.id);

    await logAudit({
      actorId: auth.user.id,
      action: "rotate_agent_api_key",
      entityType: "app_settings",
      details: { keyPrefix: newKey.slice(0, 12) },
    });

    const host = request.headers.get("host");
    const baseUrl = getCrmPublicBaseUrl(host);

    return NextResponse.json({
      success: true,
      apiKey: newKey,
      baseUrl,
      message:
        "Salin key ini sekarang. Key penuh hanya dipaparkan sekali. Key lama tidak sah lagi.",
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Failed to generate API key";
    if (msg.includes("app_settings") || msg.includes("relation")) {
      return NextResponse.json(
        {
          error:
            "Table app_settings belum wujud. Jalankan migration 009_agent_api_settings.sql dalam Supabase SQL Editor.",
        },
        { status: 503 }
      );
    }
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
