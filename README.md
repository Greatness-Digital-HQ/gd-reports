# gd-reports

Hosting service for Greatness Digital's client monthly performance reports.
See `Client Reporting Pipeline — Architecture Brief.md` in the Website folder for full context.

## What this is

Two routes:

- `POST /api/reports/publish` — accepts `{ client_slug, month, html }`, writes the HTML to
  Vercel Blob storage, returns the public URL. Called by the Reporting Agent (Cowork),
  authenticated with a bearer token (`REPORTS_PUBLISH_SECRET`).
- `GET /[client]/[month]` — looks up the stored HTML in Blob and serves it back with the
  correct content type. This is the URL that goes in the client email
  (`reports.greatnessdigital.com/[client-slug]/[yyyy-mm]`).

## Setup

1. `npm install`
2. Deploy this folder as its own Vercel project (see the step-by-step in chat).
3. In the Vercel project: Storage tab -> Create Database -> Blob -> Connect Project.
   This auto-injects `BLOB_READ_WRITE_TOKEN`.
4. In Project Settings -> Environment Variables, add `REPORTS_PUBLISH_SECRET`
   (a long random string — see `.env.example` for how to generate one).
5. Project Settings -> Domains -> add `reports.greatnessdigital.com`, then add the
   CNAME record Vercel gives you at your DNS provider.
6. Test:

```
curl -X POST https://reports.greatnessdigital.com/api/reports/publish \
  -H "Authorization: Bearer YOUR_SECRET" \
  -H "Content-Type: application/json" \
  -d '{"client_slug":"test-client","month":"2026-07","html":"<h1>Hello</h1>"}'
```

Then visit `https://reports.greatnessdigital.com/test-client/2026-07` and confirm it renders.
