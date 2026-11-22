# Asteria platform

The real platform lives at `/platform` (couples + suppliers) and `/admin` (Asteria team). It is private: everyone must
enter the platform password first. The marketing site and the `/couple-preview` + `/supplier-preview` demos are unchanged.

## One-time setup on Vercel

1. **Database** — Vercel project → Storage → Create → **Neon (Postgres)** → connect it to this project (all environments).
   This adds `DATABASE_URL` automatically. Tables are created on first use.
2. **File storage** — Storage → Create → **Blob** → connect to this project. Adds `BLOB_READ_WRITE_TOKEN` (photos & brochures).
3. **Redeploy**, then open `/admin/setup` straight away to create the admin account and choose the platform password.
   (Setup only works while no admin exists.)

## Optional services (switch on when ready)

| Variable | What it does |
|---|---|
| `RESEND_API_KEY` | Emails (new enquiry alerts, e-invites). Verify asteria-events.com in Resend first. |
| `MAIL_FROM` | Sender, default `Asteria <hello@asteria-events.com>` |
| `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET` | Card payments (next stage) |

## Local development

```
DATABASE_URL=postgres://user@localhost:5432/asteria npm run dev
```
Without Blob storage, uploads are stored inline in development only.

## Code map

- `src/platform/` — database, auth, actions (server), shared UI
- `app/(platform)/platform/*` — couple and supplier areas
- `app/(platform)/admin/*` — admin
