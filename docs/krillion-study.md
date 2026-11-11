# Krillion study

Looked on 11 Nov 2026. The live dive was still #118, dated 2026-11-10. `/api/today` said it resets at 2026-11-11T05:00:00.000Z.

This note is for Alamang. It does not copy Krillion's prompts, answer lists, art, or tier names into Alamang content. The one answer below is the correction example.

## What I saw

### Home

I opened https://krillion.io. The title was "Krillion · the daily dive". The home screen showed a pixel sea, a boat, scanlines, and the wordmark in VT323. The line under the title said seven prompts, 25 seconds each, and that rarer answers sink deeper.

"How to play" listed six rules. Seven prompts a day, the same for everyone. 25 seconds to name one thing. Rare answers score big. The clever pick is usually common too. Every point sinks you 10 metres, and 700 is the trench. One dive per day.

The screen said dive #118. A Puffer Party button said "Beta · limited time" and a live count: "11,811 playing", then later "11,466 playing". The page loads that count from `https://party.krillion.io/activity`. One fetch of that URL returned `{"players":11711,"rooms":3883}`. I did not join a room.

Home also linked to archive, themed packs, and unlimited. Mediavine ad slots were on the page.

### A prompt

Begin descent opened a round. The card said which prompt of 7 it was. A ring counted down. The box placeholder was "type one answer…". The button said DIVE. Depth started at 0m and the score at 0.

There is a short preview before the box accepts an answer. I saw the box arrive after that pause. I did not time the pause with a stopwatch.

### Correction

On prompt 2 I typed `catholic` and pressed DIVE. The box changed to `Catholic Church`. A line under the card said `"catholic" → "Catholic Church"` and "submit again to confirm · or edit".

POST `/api/submit` with `previewCorrection: true` returned `{"accepted":false,"correction":"Catholic Church"}`. The same call without `playerId` returned 400 `{"error":"Bad request"}`.

A second submit, with `previewCorrection: false` and the corrected text, returned `{"accepted":true,"answer":"Catholic Church","tier":"plankton","score":10}`. That JSON had no blurb.

### Scored reveal

The reveal said PLANKTON, "Catholic Church", +10 PTS, sink 100m, and "The answer everyone blurts out." Depth read 100m. Score read 10.

### Timeout

Leaving a prompt empty ended on NOTHING LANDED, +0 PTS, and "the clock beat you to it." Depth stayed 0m. DESCEND moved to the next prompt.

### Menu and settings

The menu listed Daily dive, Unlimited, Puffer Party, Archive, Themed packs, My Krillion, Friends, Settings, and FAQ. It also linked out to merch and to Chainle. A note said the timer keeps running while the menu is open.

Settings had low-power mode, colorblind mode, answer corrections, clear rejected entries, and a share link. Answer corrections were on. The description said off accepts a correction immediately. The panel also linked to My Krillion, restore, privacy, and FAQ.

These routes responded 200. I did not play them: `/archive`, `/packs`, `/unlimited/classic`, `/party`, `/account`, `/friends`.

### Guest progress

This browser stored three Krillion keys.

`krillion:player:v1` was a quoted random id.

`krillion:game:v1` was the dive in progress. It held the date, day number 118, round, phase, and results. A scored row stored the answer, tier, and points.

`krillion:resume:v1` appeared after the menu had been open. It did not hold answers. It held a return pointer: href `/`, date, and a label for dive #118. It was absent on the first read of this browser.

The public bundle also names `krillion:stats:v1`. This browser did not have that key. Settings in the bundle use separate keys, including `krillion-contrast` and `krillion-answer-corrections`. Answer corrections default to on.

### Submit route

The client posts JSON to `/api/submit`: `date`, `promptId`, `answer`, `previewCorrection`, and `playerId`. The client aborts that request after 5 seconds. A failed check while you are not confirming shows "signal lost. resend".

### Privacy and FAQ

I opened https://krillion.io/privacy and https://krillion.io/faq. The policy is effective 23 Sep 2026.

You can play with no account, name, or email. The browser invents a random id. Guest progress, the game in progress, sound, colorblind mode, the chosen character, that id, and purchase unlock tokens stay in local storage.

Every typed answer is sent to be scored. Guest daily answers are checked and discarded, not stored. The policy names one exception: answers on the free practice dive are kept with the random id. A finished dive stores the game, the score, and the random id for an anonymous percentile.

Their own cookie is `krillion_session`. It is set only after a purchase or restore, lasts a year, and scripts cannot read it.

The processor list names Vercel for hosting, Neon for the database, Cloudflare for Puffer Party hosting and bot protection, Google for analytics and optional sign-in, Stripe for payments, and Mediavine for ads. Firebase is named in the sign-in section. Firebase Authentication supplies the account id, name, and email. Synced progress sits in Neon under that Firebase id. Card numbers stay with Stripe.

Puffer Party uses Cloudflare Turnstile. The policy says a signed verification cookie can last up to 12 hours.

The FAQ says answer sets are built from public sources, then cleaned. Some rarity is counted from how often a name shows up in text. The top gem is also picked to be fun, so it can be less rare than a deep cut. Autocorrect also checks aliases. Any pack purchase turns ads off. The party fuse is intentionally random, 10 to 30 seconds in the default settings.

### Stack and clocks in the public client

Response headers said `server: Vercel` and `x-nextjs-prerender`. Pages load `/_next/static` chunks built with Turbopack. The computed font was VT323. Scanlines are a `.ds-crt` overlay: a repeating horizontal gradient at 0.45 opacity.

The daily answer window constant is `ANSWER_MS`, 25000. The daily preview constant is `PREVIEW_MS`, 3000. `COUNTDOWN_MS` is also 3000, and it sits in the party module next to party settings. It is not the daily answer clock.

Per-answer scores in the client are plankton 10, tooclever 15, schooler 30, rare 60, deepcut 85, and krillion 100. `MAX_DAY_SCORE` is 700. The reveal multiplies points by 10 and labels the unit metres.

Day bands in the client are 0 to 150, 151 to 250, 251 to 350, 351 to 449, and 450 or more. There are seven rounds.

## What I inferred

The reset timestamp is midnight US Eastern standard time. I did not see a timezone label on the screen.

Ten points sank 100m on the reveal, which matches the rule that one point is 10 metres. The plankton line on the reveal is the client blurb for that tier, not a field in the submit JSON.

`COUNTDOWN_MS` of 3000 is the party countdown. The daily "25 seconds" line matches `ANSWER_MS`. The 3 second pause before typing matches `PREVIEW_MS`.

The home count near 11,551 on an earlier look is this same live counter. It moved while I watched. It is people in party rooms, not a lifetime total.

Guest daily answers are not the thing stored in `krillion:game:v1`. That key is the local game. The policy says the server throws the guest answer away after the check, then stores the finished game and score under the random id.

## What Alamang should keep

Seven shared prompts in one day. No account to play. A visible clock on each prompt. A correction you can accept or edit before it scores. A timeout that scores zero and lets the dive continue. Depth as the way the score is shown. Progress kept on the device. One dive for that day.

Alamang still runs as its own game on a Cloudflare Worker. No ads. No live party. Art stays a placeholder until a later design.

## What stays Krillion's

The name, wordmark, pixel sea, boat, scanlines, and tier creatures. The tier names, the point curve, the day bands, and the blurbs. Their prompts and answer lists. The `catholic` / Catholic Church case is theirs. It only shows how a correction behaves.

Puffer Party, archive, packs, unlimited, friends, accounts, merch, and purchases. The ad stack and the vendor list. Their copy, including the rules lines and the timeout line.

## Gaps

I did not finish all seven prompts, so I did not see the end-of-day band or the percentile.

I did not open a party room, the wardrobe, archive, packs, unlimited, friends, or account.

I did not see a rejected guess on screen. The client has the line "no echo. try again". I did not see a 403 from submit, or `krillion:stats:v1` written.

I did not stopwatch the 25 second answer window or the 3 second preview. Those numbers are the on-screen rules plus the client constants.

I did not find which screen is the "free practice dive" in the privacy policy.

The privacy page says ads might not be showing during onboarding. Ads were showing.
