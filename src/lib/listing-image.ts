/** Client-safe URL for listing photos (proxied to avoid hotlink blocks). */
export function listingImageSrc(imageUrl?: string): string | undefined {
  if (!imageUrl?.trim()) return undefined;
  return `/api/listing-image?u=${encodeURIComponent(imageUrl.trim())}`;
}
