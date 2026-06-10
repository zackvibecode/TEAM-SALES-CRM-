export function getRotatorPublicPath(slug: string): string {
  return `/r/${slug}`;
}

export function getRotatorPreviewPath(slug: string): string {
  return `/r/${slug}?preview=1`;
}

export function getRotatorPublicUrl(slug: string): string {
  if (typeof window !== "undefined") {
    return `${window.location.origin}${getRotatorPublicPath(slug)}`;
  }
  return getRotatorPublicPath(slug);
}

export function getRotatorPreviewUrl(slug: string): string {
  if (typeof window !== "undefined") {
    return `${window.location.origin}${getRotatorPreviewPath(slug)}`;
  }
  return getRotatorPreviewPath(slug);
}

export function isRotatorSlugReady(slug: string | undefined | null): boolean {
  const s = slug?.trim();
  return !!s && s !== "your-slug";
}
