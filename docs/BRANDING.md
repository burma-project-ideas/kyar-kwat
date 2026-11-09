# KyarKwat branding

The **Jump K counter** is an original vector mark: a draught counter with a transparent K cutout. Its two diagonal arms connect the game name to forward/reverse objectives. It replaces the initial four-square/counter placeholder without adding detail that disappears at favicon size.

![Light and dark logo variants](images/brand-preview.png)

## Master and palette

Edit only [`logo-master.svg`](../BlazorWasm.KyarKwat/wwwroot/branding/logo-master.svg) for shape changes. Its 96×96 viewBox contains one even-odd path; both the outer background and K cutout are transparent. No fonts, linked assets, gradients or external services are required to render the mark.

- On dark: mint `#78bfa1`, taken from the app's green counters.
- On light: deep green `#183e30`, taken from their inner ring.
- Icon/social ground: `#111111` / `#000000`.
- Text: white / the existing neutral greys. Inter and Noto Sans Myanmar retain their bundled SIL licenses.

The app remains dark-only. A light-surface logo variant and adaptive favicon provide legibility outside the app, not a new application theme.

## Regenerate

Use Node 22+ with installed Chrome/Edge; set `CHROME_PATH` if the browser is elsewhere. No npm packages are needed:

```sh
node scripts/build-brand.mjs
```

The script renders the master in a fresh, isolated headless browser profile under ignored `artifacts/branding/`. It checks PNG signatures/dimensions, transparent master corners and the K cutout before writing assets. All shapes come from the same master. The social card uses the existing locally bundled fonts.

| Asset in `wwwroot/branding/` | Purpose |
|---|---|
| `logo-master.svg` | Editable transparent vector master |
| `logo-dark.svg`, `logo-light.svg` | Transparent surface variants |
| `logo-dark.png`, `logo-light.png` | Transparent 1024×1024 exports |
| `favicon.svg` | Adaptive light/dark vector favicon |
| `favicon-16.png`, `favicon-32.png`, `favicon-48.png`, `favicon.ico` | Small opaque icons / multi-resolution ICO |
| `apple-touch-icon.png` | 180×180 Apple icon |
| `icon-192.png`, `icon-512.png` | Standard application icons |
| `icon-maskable-512.png` | Padded mark on an opaque full-bleed icon |
| `social-card.png` | 1200×630 social-sharing image |

`docs/images/mark.svg` remains an adaptive compatibility export for existing public README image URLs. `docs/images/brand-preview.png` shows both surface variants. Neither is an independent design source.

The logo and geometry are authored directly in SVG because this repository already uses vector branding and requires deterministic small icons. No AI raster image, stock image, third-party logo, or additional typeface was used. Existing rules references and font attribution remain in the project README and font-license files.

## Verification and release — 2026-11-09

- Generator checks passed: 11 PNGs with expected dimensions, true transparent master corners/K cutout, SVG variants and 16/32/48 multi-resolution ICO.
- **60 brand assertions** passed locally and against https://kyarkwat.vercel.app: public asset requests, metadata, manifest, all icon sizes, identical SVG geometry, loading/header logos, 360/390px layouts, light/dark favicon rendering and maskable safe area.
- **100 C# assertions**, **1,100 game browser assertions/eight full games**, and **342 touch assertions/two full games** passed against the branded local build.
- Style lint and desktop/tablet/mobile inspection passed with zero findings, retaining only the existing allowance for a native modal intentionally covering the inert background heading.
- Published output is cleaned before each build; only the current game-assembly fingerprint is deployed. Old inline four-square logos and the empty favicon were replaced. The public README compatibility export contains the new geometry.
- Production deployment: `dpl_HingzbXpbcDqM8oSGRapp3LNqEmX` (`READY`). The public page and social image return HTTP 200 without authentication.

Desktop/mobile screenshots are in `docs/images/`. Generated check evidence remains under ignored `.taste-skill/branding/` and `.taste-skill/brand-layout/`.

Not checked on physical iOS/Android devices or by installing home-screen icons. Actual social-network cache/preview refresh is not tested. The manifest supplies icon/display metadata; no offline service worker or new app theme was added.
