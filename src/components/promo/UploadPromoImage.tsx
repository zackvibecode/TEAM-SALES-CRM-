"use client";

import { useRef, useState } from "react";
import Image from "next/image";
import { Upload, X } from "lucide-react";
import { useAppLocale } from "@/components/i18n/AppLocaleProvider";

interface UploadPromoImageProps {
  value: string | null;
  onChange: (url: string | null) => void;
}

export function UploadPromoImage({ value, onChange }: UploadPromoImageProps) {
  const { t } = useAppLocale();
  const inputRef = useRef<HTMLInputElement>(null);
  const [preview, setPreview] = useState<string | null>(value);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");

  const displayUrl = preview || value;

  const handleFile = async (file: File) => {
    setError("");
    const localPreview = URL.createObjectURL(file);
    setPreview(localPreview);

    setUploading(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      const res = await fetch("/api/promos/upload", { method: "POST", body: formData });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Upload failed");
      onChange(data.url);
      setPreview(data.url);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Upload failed");
      setPreview(value);
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="space-y-3">
      <div className="mx-auto w-full max-w-xs rounded-lg overflow-hidden border border-[var(--border-subtle)] bg-white aspect-[3/4] relative">
        {displayUrl ? (
          <Image src={displayUrl} alt="Promo poster" fill className="object-cover" unoptimized />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center text-sm" style={{ color: "var(--text-muted)" }}>
            {t.promo.poster}
          </div>
        )}
      </div>

      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          disabled={uploading}
          className="btn-secondary text-sm inline-flex items-center gap-2"
        >
          <Upload className="w-4 h-4" />
          {uploading ? t.common.saving : t.promo.uploadPoster}
        </button>
        {value && (
          <button
            type="button"
            onClick={() => {
              onChange(null);
              setPreview(null);
            }}
            className="btn-secondary text-sm inline-flex items-center gap-2"
          >
            <X className="w-4 h-4" />
            {t.promo.removePoster}
          </button>
        )}
      </div>

      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) handleFile(file);
        }}
      />

      {error && <p className="text-sm text-red-500">{error}</p>}
    </div>
  );
}
