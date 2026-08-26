import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin-auth";
import { getPaymentSettings } from "@/lib/payment/service";

const MAX_SIZE = 5 * 1024 * 1024;
const ALLOWED_TYPES = ["image/jpeg", "image/jpg", "image/png", "image/webp"];

export async function POST(request: NextRequest) {
  try {
    const authResult = await requireAdmin();
    if ("error" in authResult && authResult.error) return authResult.error;
    const { user, db } = authResult;

    const formData = await request.formData();
    const file = formData.get("file") as File | null;

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }
    if (!ALLOWED_TYPES.includes(file.type)) {
      return NextResponse.json({ error: "Only JPG, PNG, WEBP allowed" }, { status: 400 });
    }
    if (file.size > MAX_SIZE) {
      return NextResponse.json({ error: "Max file size is 5MB" }, { status: 400 });
    }

    const ext = file.name.split(".").pop()?.toLowerCase() || "png";
    const fileName = `qr/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
    const buffer = Buffer.from(await file.arrayBuffer());

    const { error: uploadError } = await db.storage
      .from("payment-assets")
      .upload(fileName, buffer, { contentType: file.type, upsert: true });

    if (uploadError) throw uploadError;

    const { data: urlData } = db.storage.from("payment-assets").getPublicUrl(fileName);
    const qrUrl = urlData.publicUrl;

    const settings = await getPaymentSettings(db);
    const patch = {
      qr_code_url: qrUrl,
      updated_at: new Date().toISOString(),
      updated_by: user.id,
    };

    if (settings.id) {
      const { error } = await db
        .from("payment_settings")
        .update(patch)
        .eq("id", settings.id);
      if (error) throw error;
    } else {
      const { error } = await db.from("payment_settings").insert({
        plan_name: "PRO",
        plan_price: 150,
        subscription_duration_days: 30,
        ...patch,
      });
      if (error) throw error;
    }

    return NextResponse.json({ url: qrUrl });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Upload failed";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
