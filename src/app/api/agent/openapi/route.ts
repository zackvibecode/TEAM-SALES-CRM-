import { NextResponse } from "next/server";
import { readFileSync } from "fs";
import { join } from "path";

/** OpenAPI schema for ChatGPT Custom GPT Actions */
export async function GET() {
  try {
    const path = join(process.cwd(), "public", "agent-openapi.json");
    const raw = readFileSync(path, "utf8");
    return new NextResponse(raw, {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        "Cache-Control": "public, max-age=300",
      },
    });
  } catch {
    return NextResponse.json({ error: "OpenAPI schema not found" }, { status: 404 });
  }
}
