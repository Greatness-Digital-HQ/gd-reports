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

## Known gotchas

**This Vercel project is not git-connected.** It's deployed by running `vercel --prod`
from whatever local folder has this code, same as it always has been. If you push a fix
here, it does **not** go live on its own — someone still has to run `vercel --prod`
(or connect this repo under Project Settings -> Git so pushes deploy automatically,
which would close this gap for good).

**Next.js caches every `fetch()` call by URL, including ones made inside dependencies.**
`[client]/[month]/route.js` reads the published report via `@vercel/blob`'s `list()` and
then `fetch()`s the blob's URL directly. Because `publishReport` always overwrites the
same blob path (`addRandomSuffix: false`), that URL never changes between publishes —
so without `dynamic = "force-dynamic"` / `fetchCache = "force-no-store"` on the route,
Next just kept serving whatever it fetched the very first time, forever, no matter how
many times the blob was republished. Bit this project twice (Arcadia Senior Living,
2026-09; The Point Acupuncture, 2026-10) before it was tracked down — see those exports
at the top of the route file, and don't remove them without understanding why they're
there.
