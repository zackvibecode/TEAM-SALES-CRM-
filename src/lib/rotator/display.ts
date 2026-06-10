export const DEFAULT_LOADING_TEXT = "Sedang sambungkan anda ke team kami...";

export type RotatorImageSize = "small" | "medium" | "large";

export const IMAGE_SIZE_OPTIONS: { value: RotatorImageSize; label: string; hint: string }[] = [
  { value: "small", label: "Kecil", hint: "Sesuai logo / icon — ~240px" },
  { value: "medium", label: "Sederhana", hint: "Default mobile — ~320px" },
  { value: "large", label: "Besar", hint: "Banner penuh — ~420px" },
];

/** Responsive image container classes for public landing page */
export function getRotatorImageClass(size: RotatorImageSize = "medium"): string {
  switch (size) {
    case "small":
      return "relative w-[85%] max-w-[240px] min-h-[160px] aspect-[3/4] max-h-[45vh]";
    case "large":
      return "relative w-full max-w-[min(100%,420px)] min-h-[200px] aspect-[4/3] max-h-[55vh]";
    default:
      return "relative w-[92%] max-w-[320px] min-h-[180px] aspect-[4/3] max-h-[50vh]";
  }
}

export function normalizeImageSize(size?: string | null): RotatorImageSize {
  if (size === "small" || size === "large") return size;
  return "medium";
}
