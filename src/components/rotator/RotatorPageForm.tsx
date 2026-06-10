"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Eye } from "lucide-react";
import { getRotatorPublicPath } from "@/lib/rotator/urls";
import { UploadImage } from "./UploadImage";
import { RotatorLandingPreview } from "./RotatorLandingPreview";
import { DEFAULT_ROTATOR_MESSAGE } from "@/types/rotator";
import { slugifyRotatorName } from "@/lib/rotator/whatsapp";
import {
  DEFAULT_LOADING_TEXT,
  IMAGE_SIZE_OPTIONS,
  normalizeImageSize,
  type RotatorImageSize,
} from "@/lib/rotator/display";
import type { RotatorPage, RotatorSalesMember } from "@/types/rotator";

interface RotatorPageFormProps {
  page?: RotatorPage;
  salesMembers: RotatorSalesMember[];
  assignedIds?: string[];
}

export function RotatorPageForm({ page, salesMembers, assignedIds = [] }: RotatorPageFormProps) {
  const router = useRouter();
  const [name, setName] = useState(page?.name || "");
  const [slug, setSlug] = useState(page?.slug || "");
  const [imageUrl, setImageUrl] = useState<string | null>(page?.image_url || null);
  const [defaultMessage, setDefaultMessage] = useState(page?.default_message || DEFAULT_ROTATOR_MESSAGE);
  const [loadingText, setLoadingText] = useState(page?.loading_text || DEFAULT_LOADING_TEXT);
  const [imageSize, setImageSize] = useState<RotatorImageSize>(
    normalizeImageSize(page?.image_size)
  );
  const [isActive, setIsActive] = useState(page?.is_active ?? true);
  const [selectedSales, setSelectedSales] = useState<string[]>(assignedIds);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [showPreview, setShowPreview] = useState(true);

  const toggleSales = (id: string) => {
    setSelectedSales((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError("");

    const payload = {
      ...(page ? { id: page.id } : {}),
      name,
      slug: slug || slugifyRotatorName(name),
      image_url: imageUrl,
      default_message: defaultMessage,
      loading_text: loadingText,
      image_size: imageSize,
      is_active: isActive,
      sales_member_ids: selectedSales,
    };

    try {
      const res = await fetch("/api/admin/rotator/pages", {
        method: page ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Save failed");
      router.push("/dashboard/rotator-team/pages");
      router.refresh();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Save failed");
    } finally {
      setSaving(false);
    }
  };

  const effectiveSlug = slug || slugifyRotatorName(name) || "your-slug";
  const publicUrl = getRotatorPublicPath(effectiveSlug);

  return (
    <div className="grid lg:grid-cols-[1fr_300px] xl:grid-cols-[1fr_320px] gap-6 items-start">
      <form onSubmit={handleSubmit} className="space-y-6 min-w-0">
        <div className="card-padded space-y-4">
          <div>
            <label className="text-sm font-medium block mb-1">Page Name</label>
            <input
              className="input-field"
              value={name}
              onChange={(e) => {
                setName(e.target.value);
                if (!page) setSlug(slugifyRotatorName(e.target.value));
              }}
              required
            />
          </div>

          <div>
            <label className="text-sm font-medium block mb-1">Slug / URL</label>
            <div className="flex items-center gap-2">
              <span className="text-sm text-[var(--text-muted)]">/r/</span>
              <input
                className="input-field flex-1"
                value={slug}
                onChange={(e) => setSlug(slugifyRotatorName(e.target.value))}
                required
              />
            </div>
            <p className="text-xs mt-1" style={{ color: "var(--text-muted)" }}>Public link: {publicUrl}</p>
            <p className="text-xs mt-1 text-amber-600">Slug mesti unik. Kalau slug sama dengan page lain, create akan gagal.</p>
          </div>

          <div>
            <label className="text-sm font-medium block mb-2">Landing Page Image</label>
            <UploadImage value={imageUrl} onChange={setImageUrl} imageSize={imageSize} />
          </div>

          <div>
            <label className="text-sm font-medium block mb-1">Saiz Gambar (Mobile)</label>
            <select
              className="input-field"
              value={imageSize}
              onChange={(e) => setImageSize(e.target.value as RotatorImageSize)}
            >
              {IMAGE_SIZE_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label} — {opt.hint}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="text-sm font-medium block mb-1">Teks Loading Page</label>
            <input
              className="input-field"
              value={loadingText}
              onChange={(e) => setLoadingText(e.target.value)}
              placeholder={DEFAULT_LOADING_TEXT}
              required
            />
            <p className="text-xs mt-1" style={{ color: "var(--text-muted)" }}>
              Teks yang pengunjung nampak semasa countdown
            </p>
          </div>

          <div>
            <label className="text-sm font-medium block mb-1">Default WhatsApp Message</label>
            <textarea
              className="input-field min-h-[100px]"
              value={defaultMessage}
              onChange={(e) => setDefaultMessage(e.target.value)}
              required
            />
          </div>

          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" checked={isActive} onChange={(e) => setIsActive(e.target.checked)} />
            Active
          </label>
        </div>

        <div className="card-padded space-y-3">
          <h3 className="font-semibold text-sm">Assigned Sales Team</h3>
          <p className="text-xs" style={{ color: "var(--text-muted)" }}>
            Only active assigned members participate in rotation for this page.
          </p>
          {selectedSales.length === 0 && (
            <p className="text-xs font-medium text-amber-700 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2">
              Wajib pilih sekurang-kurangnya 1 sales team. Kalau kosong, visitor akan nampak &quot;Team Tidak Tersedia&quot;.
            </p>
          )}
          <div className="space-y-2 max-h-64 overflow-y-auto">
            {salesMembers.map((m) => (
              <label key={m.id} className="flex items-center gap-3 p-2 rounded-lg hover:bg-[var(--surface-hover)] cursor-pointer">
                <input
                  type="checkbox"
                  checked={selectedSales.includes(m.id)}
                  onChange={() => toggleSales(m.id)}
                />
                <span className="flex-1 text-sm">{m.name}</span>
                <span className="text-xs" style={{ color: "var(--text-muted)" }}>{m.phone}</span>
                {!m.is_active && <span className="text-xs text-amber-600">Inactive</span>}
              </label>
            ))}
          </div>
        </div>

        {error && <p className="text-sm text-red-600">{error}</p>}

        <div className="flex flex-wrap gap-3">
          <button type="submit" disabled={saving} className="btn-primary-solid">
            {saving ? "Saving..." : page ? "Update Page" : "Create Page"}
          </button>
          <button
            type="button"
            onClick={() => setShowPreview((v) => !v)}
            className="btn-secondary inline-flex items-center gap-2 lg:hidden"
          >
            <Eye className="w-4 h-4" />
            {showPreview ? "Sembunyi Preview" : "Preview"}
          </button>
          <button type="button" onClick={() => router.back()} className="btn-ghost">
            Cancel
          </button>
        </div>

        {showPreview && (
          <div className="lg:hidden card-padded">
            <RotatorLandingPreview
              imageUrl={imageUrl}
              loadingText={loadingText}
              imageSize={imageSize}
              slug={effectiveSlug}
              linksEnabled={!!page}
            />
          </div>
        )}
      </form>

      <div className="hidden lg:block sticky top-6">
        <div className="card-padded">
          <RotatorLandingPreview
            imageUrl={imageUrl}
            loadingText={loadingText}
            imageSize={imageSize}
            slug={effectiveSlug}
            linksEnabled={!!page}
          />
        </div>
      </div>
    </div>
  );
}
