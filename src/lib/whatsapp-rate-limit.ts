export const WHATSAPP_RATE_LIMIT = {
  maxClicks: 10,
  windowMinutes: 5,
} as const;

export const WHATSAPP_RATE_LIMIT_WARNING = {
  title: "Slow down — Meta may ban your account",
  speed:
    "You contacted many numbers very quickly. WhatsApp may flag this as spam and restrict or ban your account.",
  variation:
    "Use a different sentence each time — same meaning, different words. Do not copy-paste the exact same message to every customer.",
  action: "Take a short break, then continue carefully.",
} as const;

export function isRateLimitExceeded(clickCount: number): boolean {
  return clickCount >= WHATSAPP_RATE_LIMIT.maxClicks;
}
