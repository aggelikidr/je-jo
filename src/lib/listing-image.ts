/** Client-safe URL for listing photos (proxied to avoid hotlink blocks). */
export function listingImageSrc(imageUrl?: string): string | undefined {
  if (!imageUrl?.trim()) return undefined;
  // Data URLs (base64 uploads/pastes) are already local — no proxy needed
  if (imageUrl.startsWith("data:")) return imageUrl;
  return `/api/listing-image?u=${encodeURIComponent(imageUrl.trim())}`;
}
