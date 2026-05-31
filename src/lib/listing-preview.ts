import { createServerFn } from "@tanstack/react-start";

export type ListingPreview = {
  imageUrl?: string;
  title?: string;
};

const FETCH_HEADERS = {
  "User-Agent":
    "Mozilla/5.0 (compatible; JeJo/1.0; +https://github.com/aggelikidr/je-jo)",
  Accept: "text/html,application/xhtml+xml",
  "Accept-Language": "en-GB,en;q=0.9,el;q=0.8",
};

function decodeHtmlEntities(value: string): string {
  return value
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .trim();
}

function pickMeta(html: string, key: string): string | null {
  const patterns = [
    new RegExp(
      `<meta[^>]+(?:property|name)=["']${key}["'][^>]+content=["']([^"']+)["']`,
      "i",
    ),
    new RegExp(
      `<meta[^>]+content=["']([^"']+)["'][^>]+(?:property|name)=["']${key}["']`,
      "i",
    ),
  ];
  for (const re of patterns) {
    const m = html.match(re);
    if (m?.[1]) return decodeHtmlEntities(m[1]);
  }
  return null;
}

function normalizePageUrl(raw: string): string {
  const trimmed = raw.trim();
  if (!trimmed) throw new Error("URL is required");
  return trimmed.startsWith("http") ? trimmed : `https://${trimmed}`;
}

function resolveUrl(base: string, maybeRelative: string): string {
  try {
    return new URL(maybeRelative, base).href;
  } catch {
    return maybeRelative;
  }
}

function isAllowedImageUrl(url: string): boolean {
  try {
    const u = new URL(url);
    return u.protocol === "http:" || u.protocol === "https:";
  } catch {
    return false;
  }
}

export async function scrapeListingPreview(rawUrl: string): Promise<ListingPreview> {
  const pageUrl = normalizePageUrl(rawUrl);
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 12_000);

  try {
    const res = await fetch(pageUrl, {
      headers: FETCH_HEADERS,
      redirect: "follow",
      signal: controller.signal,
    });
    if (!res.ok) return {};

    const html = await res.text();
    const title =
      pickMeta(html, "og:title") ??
      pickMeta(html, "twitter:title") ??
      html.match(/<title[^>]*>([^<]+)<\/title>/i)?.[1]?.trim();

    const imageRaw =
      pickMeta(html, "og:image") ??
      pickMeta(html, "og:image:url") ??
      pickMeta(html, "twitter:image") ??
      pickMeta(html, "twitter:image:src");

    let imageUrl: string | undefined;
    if (imageRaw) {
      const resolved = resolveUrl(pageUrl, imageRaw);
      if (isAllowedImageUrl(resolved)) imageUrl = resolved;
    }

    return {
      title: title ? decodeHtmlEntities(title).slice(0, 200) : undefined,
      imageUrl,
    };
  } finally {
    clearTimeout(timeout);
  }
}

export const fetchListingPreview = createServerFn({ method: "POST" })
  .inputValidator((data: { url: string }) => {
    if (!data?.url?.trim()) throw new Error("URL is required");
    return { url: data.url.trim() };
  })
  .handler(async ({ data }): Promise<ListingPreview> => {
    try {
      return await scrapeListingPreview(data.url);
    } catch (e) {
      console.warn("listing preview failed", e);
      return {};
    }
  });

export async function proxyListingImage(target: string): Promise<Response> {
  if (!isAllowedImageUrl(target)) {
    return new Response("Invalid image URL", { status: 400 });
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 12_000);

  try {
    const res = await fetch(target, {
      headers: {
        ...FETCH_HEADERS,
        Accept: "image/*,*/*;q=0.8",
        Referer: new URL(target).origin + "/",
      },
      redirect: "follow",
      signal: controller.signal,
    });

    if (!res.ok) return new Response("Upstream image failed", { status: 502 });

    const type = res.headers.get("content-type") ?? "";
    if (!type.startsWith("image/")) {
      return new Response("Not an image", { status: 415 });
    }

    const body = await res.arrayBuffer();
    if (body.byteLength > 5 * 1024 * 1024) {
      return new Response("Image too large", { status: 413 });
    }

    return new Response(body, {
      headers: {
        "Content-Type": type.split(";")[0]!,
        "Cache-Control": "public, max-age=86400",
      },
    });
  } finally {
    clearTimeout(timeout);
  }
}
