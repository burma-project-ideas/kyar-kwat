# KyarKwat branding

The **Tiger + Doe Pyar counter** combines a tiger face with the round Burmese draughts counter (ဒိုးပြား). Bold eyes, nose and stripes are transparent cutouts in one circular silhouette. It uses the existing app palette: mint `#78bfa1` on dark surfaces and deep green `#183e30` on light surfaces. The app itself remains dark-only.

![Light and dark logo variants](images/brand-preview.png)

## Master and generated assets

Edit [`logo-master.svg`](../BlazorWasm.KyarKwat/wwwroot/branding/logo-master.svg), then run:

```sh
node scripts/build-brand.mjs
```

Node 22+ and installed Chrome/Edge are required; `CHROME_PATH` can select the browser. No npm dependencies are added. The existing generator renders one transparent 96×96 SVG master into all sizes, checks PNG dimensions, JPEG signatures and transparent corners/forehead stripe, and writes:

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
| `social-card-tiger.jpg` | Current 1200×630 JPEG share preview with bundled Burmese/Inter fonts |
| `social-card-tiger.png` | Previous PNG export, retained for already-shared image URLs |
| `social-card.png` | Compatibility alias, regenerated with the current design |

The root `/favicon.ico` and `docs/images/mark.svg` remain compatibility exports with the new geometry. The header, loader, prototype, favicon declarations and manifest use the generated assets. Updated icon URLs carry `?v=tiger`; Open Graph and Twitter use the absolute `social-card-tiger.jpg` URL to avoid reusing the old image cache key. Existing social messages can retain their own cached previews.

This is an original native SVG drawing, with no stock image or copied third-party logo. The Inter and Noto Sans Myanmar SIL licenses and original game-rules attribution remain unchanged.

## Verification — 2026-11-09

The generator checks 12 PNG exports, transparent cutouts, SVG variants and the 16/32/48 ICO. The brand check covers metadata served without JavaScript to Facebook/Telegram user agents, image MIME type and dimensions, manifest icons, root favicon parity, matching master geometry, header/loader rendering, 360/390px layouts, adaptive light/dark favicon and maskable safe area.

```sh
node tests/brand-checks.mjs "PATH_TO_DESIGN_SKILL" http://127.0.0.1:5281
node tests/brand-checks.mjs "PATH_TO_DESIGN_SKILL" https://kyarkwat.vercel.app
```

Browser screenshots are saved under ignored `.taste-skill/branding/`; README desktop/mobile screenshots are refreshed from the checked build. These automated user-agent requests test delivery, not either platform's preview renderer.

On 2026-11-09, actual Facebook Sharing Debugger navigation was attempted in the user's Chrome and the in-app browser. Navigation/capture timed out and no preview was obtained. Telegram Desktop input reported unavailable coordinate geometry and window capture timed out; no preview was observed during that inspection. The platform recheck below supersedes that Telegram limitation.

For a manual platform recheck, use [Facebook Sharing Debugger](https://developers.facebook.com/tools/debug/?q=https%3A%2F%2Fkyarkwat.vercel.app%2F), then **Scrape Again**. For Telegram, [its official preview-update guidance](https://bugs.telegram.org/c/57/4) describes submitting the public URL to [@WebpageBot](https://t.me/WebpageBot). Verify the returned image visually; a cache-refresh success message alone does not prove rendering.

Physical iOS/Android devices and installed home-screen icons are not checked. This branding release does not change game rules, AI, themes or offline behavior.

Production: [kyarkwat.vercel.app](https://kyarkwat.vercel.app/), deployment dpl_RaN2Dq794mqDy9HQEDkUfwHUAbqi (READY). The live share image SHA-256 matches the locally generated Tiger + Doe Pyar export.

Results: 70 brand assertions passed locally and on production. Generated preview pixels were inspected on light/dark surfaces; the live preview matches the local export byte for byte. Build and static-file hash verification passed. Gameplay regression suites were not rerun for this asset-only change.

## Actual platform recheck — 2026-11-10

With the user's help opening Telegram Desktop's **Webpage Bot** chat and sending the prepared test URL, its actual returned message was inspected through the accessibility tree:

| URL | Actual bot result |
|---|---|
| `https://kyarkwat.vercel.app/` | Plain URL, even after the bot reported a successful update at 00:10 Myanmar time |
| `https://kyarkwat.vercel.app/?preview=tiger-20261110` | Photo, **1200×630**; website **KyarKwat**; title **KyarKwat — ကျားနိုင် / ကျားကုန်**; Burmese description, returned at 00:10 Myanmar time |

The earlier workaround was [the verified query URL](https://kyarkwat.vercel.app/?preview=tiger-20261110) when sharing on Telegram. It opens the same game. The root-specific failure with a successful fresh query strongly suggests stale URL state in Telegram; it is an inference, not a confirmed internal cache diagnosis. Similar root/query behavior is reported on [Telegram's issue tracker](https://bugs.telegram.org/c/61650/31). A Webpage Bot success message alone did not repair the exact root URL.

The live page still declares the Tiger + Doe Pyar PNG in static Open Graph/Twitter metadata. That PNG returns HTTP 200, `image/png`, 54,349 bytes. Vercel's read-only firewall configuration returned `active: null`, `draft: null`, and no custom versions; no firewall settings were changed. This does not establish whether platform-wide filtering ever occurred.

Photo presence, dimensions and text were confirmed from the actual Telegram message. Screenshot capture still timed out, so its rendered logo pixels were not independently inspected. Facebook Sharing Debugger and Facebook's share dialog both returned browser `ERR_CONNECTION_TIMED_OUT`; their actual preview remains unverified. No metadata or image defect was established by these results, so the working metadata/image assets are unchanged.

## Unchanged-root JPEG retry — 2026-11-10

At the user's request, the shared URL and canonical URL remain exactly `https://kyarkwat.vercel.app/`; no redirect or query parameter was introduced. The single-master generator now also exports a 1200×630 JPEG at quality 0.92. Both Open Graph and Twitter reference `social-card-tiger.jpg`, and `og:image:type` is `image/jpeg`. Existing PNG URLs remain available for previously shared messages.

Production deployment `dpl_9QjNBDHM1UAEKfooHdnByY8QAJWs` is READY. The JPEG returns HTTP 200, `image/jpeg`, 36,234 bytes; browser decoding confirms 1200×630. The build/static-copy verification and 74 local and 74 production branding assertions passed. This was a compatibility/cache-revalidation experiment, not a confirmed PNG defect: the previous PNG already worked with a fresh page-query URL.

After deployment the user sent the exact root URL to Webpage Bot again. At **00:19 Myanmar time**, Telegram reported a successful refresh, but the actual returned message was still a plain root link, with no photo/title/description in its accessibility tree. **The JPEG retry did not fix the root preview.** Screenshot capture remains unavailable. No game logic or security settings were changed. The README now gives only the requested clean root URL instead of recommending a query-parameter workaround.

The remaining root-specific preview state cannot be invalidated through an exposed website setting or a verified Telegram operation available in this session. Further investigation needs Telegram's preview backend/support; changing more metadata without evidence would not establish a fix. [Telegram's own guidance](https://bugs.telegram.org/c/57/4) directs persistent preview problems to in-app support after a Webpage Bot refresh.

## Vercel settings and cache-header audit — 2026-11-10

Read-only project inspection confirmed the expected project ID/name, no password protection, and no active/draft custom firewall configuration or rule versions. The project has SSO protection configured as `all_except_custom_domains`; public production-root and image requests with no authentication succeed with HTTP 200. This setting was not weakened, and no protection-bypass secret was created.

Before the change, root HTML and JPEG responses used `Cache-Control: public, must-revalidate, max-age=0`, with `X-Vercel-Cache: HIT` and `Age: 273`. These are observations, not evidence that Vercel served stale metadata. The deploy script previously emitted only the minimum version-3 output config, with no custom cache rules.

The generated Build Output API config now applies `Cache-Control: no-store, max-age=0`, `CDN-Cache-Control: no-store`, and `Vercel-CDN-Cache-Control: no-store` specifically to `/`, `/index.html` and `/branding/social-card-tiger.jpg`. Matching continues to filesystem routing. A build self-check verified coverage of those paths and excluded the Blazor runtime from the rule. The shared URL, canonical URL, image content and game rules are unchanged.

Deployment `dpl_4CWkybXoDziGwu68tSbbCEvqmrrP` is READY. `vercel cache purge --type cdn --yes` succeeded for the existing project. Two consecutive anonymous Telegram-user-agent requests to each target returned HTTP 200 and the new client/CDN no-store headers. The first request reported `MISS`, the second `HIT`, both with `Age: 0`. Vercel still reports an internal static-file hit; the no-store header must not be described as proof of zero internal edge caching. The Vercel-specific cache header is consumed by the platform and is not expected in public responses.

During the post-purge Telegram inspection, Webpage Bot's latest returned root-link message at **00:25 Myanmar time** was still plain text with no photo/title/description. **The Vercel cache-policy change and purge have not established a working root preview.** Telegram's success reply is not counted as preview success. The site-facing checks are independent of Telegram's own cached preview state.

References: [Vercel cache headers](https://vercel.com/docs/caching/cache-control-headers), [Build Output routes](https://vercel.com/docs/build-output-api/configuration), and [CDN cache purge](https://vercel.com/docs/cli/cache).

Verification: 78 production branding assertions passed, including the new HTML/JPEG cache-header assertions and desktop/mobile game startup checks. Anonymous root HEAD returned 200 without changing the URL; Facebook-user-agent GET received the JPEG metadata and unchanged root canonical. Gameplay regression suites were not rerun for this deployment-config-only change.

## Correlated Vercel request-log capture — 2026-11-10

Historical request-log access was recovered using Vercel CLI's actual `/api/logs/request-logs` endpoint. The session transport had previously double-prefixed `/api` for the high-level logs command, producing 404; using the correctly prefixed endpoint returned valid log responses. The uninstrumented static deployment initially had no retained request rows, including no positive-control rows, so absence there was not treated as evidence about Telegram.

A temporary, dependency-free pass-through routing observer was deployed as `dpl_BhmRZtf7nNAQeEtNFCsqCiXeui8Q`. It matched only `/` and `/branding/social-card-tiger.jpg`, logging pathname, method and user-agent into Vercel runtime logs while continuing to the existing static files. It logged no cookies, authorization headers, message contents or query strings. It existed only in ignored build output, not in application source.

The user sent the unchanged root URL to Webpage Bot at **00:37 Myanmar time**. The bot reported refresh success and returned a plain root link, with no photo/title/description. The captured request-log window was **00:34:02–00:39:38 Myanmar time** (2026-11-09 18:04:02–18:09:38 UTC). The final response had `hasMoreRows: false` and five observer events:

| Myanmar time | Path | User-agent classification | Final logged status |
|---|---|---|---|
| 00:34:02, twice | `/` | HeadlessChrome probes | 200 |
| 00:34:06 | `/` | Explicit `KyarKwatPreviewControl/20261110` control | 200 |
| 00:34:06 | `/branding/social-card-tiger.jpg` | Same explicit control | 200 |
| 00:38:59 | `/` | Explicit `KyarKwatPreviewControl/PostBot` control, after the bot reply | 200 |

**No captured event identified itself as Telegram or WebpageBot**, and the observer was demonstrably recording requests both before and after the bot refresh. Therefore the capture does not provide a Telegram HTTP response/status to report; the controls' 200 statuses must not be attributed to Telegram. This supports a root-specific preview-state/crawler issue but does not prove its internal cause. Requests rejected upstream of middleware, requests using an unexpected identity, and Telegram's internal cache are outside this observer's visibility. No further metadata, URL, security or cache changes were justified by these logs.

Raw API responses and the sanitized summary remain in ignored `artifacts/observer-request-logs.json` and `artifacts/preview-log-summary.json`. No paid observability feature was enabled; the existing team is on Hobby.

The observer was then removed by regenerating the normal publish output and redeploying as **dpl_2fbbvW9BbdPmaaqqypJWpkxzXX38** (READY). Assertions confirmed no middleware route/function in output, HTTP 200 and no-store headers for the unchanged root/JPEG, and HTTP 404 for the temporary observer endpoint. The root Telegram preview is still unresolved; this capture is diagnostic evidence, not a successful fix.
