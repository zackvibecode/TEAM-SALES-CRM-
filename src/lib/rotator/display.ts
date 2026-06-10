export const DEFAULT_LOADING_TEXT = "Sedang sambungkan anda ke team kami...";

export type RotatorImageSize = "xs" | "small" | "medium" | "large" | "xlarge";

export const IMAGE_SIZE_OPTIONS: { value: RotatorImageSize; label: string; hint: string }[] = [
  { value: "xs", label: "Sangat Kecil", hint: "Logo / icon — ~220px" },
  { value: "small", label: "Kecil", hint: "Gambar padat — ~300px" },
  { value: "medium", label: "Sederhana", hint: "Standard mobile — ~380px" },
  { value: "large", label: "Besar", hint: "Poster promosi — ~460px" },
  { value: "xlarge", label: "Penuh Skrin", hint: "Maksimum phone — ~560px" },
];

const VALID_SIZES = new Set<RotatorImageSize>(["xs", "small", "medium", "large", "xlarge"]);

/** Responsive image container classes for public landing page */
export function getRotatorImageClass(size: RotatorImageSize = "large"): string {
  switch (size) {
    case "xs":
      return "relative w-[88%] max-w-[220px] min-h-[150px] aspect-[3/4] max-h-[38vh]";
    case "small":
      return "relative w-[90%] max-w-[300px] min-h-[190px] aspect-[3/4] max-h-[46vh]";
    case "medium":
      return "relative w-[94%] max-w-[380px] min-h-[230px] aspect-[4/5] max-h-[54vh]";
    case "xlarge":
      return "relative w-full max-w-[min(100%,560px)] min-h-[280px] aspect-[4/5] max-h-[72vh]";
    case "large":
    default:
      return "relative w-full max-w-[min(100%,460px)] min-h-[260px] aspect-[4/5] max-h-[64vh]";
  }
}

/** Outer content frame width — scales with image size on phone */
export function getRotatorFrameClass(size: RotatorImageSize = "large"): string {
  switch (size) {
    case "xs":
      return "w-full max-w-[min(100%,15rem)]";
    case "small":
      return "w-full max-w-[min(100%,20rem)]";
    case "medium":
      return "w-full max-w-[min(100%,26rem)]";
    case "xlarge":
      return "w-full max-w-[min(100%,36rem)]";
    case "large":
    default:
      return "w-full max-w-[min(100%,30rem)]";
  }
}

export function getRotatorImageSizesAttr(size: RotatorImageSize = "large"): string {
  switch (size) {
    case "xs":
      return "(max-width: 640px) 88vw, 220px";
    case "small":
      return "(max-width: 640px) 90vw, 300px";
    case "medium":
      return "(max-width: 640px) 94vw, 380px";
    case "xlarge":
      return "(max-width: 640px) 96vw, 560px";
    default:
      return "(max-width: 640px) 96vw, 460px";
  }
}

export function normalizeImageSize(size?: string | null): RotatorImageSize {
  if (size && VALID_SIZES.has(size as RotatorImageSize)) {
    return size as RotatorImageSize;
  }
  return "large";
}
