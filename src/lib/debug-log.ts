import { appendFileSync, mkdirSync } from "fs";
import { dirname, join } from "path";

const LOG_PATHS = [
  join(process.cwd(), "debug-ef1fce.log"),
  join(process.cwd(), ".cursor", "debug-ef1fce.log"),
];

export function debugSessionLog(payload: {
  hypothesisId?: string;
  location: string;
  message: string;
  data?: Record<string, unknown>;
  runId?: string;
}) {
  try {
    const line =
      JSON.stringify({
        sessionId: "ef1fce",
        timestamp: Date.now(),
        ...payload,
      }) + "\n";
    for (const LOG_PATH of LOG_PATHS) {
      try {
        mkdirSync(dirname(LOG_PATH), { recursive: true });
        appendFileSync(LOG_PATH, line, "utf8");
      } catch {
        /* ignore */
      }
    }
  } catch {
    /* ignore */
  }
}
