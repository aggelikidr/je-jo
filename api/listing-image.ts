export const config = { runtime: "edge" };

import { proxyListingImage } from "../src/lib/listing-preview";

export default async function handler(request: Request): Promise<Response> {
  const { searchParams } = new URL(request.url);
  const target = searchParams.get("u");
  if (!target) return new Response("Missing u parameter", { status: 400 });
  return proxyListingImage(target);
}
