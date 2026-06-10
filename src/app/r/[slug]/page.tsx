import { createDbClient } from "@/lib/supabase/server";
import { CountdownRedirect } from "@/components/rotator/CountdownRedirect";
import { RotatorStatusCard } from "@/components/rotator/RotatorStatusCard";
import { DEFAULT_LOADING_TEXT } from "@/lib/rotator/display";

export const dynamic = "force-dynamic";

interface PageProps {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ source?: string; campaign?: string; preview?: string }>;
}

export default async function PublicRotatorPage({ params, searchParams }: PageProps) {
  const { slug } = await params;
  const { source, campaign, preview } = await searchParams;
  const previewMode = preview === "1" || preview === "true";

  const db = createDbClient();
  const { data: page } = await db
    .from("rotator_pages")
    .select("id, name, slug, image_url, loading_text, image_size, is_active")
    .eq("slug", slug)
    .maybeSingle();

  if (!page) {
    return (
      <RotatorStatusCard
        variant="not_found"
        message="Link tidak dijumpai. Sila semak URL atau hubungi admin."
      />
    );
  }

  if (!page.is_active && !previewMode) {
    return (
      <RotatorStatusCard
        variant="inactive"
        message="Link ini tidak aktif buat sementara waktu."
      />
    );
  }

  const imageUrl = page.image_url || "/default-rotator-preview.jpg";

  return (
    <CountdownRedirect
      slug={slug}
      imageUrl={imageUrl}
      loadingText={page.loading_text || DEFAULT_LOADING_TEXT}
      imageSize={page.image_size}
      source={source || "direct"}
      campaign={campaign || "none"}
      previewMode={previewMode}
    />
  );
}
