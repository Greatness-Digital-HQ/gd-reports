import { list } from "@vercel/blob";

export async function GET(request, { params }) {
  const { client, month } = params;
  const pathname = `${client}/${month}.html`;

  const { blobs } = await list({ prefix: pathname, limit: 1 });
  const match = blobs.find((b) => b.pathname === pathname);

  if (!match) {
    return new Response("Report not found.", { status: 404 });
  }

  const res = await fetch(match.url);
  if (!res.ok) {
    return new Response("Report not found.", { status: 404 });
  }

  const html = await res.text();

  return new Response(html, {
    status: 200,
    headers: { "Content-Type": "text/html; charset=utf-8" },
  });
}
