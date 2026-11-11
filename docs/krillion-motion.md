# Krillion motion

Looked on 11 Nov 2026 as a guest. Daily dive #118. Files sit under `web/public/vendor/krillion/`. This note does not copy their prompts or answer lists.

## Scene kind

The sea is mixed. Canvas `.ds-sea` paints sky and depth bands from `gen/optimized/v1/bg-sky.webp`, `bg-top.webp`, `bg-mid.webp`, and `bg-trench.webp`. `img.ds-floor` is `water-bg.webp`. There is no boat PNG. The boat, waves, and small ambient boats are canvas 2D on `.ds-sea` / `.ds-fore`. Small fish on `.ds-fore` use `tiers/schooler.png` via `drawImage`. The swimming mascot is a DOM image, `tiers/krillion.png`, inside `.ds-mascot-sprite`. Scanlines are CSS, not an image.

## What I saw

### First paint

`shots/descending.png` is the boot. Class `.ds-boot`. Dark gradient `#0b1526` to `#050a14` to `#03070f`. Center image is `tiers/krillion.png` with class `krill`, 64px, pixelated, pink drop-shadow. Label `descending…` is `.ds-boot-label`. CSS animation `ds-boot-bob` is 2.4s on the krill. CSS animation `ds-boot-pulse` is 1.6s on the label. I did not stopwatch how long this screen stayed up.

### Home

`shots/home.png`. Phase `intro` on `.ds-root`. Wordmark `.ds-title` says KRILLION, 124px, color `#e8f1ff`, pink/cyan text-shadow. Animation `ds-title-flicker` 5s steps. Each letter bobs with `ds-bob-l` 3.2s, delay 0.18s per letter. Tagline `.ds-tagline` is cyan `#4de3ff` at 28px. Subline `.ds-subline` is drift `#7d93b8` at 20px.

Scanlines `.ds-crt` overlay the whole stage. Repeating 1px black lines every 3px. Opacity 0.45. z-index 12.

Depth and score pods exist in the HUD. `.ds-hud` is opacity 0 and translated -80px on intro, so they are off-screen in the home shot. DOM text was DEPTH 0m and SCORE 0. Depth number color is `#4de3ff`. Score number color is `#ff5d8f`. Pods use a `#101d33` to `#0b1526` gradient.

How to play is `.ds-howto`. Six rules. BEGIN DESCENT is `.ds-begin-btn`. Color `#e8f1ff` on `#101d33`. Cyan 6px ring. Animation `ds-btn-bob` 1.9s, 5px vertical. Dive #118 sits under the button with ARCHIVE, THEMED PACKS, UNLIMITED. Puffer Party uses `gen/party/puffer-0.png` in `.GameDiscovery-module__sRLeRq__puffer`. Live count moved from 12,217 to 12,234 while I watched. Font-family everywhere is `VT323, "VT323 Fallback", ui-monospace, monospace`.

### Prompt

`shots/prompt.png`. Card `.ds-card.ds-px` centered over the water. Background `#101d33` at 0.93. Animation `ds-card-in` 0.7s with 0.45s delay. Round label `.rnd` is pink `#ff5d8f`, 14px, letter-spacing 0.32em. Prompt type is foam 28–40px. Hint is drift 13px.

The 3 second read is a bottom pill `.ds-preview-pill`. Copy: `descending · the clock starts in N`. The input is not in the DOM during preview. I sampled from the DESCEND click. At 4ms the pill said 41, then at 104ms it said 3. It said 2 at 1004ms. It said 1 at 2004ms. It said 0 at 3004ms. Phase `answering` and the dock arrived at 3018ms with digits 25.

The 25 second ring is `.ds-sonar-scope` at the left of `.ds-dock`. Sweep `.ds-sweep` rotates with `ds-sweep-spin` 2.4s linear infinite. Digits `.ds-time-digits` are 26px cyan. Fuse `.ds-fuse-fill` is a 4px cyan bar under the input. `transform: scaleX(remaining/25000)`. At 3050ms left the dock gets class `hot` and the fuse and border turn `#ff5d8f`. DIVE is `.ds-dive-btn`, pink `#ff5d8f` on abyss `#050a14`. Placeholder: type one answer…. Public constants match what I timed: `PREVIEW_MS` 3000, `ANSWER_MS` 25000. I saw digits at 25, 19, 18, 11, 10, 8, 7, 3, and 0. I did not sit through one uninterrupted 25s with a stopwatch.

### Correction

I typed `bulls`. The box became `Chicago Bulls`. The pill `.ds-correction-panel` said `“bulls” → “Chicago Bulls”` and `submit again to confirm · or edit`. That read happened 561ms after submit. `shots/correction.png` is the confirm click, not a clean pill. The ring was already 0 and hot. The DIVE label was `…`. Class `.ds-correction` sits above the dock at `bottom: calc(92px + env(safe-area-inset-bottom))`.

### Scored reveal

`shots/reveal.png`. Phase `feedback`. Banner `.ds-landed` animation `ds-banner-in` 0.8s. Icon `tiers/plankton.png` as `img.icon`, 88px, `ds-icon-bob` 2.6s, drop-shadow in plankton grey `rgb(143, 163, 196)`. Title `.tname` PLANKTON, 44px, that same grey. Answer `.tans` 24px foam. Points `.tpts` 28px foam: +10 PTS · sink 100m. Sub `.tsub` 17px drift. Depth pod 100m. Score pod 10. DESCEND is `.ds-next-btn`. Public JS also names `descendToRound(..., 2400)` for the drop into a new prompt.

### Miss

`shots/miss.png` is an empty timeout. `.tname` NOTHING LANDED in miss grey `#3d4f6e` / `rgb(61, 79, 110)`. `.tans` is an em dash. +0 PTS. Subline: the clock beat you to it. No tier PNG. Same `ds-banner-in` 0.8s. Depth stayed 0m. A late typed miss on prompt 1 used the other subline, never made it onto the reef, still with no icon.

### Menu and settings

`shots/menu.png`. Dialog `#site-menu`. Panel background `#101d33`. Foam type. Daily dive is the current pink tile. Puffer Party still uses `puffer-0.png`. Footer note: Your timer keeps running while the menu is open. I did not join a party room. I did not call `https://party.krillion.io`.

`shots/settings.png`. Guest. Low-power off. Colorblind off. Answer corrections on. Clear rejected entries off. Share link off. Account row links to My Krillion and Restore. I did not sign in.

## Colors and type I read

`--color-abyss` `#050a14`. `--color-shallow` `#101d33`. `--color-foam` `#e8f1ff`. `--color-drift` `#7d93b8`. `--color-lumen-cyan` `#4de3ff`. `--color-lumen-pink` `#ff5d8f`. `--color-tier-krillion` `#ffd166`. `--color-tier-miss` `#3d4f6e`. `--color-tier-tooclever` `#ff9f43`. Easing: `--ds-ease-io` cubic-bezier(.65,0,.35,1), `--ds-ease-out` cubic-bezier(.22,1,.36,1), `--ds-ease-snap` cubic-bezier(.34,1.56,.64,1).

## What I inferred

The boot lasts until `/api/today` and local game state finish. That is why DESCENDING is first paint. The 3s pill is `PREVIEW_MS`. The ring is `ANSWER_MS`. Ten points becoming 100m matches the on-screen rule that one point is 10 metres. Canvas color stops behind the webp bands are `#1d5580` at 0m down to `#02050b` at 5200m. Low-power mode would replace some sprite fish with fillRect blobs. I did not turn that on.

## Gaps

I did not time boot-to-home with a clock.

`shots/correction.png` missed the correction pill. The pill text is from the DOM, not from that PNG.

I did not capture a too-clever, rare, deep-cut, or krillion reveal. Those PNGs are still saved from `/tiers/*.png`.

`puffer-1.png` through `puffer-3.png` exist. The daily screens only requested `puffer-0.png`. `puffer-4.png` and `puffer-5.png` 404.

Latin-ext font files are in CSS. This loop only requested the latin woff2.

Ads were on the page. I did not save ad creatives or ad scripts.
