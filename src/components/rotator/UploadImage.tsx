"use client";

import { useRef, useState } from "react";
import Image from "next/image";
import { Upload, X } from "lucide-react";
import { getRotatorImageClass, normalizeImageSize, type RotatorImageSize } from "@/lib/rotator/display";

interface UploadImageProps {
  value: string | null;
  onChange: (url: string | null) => void;
  imageSize?: RotatorImageSize | string | null;
}

/** Rotator page image upload with preview */
export function UploadImage({ value, onChange, imageSize = "medium" }: UploadImageProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [preview, setPreview] = useState<string | null>(value);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");

  const displayUrl = preview || value || "/default-rotator-preview.jpg";
  const imageClass = getRotatorImageClass(normalizeImageSize(imageSize));

  const handleFile = async (file: File) => {
    setError("");
    const localPreview = URL.createObjectURL(file);
    setPreview(localPreview);

    setUploading(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      const res = await fetch("/api/admin/rotator/upload", { method: "POST", body: formData });
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
      <div className={`mx-auto rounded-lg overflow-hidden border border-[var(--border-subtle)] bg-white ${imageClass}`}>
        <Image
          src={displayUrl}
          alt="Rotator preview"
          fill
          className="object-contain"
          unoptimized={displayUrl.startsWith("blob:")}
        />
      </div>

      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          disabled={uploading}
          className="btn-secondary text-sm inline-flex items-center gap-2"
        >
          <Upload className="w-4 h-4" />
          {uploading ? "Uploading..." : "Upload Image"}
        </button>
        {(preview || value) && (
          <button
            type="button"
            onClick={() => { setPreview(null); onChange(null); }}
            className="btn-ghost text-sm inline-flex items-center gap-2"
          >
            <X className="w-4 h-4" />
            Remove
          </button>
        )}
      </div>

      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/jpg,image/png,image/webp"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) handleFile(file);
        }}
      />

      <p className="text-xs" style={{ color: "var(--text-muted)" }}>
        JPG, PNG, WEBP — max 3MB
      </p>
      {error && <p className="text-xs text-red-600">{error}</p>}
    </div>
  );
}
