# KyarKwat branding

The **Tiger + Doe Pyar counter** combines a tiger face with the round Burmese draughts counter (ဒိုးပြား). Bold eyes, nose and stripes are transparent cutouts in one circular silhouette. It uses the existing app palette: mint `#78bfa1` on dark surfaces and deep green `#183e30` on light surfaces. The app itself remains dark-only.

![Light and dark logo variants](images/brand-preview.png)

## Master and generated assets

Edit [`logo-master.svg`](../BlazorWasm.KyarKwat/wwwroot/branding/logo-master.svg), then run:

```sh
node scripts/build-brand.mjs
```

Node 22+ and installed Chrome/Edge are required; `CHROME_PATH` can select the browser. No npm dependencies are added. The existing generator renders one transparent 96×96 SVG master into all sizes, checks dimensions and transparent corners/forehead stripe, and writes:

| Asset in `wwwroot/branding/` | Purpose |
|---|---|
| `logo-master.svg` | Editable transparent vector master |
| `logo-dark.svg`, `logo-light.svg` | Transparent surface variants |
| `logo-dark.png`, `logo-light.png` | Transparent 1024×1024 exports |
| `favicon.svg` | Adaptive light/dark vector favicon |
| `favicon-16.png`, `favicon-32.png`, `favicon-48.png`, `favicon.ico` | Small icons and multi-resolution ICO |
| `apple-touch-icon.png` | 180×180 Apple icon |
| `icon-192.png`, `icon-512.png` | Standard app icons |
| `icon-maskable-512.png` | Opaque icon with padded safe area |
| `social-card-tiger.png` | 1200×630 share preview with bundled Burmese/Inter fonts |
| `social-card.png` | Compatibility alias, regenerated with the current design |

The root `/favicon.ico` and `docs/images/mark.svg` remain compatibility exports with the new geometry. The header, loader, prototype, favicon declarations and manifest use the generated assets. Updated icon URLs carry `?v=tiger`; Open Graph and Twitter use the fresh absolute `social-card-tiger.png` URL to avoid reusing the old image cache key. Existing social messages can retain their own cached previews.

This is an original native SVG drawing, with no stock image or copied third-party logo. The Inter and Noto Sans Myanmar SIL licenses and original game-rules attribution remain unchanged.

## Verification — 2026-11-09

The generator checks 12 PNG exports, transparent cutouts, SVG variants and the 16/32/48 ICO. The brand check covers metadata served without JavaScript to Facebook/Telegram user agents, image MIME type and dimensions, manifest icons, root favicon parity, matching master geometry, header/loader rendering, 360/390px layouts, adaptive light/dark favicon and maskable safe area.

```sh
node tests/brand-checks.mjs "PATH_TO_DESIGN_SKILL" http://127.0.0.1:5281
node tests/brand-checks.mjs "PATH_TO_DESIGN_SKILL" https://kyarkwat.vercel.app
```

Browser screenshots are saved under ignored `.taste-skill/branding/`; README desktop/mobile screenshots are refreshed from the checked build. These automated user-agent requests test delivery, not either platform's preview renderer.

Actual Facebook Sharing Debugger navigation was attempted in the user's Chrome and the in-app browser. Navigation/capture timed out and no preview was obtained. Telegram Desktop was available, but its input reported unavailable coordinate geometry and window capture timed out; no URL was sent or preview observed. These are verification blockers, not proof of a site or platform defect.

For a manual platform recheck, use [Facebook Sharing Debugger](https://developers.facebook.com/tools/debug/?q=https%3A%2F%2Fkyarkwat.vercel.app%2F), then **Scrape Again**. For Telegram, [its official preview-update guidance](https://bugs.telegram.org/c/57/4) describes submitting the public URL to [@WebpageBot](https://t.me/WebpageBot). Verify the returned image visually; a cache-refresh success message alone does not prove rendering.

Physical iOS/Android devices and installed home-screen icons are not checked. This branding release does not change game rules, AI, themes or offline behavior.

Production: [kyarkwat.vercel.app](https://kyarkwat.vercel.app/), deployment dpl_RaN2Dq794mqDy9HQEDkUfwHUAbqi (READY). The live share image SHA-256 matches the locally generated Tiger + Doe Pyar export.

Results: 70 brand assertions passed locally and on production. Generated preview pixels were inspected on light/dark surfaces; the live preview matches the local export byte for byte. Build and static-file hash verification passed. Gameplay regression suites were not rerun for this asset-only change.
