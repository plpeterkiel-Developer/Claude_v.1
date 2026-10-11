# Murerfirmaet Kiel – v2 ("Atelier")

A bold, modern one-page site plus three SEO landing pages for a bathroom-tiling murer.
Plain HTML, CSS and JavaScript – no build step, no dependencies.

## Run it locally

```bash
cd murerfirmaet-kiel-v2
python3 -m http.server 8000
```

Then open http://localhost:8000 in your browser. (Double-clicking `index.html` also works.)

## Before going live – replace the placeholders

Search the files for these and swap in the real details:

| Placeholder | Where |
|---|---|
| `+45 00 00 00 00` / `+4500000000` | All pages (phone links, JSON-LD) |
| `Eksempelvej 1, 2500 Valby`, `CVR 00000000` | Footer + JSON-LD in `index.html` |
| Stats (20+, 600+, 4.9 …) marked `EKSEMPEL` | `index.html` |
| Testimonials marked `EKSEMPLER` | `index.html` – use real Google/Trustpilot reviews |
| Memberships/certificates in the "Hvorfor Kiel" list | `index.html` |
| `PRICES` object | `js/main.js` – the estimator's price levels |
| Before/after illustration | `index.html` – replace with real project photos |
| `og:image` | Add a 1200×630 project photo |

The contact form opens the visitor's mail app. To receive submissions directly,
connect it to a form service (e.g. Formspree or Netlify Forms).
