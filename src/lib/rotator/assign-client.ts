/** Dedupe concurrent assign requests per slug+visitor (React Strict Mode / remounts) */
type AssignResponse = {
  success: boolean;
  error?: string;
  whatsapp_url?: string;
  sales_phone?: string;
  whatsapp_message?: string;
  cached?: boolean;
};

const inflight = new Map<string, Promise<AssignResponse>>();

export async function fetchRotatorAssign(
  slug: string,
  payload: Record<string, unknown>
): Promise<AssignResponse> {
  const visitorId = String(payload.visitor_id || "");
  const key = `${slug}:${visitorId}`;

  const existing = inflight.get(key);
  if (existing) return existing;

  const promise = fetch("/api/rotator/assign", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  })
    .then((res) => res.json() as Promise<AssignResponse>)
    .finally(() => {
      window.setTimeout(() => inflight.delete(key), 5000);
    });

  inflight.set(key, promise);
  return promise;
}
