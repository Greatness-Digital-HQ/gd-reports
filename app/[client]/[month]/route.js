import { list } from "@vercel/blob";

// 2026-10-07: reports repeatedly served stale HTML after a Force Republish
// (Arcadia 2026-09, The Point Acupuncture 2026-10) even though publishReport
// correctly overwrote the blob at this same path. Root cause: Next.js patches
// the global fetch() used both by our own call below AND internally by
// @vercel/blob's list(), caching responses by URL indefinitely unless told
// not to -- and since allowOverwrite publishes always reuse the exact same
// path/URL, the cache never saw a reason to refetch. The two segment config
// exports below kill that cache for this whole route; the ?v= query param
// also busts any cache sitting in front of the blob CDN itself, in case
// that's a second layer doing the same thing.
export const dynamic = "force-dynamic";
export const fetchCache = "force-no-store";

export async function GET(request, { params }) {
  const { client, month } = params;
  const pathname = `${client}/${month}.html`;

  const { blobs } = await list({ prefix: pathname, limit: 1 });
  const match = blobs.find((b) => b.pathname === pathname);

  if (!match) {
    return new Response("Report not found.", { status: 404 });
  }

  const bustUrl = `${match.url}?v=${new Date(match.uploadedAt).getTime()}`;
  const res = await fetch(bustUrl, { cache: "no-store" });
  if (!res.ok) {
    return new Response("Report not found.", { status: 404 });
  }

  const html = await res.text();

  return new Response(html, {
    status: 200,
    headers: {
      "Content-Type": "text/html; charset=utf-8",
      "Cache-Control": "no-store",
    },
  });
}
