import { SERVICE_KEY_SETUP_HINT } from "./env";

/** Map Supabase Auth Admin API errors to actionable messages. */
export function mapAdminAuthError(message: string): string {
  const m = message.toLowerCase();
  if (
    message === "User not allowed" ||
    m.includes("service_role") ||
    m.includes("not_admin") ||
    m.includes("supabase_admin")
  ) {
    return SERVICE_KEY_SETUP_HINT;
  }
  return message;
}
