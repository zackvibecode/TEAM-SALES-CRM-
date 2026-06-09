import { randomBytes } from "crypto";
import { createDbClient } from "@/lib/supabase/server";

export const CRM_AGENT_SETTING_KEY = "crm_agent_api_key";

export function generateCrmAgentApiKey(): string {
  return `zaqone_${randomBytes(24).toString("hex")}`;
}

export function maskApiKey(key: string): string {
  if (key.length <= 12) return "••••••••";
  return `${key.slice(0, 8)}••••••••${key.slice(-4)}`;
}

export async function getCrmApiKeyFromDb(): Promise<string | null> {
  try {
    const db = createDbClient();
    const { data, error } = await db
      .from("app_settings")
      .select("value")
      .eq("key", CRM_AGENT_SETTING_KEY)
      .maybeSingle();

    if (error) return null;
    const value = data?.value?.trim();
    return value || null;
  } catch {
    return null;
  }
}

export async function resolveCrmApiKey(): Promise<string | null> {
  const fromDb = await getCrmApiKeyFromDb();
  if (fromDb) return fromDb;

  const fromEnv =
    process.env.CRM_API_KEY?.trim() || process.env.HERMES_AGENT_API_TOKEN?.trim();
  return fromEnv || null;
}

export async function saveCrmApiKeyToDb(key: string, adminUserId: string): Promise<void> {
  const db = createDbClient();
  const { error } = await db.from("app_settings").upsert(
    {
      key: CRM_AGENT_SETTING_KEY,
      value: key,
      updated_at: new Date().toISOString(),
      updated_by: adminUserId,
    },
    { onConflict: "key" }
  );

  if (error) throw new Error(error.message);
}

export async function getCrmApiKeyMeta(): Promise<{
  configured: boolean;
  source: "database" | "environment" | "none";
  masked: string | null;
  updated_at: string | null;
}> {
  const db = createDbClient();
  const { data } = await db
    .from("app_settings")
    .select("value, updated_at")
    .eq("key", CRM_AGENT_SETTING_KEY)
    .maybeSingle();

  if (data?.value) {
    return {
      configured: true,
      source: "database",
      masked: maskApiKey(data.value),
      updated_at: data.updated_at,
    };
  }

  const envKey =
    process.env.CRM_API_KEY?.trim() || process.env.HERMES_AGENT_API_TOKEN?.trim();
  if (envKey) {
    return {
      configured: true,
      source: "environment",
      masked: maskApiKey(envKey),
      updated_at: null,
    };
  }

  return { configured: false, source: "none", masked: null, updated_at: null };
}

/** Production custom domain — avoid *.vercel.app which may have Deployment Protection. */
export const CRM_PUBLIC_BASE_URL =
  process.env.NEXT_PUBLIC_CRM_BASE_URL?.trim().replace(/\/$/, "") ||
  "https://salescrm.zaqone.com";

export function getCrmPublicBaseUrl(requestHost?: string | null): string {
  if (process.env.NEXT_PUBLIC_CRM_BASE_URL?.trim()) {
    return process.env.NEXT_PUBLIC_CRM_BASE_URL.trim().replace(/\/$/, "");
  }
  if (requestHost?.includes("salescrm.zaqone.com")) {
    return "https://salescrm.zaqone.com";
  }
  if (process.env.VERCEL_URL) {
    return `https://${process.env.VERCEL_URL}`;
  }
  if (requestHost) {
    const protocol = requestHost.includes("localhost") ? "http" : "https";
    return `${protocol}://${requestHost}`;
  }
  return "http://localhost:3000";
}
