export const config = { runtime: "edge" };

import { scrapeListingPreview } from "../src/lib/listing-preview";

export default async function handler(request: Request): Promise<Response> {
  if (request.method !== "POST") return new Response("Method Not Allowed", { status: 405 });
  const { url } = (await request.json()) as { url: string };
  if (!url?.trim()) return new Response("URL is required", { status: 400 });
  try {
    const result = await scrapeListingPreview(url.trim());
    return new Response(JSON.stringify(result), {
      headers: { "Content-Type": "application/json" },
    });
  } catch {
    return new Response("{}", { headers: { "Content-Type": "application/json" } });
  }
}
