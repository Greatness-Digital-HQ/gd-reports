import { put } from "@vercel/blob";

export async function POST(request) {
  const authHeader = request.headers.get("authorization");
  const expected = `Bearer ${process.env.REPORTS_PUBLISH_SECRET}`;

  if (!process.env.REPORTS_PUBLISH_SECRET || authHeader !== expected) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401,
      headers: { "Content-Type": "application/json" },
    });
  }

  let body;
  try {
    body = await request.json();
  } catch (err) {
    return new Response(JSON.stringify({ error: "Invalid JSON body" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  const { client_slug, month, html } = body || {};

  if (!client_slug || !month || !html) {
    return new Response(
      JSON.stringify({ error: "client_slug, month, and html are all required" }),
      { status: 400, headers: { "Content-Type": "application/json" } }
    );
  }

  if (!/^[a-z0-9-]+$/.test(client_slug)) {
    return new Response(
      JSON.stringify({
        error: "client_slug must be lowercase letters, numbers, and hyphens only",
      }),
      { status: 400, headers: { "Content-Type": "application/json" } }
    );
  }

  if (!/^\d{4}-\d{2}$/.test(month)) {
    return new Response(
      JSON.stringify({ error: "month must be in YYYY-MM format, e.g. 2026-07" }),
      { status: 400, headers: { "Content-Type": "application/json" } }
    );
  }

  const pathname = `${client_slug}/${month}.html`;

  const blob = await put(pathname, html, {
    access: "public",
    contentType: "text/html; charset=utf-8",
    addRandomSuffix: false,
    allowOverwrite: true,
  });

  const publicUrl = `https://reports.greatnessdigital.com/${client_slug}/${month}`;

  return new Response(
    JSON.stringify({ ok: true, blob_url: blob.url, public_url: publicUrl }),
    { status: 200, headers: { "Content-Type": "application/json" } }
  );
}
