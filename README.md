# CoCard Anderson — Website Demo

A redesign concept for [CoCard Anderson](https://encompossolutions.com/) (merchant services + POS, Syracuse NY & Bennington VT), built by [OWSH Studio](https://owshstudio.com).

**Live:** https://cocard-anderson.vercel.app

Static site — no build step, no dependencies. Open `index.html` locally, or it deploys to Vercel as-is (auto-deploys on push to `main`).

## Pages

| File | Page |
|------|------|
| `index.html` | Home |
| `cash-discount.html` | Cash Discount program (live savings calculator) |
| `pos-systems.html` | POS, terminals & payments (POS systems, Dejavoo terminals, gateways, mobile) |
| `b2bx.html` | B2BX Level 3 processing |
| `breach-insurance.html` | Data breach insurance |
| `chargeback-reimbursement.html` | Chargeback reimbursement |
| `about.html` | About |
| `404.html` | Not-found page |

All copy is sourced from CoCard Anderson's live site, except Genius (Global Payments), Bodega AI, and iPOS (Dejavoo), which were researched from the vendors' own materials. Content reference lives in `../source/`.

## Stack & conventions

- Hand-written HTML + a single `css/styles.css`. Fonts: Sora (headings) + Manrope (body).
- Identity: navy classical-trust + a green "savings" accent. Transparent PNG logo + full favicon/apple-touch/manifest icon set.
- **SEO:** per-page canonical/OG/Twitter/geo meta, `LocalBusiness` + `BreadcrumbList` + `Service` + `FAQPage` JSON-LD, `sitemap.xml`, `robots.txt`, branded 1200x630 `assets/og-default.png`.
- **Accessibility:** `<main>` + skip link, `:focus-visible`, `prefers-reduced-motion`, ARIA on nav + decorative SVGs, AA-contrast text.
- **Performance:** lazy-loaded below-fold images, preloaded per-page LCP image, compressed photos.
- Mobile nav: hamburger-only header with a full-panel menu.

## Config

- `vercel.json` — `cleanUrls: true` (slugs resolve without `.html`).
- `site.webmanifest` — PWA manifest.

## To do before a real launch

- **Domain:** canonical/OG/sitemap/robots currently point at `cocard-anderson.vercel.app`. Swap to the production domain when chosen.
- **Photos:** hero/section imagery is licensed stock (Unsplash). Replace with CoCard's real photography.
- **Contact form:** shows a client-side success message only. Wire to Formspree or a real endpoint (fields have `name` attributes).
