# Everly. — website (+ platform later)

Next.js 15 (App Router, TypeScript). One project: public marketing pages now, logged-in platform routes added later in the same app.

## Run
```
npm install
npm run dev        # http://localhost:3000
npm run build
```
Deploy: import into Vercel, framework preset **Next.js**.

## Structure
- `app/(site)/` — public pages: home, how-it-works, couples, suppliers, about, faq, contact, signup, login, privacy, terms
- `src/components/` — Header, Footer, Builder (interactive Wedding Builder demo), Phone (app mockup), Form, etc.
- `src/lib/site.ts` — copy, nav, FAQs and the demo builder data
- `public/images/` — Pexels photos (free licence, see CREDITS.json); `public/brand/` — logos from the brand pack
- Platform (Phase 1) will live under routes like `/dashboard`, `/builds`, `/my-wedding`, `/supplier` (already disallowed in robots.ts)

## Before launch
- [ ] Confirm domain (`NEXT_PUBLIC_SITE_URL`, default everly.co.uk) and contact email (`src/lib/site.ts`, currently hello@everly.co.uk)
- [ ] `NEXT_PUBLIC_WEB3FORMS_KEY` so early-access + contact forms email the owner (without it, forms show a success message only)
- [ ] Client to approve all copy (draft)
- [ ] Privacy policy + terms from a solicitor
- [ ] Builder demo uses example venues/prices — swap for real listings when the platform is live
