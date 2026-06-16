# Claude Code Export: XBet Odds Analyst

## Mission

Analyze public 1xBet/1xlite odds data from the exported `sports-tracking` skill package or local Node.js tools for QA, data integrity, market monitoring, and research. This workflow is not for gambling advice or bet placement.

Do not encourage betting, wagering, "all in", or financial risk. Treat "sure win" as a claim to audit, not a guarantee to assert. Coupon generation is only a local SaveCoupon compatibility/debug artifact; it must not submit money, operate an account, or place a bet.

## Repo

For exported package installs, prefer the bundled one-file runtime:

```bash
node skills/xbet-odds-analyst/scripts/xbet-odds-onefile.js server
node skills/xbet-odds-analyst/scripts/xbet-odds-onefile.js odds --help
node skills/xbet-odds-analyst/scripts/xbet-odds-onefile.js analyze --help
```

Command translation:

- `node server.js ...` -> `node skills/xbet-odds-analyst/scripts/xbet-odds-onefile.js server ...`
- `node scripts/xbet-odds-filter.js ...` -> `node skills/xbet-odds-analyst/scripts/xbet-odds-onefile.js odds ...`
- `node scripts/xbet-pick-analyzer.js ...` -> `node skills/xbet-odds-analyst/scripts/xbet-odds-onefile.js analyze ...`

When available, the original local split-source repo is:

```bash
/Users/ha.phan/Documents/phancongha24@git/sports-tracking
```

Expected files:

```bash
scripts/xbet-odds-filter.js
scripts/xbet-pick-analyzer.js
server.js
```

## Default Analysis Flow

1. Check current time with `date '+%Y-%m-%d %H:%M:%S %Z'`.
2. Run a fresh scan; use `--by-sport` for all-sports/all-esports requests.
3. Rank with `scripts/xbet-pick-analyzer.js`.
4. Prefer `Double chance` markets for coupon debug stability.
5. If the user asks for "sure win", "ăn chắc", or "cực safe", include a sure-win claim audit label.
6. Downgrade raw/special/virtual/youth/reserve/friendly/live micro-markets.
7. Verify final shortlist evidence with official/primary sources when the user asks for motivation or final picks.
8. Before returning final picks or producing coupon debug codes, run realtime preflight on the exact final legs: fresh scan with `--live-feed`, match `gameId + code`, check market shape, odds drift, status, and window.
9. If producing coupon debug codes, verify full leg retention before reporting a code.

## Realtime Preflight

Realtime preflight is mandatory before final shortlists and coupons.

- Re-fetch the public odds feed for the selected window using the same mode/profile/sports and `--live-feed`.
- Match each final leg by `gameId + code`; if needed, rematch by event, market, pick, param, and start time and label it `id-rematched`.
- Remove or replace legs that disappeared, started in an upcoming-only flow, locked, shifted outside the requested window, or changed market shape.
- Check odds drift. Default tolerance is `<= 10%` relative drift or `<= 0.08` absolute decimal odds drift, whichever is more permissive.
- Record `checkedAt`, `status`, `originalOdds`, `currentOdds`, `eventStatus`, `startTime`, and `reason`.

Do not confuse:

- `technicalValidity`: SaveCoupon/GetCoupon retained the submitted legs.
- `realtimePreflight`: current odds/status still match immediately before output.
- `edgeEvidence`: external evidence supports relative strength, motivation, form, matchup, or market sanity.

If preflight cannot be run, label the output `realtime-unverified` and do not call it `plausible`, `strong-but-not-certain`, or `ultra-safe`.

## Business Feature Framework

Business features are product modes above the scanner. Existing feature ids are `general`, `lucky-friday`/`t6mm`, `handicap-total`, and `live-lock`.

When asked to add a new mode like T6MM, use the registry rather than scattered conditionals:

```text
scripts/xbet-business-features.js
```

Each feature should define aliases, scanner defaults, coupon defaults, market eligibility, settlement/in-play gates, safety defaults, ultra-safe rules, table variant, and scoring profile. T6MM/Lucky Friday coupon mode requires exactly 3 legs; one returned row is only a candidate, not a complete T6MM coupon. If only the one-file runtime exists, first run:

```bash
node skills/xbet-odds-analyst/scripts/xbet-odds-onefile.js unpack /tmp/xbet-src
node tools/build-xbet-onefile.js /tmp/xbet-src skills/xbet-odds-analyst/scripts/xbet-odds-onefile.js
```

## Ultra-Safe All-Category Flow

When the user asks for "ultra-safe", "an chac", "sure-ish", or every category:

1. Scan every category first; do not hand-pick sports unless the user narrowed scope.
2. Use `--by-sport --per-sport-limit 20 --sport-concurrency 4` to keep about 20 candidates per category before global ranking.
3. Unify and dedupe by `gameId + market + pick + code`; preserve sport, league, stage, time, odds, clean score, confidence/motivation, and coupon mapping.
4. Prefer one strongest market per event unless the user asks for comparison.
5. Remove poor value/profitability candidates. This is a risk-adjusted QA audit term, not financial advice.
6. Web-verify the final shortlist for motivation: official schedule/stage, playoff/qualification/title/relegation context, standings pressure, series decider, or recent form.
7. Return the sorted final list plus a short exclusion summary.

Remove as poor value/profitability:

- Low odds without strong motivation and clean metadata.
- Raw, virtual, simulated, fantasy, special, generic, youth/reserve/amateur, or unclear rows.
- Friendlies/warm-ups unless explicitly accepted.
- Live micro-markets unless explicitly requested.
- Totals/handicap/team-total unless the selected mode allows them.
- Coupon-risky mappings when coupon debug is requested.
- Rows whose schedule/stage/team context cannot be externally verified.

## Commands

All-sports balanced:

```bash
node scripts/xbet-pick-analyzer.js \
  --by-sport \
  --sports all \
  --mode all \
  --ultra-safe \
  --min 1.10 \
  --max 1.70 \
  --hours 12 \
  --event-status upcoming \
  --per-sport-limit 20 \
  --sport-concurrency 4 \
  --top 50 \
  --format json \
  --out /tmp/xbet-top.json
```

Exact Vietnam window:

```bash
node scripts/xbet-odds-filter.js \
  --mode all \
  --profile balanced \
  --sports all \
  --min 1.10 \
  --max 1.50 \
  --from 2026-06-07T10:45 \
  --to 2026-06-07T14:00 \
  --event-status window \
  --live-feed \
  --exclude-no-draw \
  --limit 12000 \
  --json \
  --out /tmp/xbet-window.json

node scripts/xbet-pick-analyzer.js \
  --input /tmp/xbet-window.json \
  --top all \
  --ultra-safe \
  --format json \
  --out /tmp/xbet-window-ranked.json
```

## Coupon Debug Contract

Use the local endpoint only:

## Coupon Generation Mode

When the user asks to generate a coupon/slip, infer:

- `targetRate`, for example 1.5.
- `minLegs` / `maxLegs`, if stated.
- `legOddsBand`, default 1.01..1.30 for "sieu hen".
- profile: `coupon-stable`, `buffer-handicap`, or `mixed`.

For T6MM/Lucky Friday coupons, force exactly 3 legs. Do not use the generic target-rate leg-count heuristic to produce 2 or 4+ T6MM legs. If the user asks for one "rate", label it as a single candidate only.

If target rate is given but leg count is not, estimate count with `ceil(log(targetRate) / log(medianCandidateOdds))` and test nearby counts. Prefer the fewest legs that reaches or comes close to target without adding weak candidates.

Profile rules:

- `coupon-stable`: use verified `G8T4`, `G8T6`, `G1T1`, `G1T3`.
- `buffer-handicap`: allow handicap only with explicit cushion such as `+1`, `+1.5`, `+2.5`; for `G2` handicap coupon payloads use `Kind=3`, `Type=7/8`, `Param=<line>` unless fresh verification proves otherwise.
- `mixed`: combine stable legs and verified buffer-handicap legs; avoid totals by default.

Do not reuse the same `gameId` inside one coupon unless the user explicitly wants correlation testing. Run realtime preflight on the exact final leg set before building `saveCouponPayload.Events`. Verify with `/api/xbet/coupon?verify=1&summ=100000&cookieMode=auto`; if a leg is removed, replace it, run preflight again, and verify again.

For many-leg coupons, apply a real motivation gate before creation: every included leg needs a concrete reason for serious play, not merely low odds. Valid motivation includes official final/semifinal/playoff/qualification stage, promotion/relegation/title/standings pressure, series-deciding game, or major-event context. Exclude dead-rubber, friendly/warm-up, unclear low-tier, virtual/simulated, generic, or no-source events by default.

Every coupon response must include coupon code, combined rate, leg count, realtime preflight summary, coupon verification result, a table of every leg, and a concrete "why selected" explanation for each leg covering market shape, buffer, real motivation, clean score or mapping stability, and residual risk. Include `motivationEvidence` per leg: `official-source`, `reputable-source`, `external-verified`, or `metadata-only`. Large coupons should not rely on `metadata-only` legs unless the user explicitly accepts that risk.

Before returning a coupon code, include a short selection thesis: why this exact mix is better than nearby alternatives for the requested window, rate band, and leg count. For every leg, state the safety case, evidence quality, and main way it can still fail. Include a per-leg sure-win claim audit label and a coupon-level verdict:

- `strong-but-not-certain`: all legs have stable coupon mapping, strong motivation, no major counter-risk, and mostly official/reputable evidence.
- `plausible`: technically clean and reasonably motivated, but one or more legs rely on metadata-only evidence, live volatility, lower-liquidity context, or weaker form data.
- `weak`: technically usable but needs too many legs, low odds alone, live/late state, weak motivation, or low-quality evidence.

If the user asks whether the coupon is truly ultra-safe, answer directly with this verdict. Do not soften a weak coupon as ultra-safe; return a safer smaller alternative when possible.

```bash
curl -sS -X POST 'http://localhost:4173/api/xbet/coupon?verify=1&summ=100000&cookieMode=auto' \
  -H 'content-type: application/json' \
  --data '{"saveCouponPayload":{"notWait":true,"CheckCf":1,"partner":1,"AntiExpressCoef":6,"Summ":100000,"Events":[{"GameId":727055161,"Type":4,"Coef":1.124,"Param":0,"PV":null,"PlayerId":0,"Kind":3,"InstrumentId":0,"Seconds":0,"Price":0,"Expired":0,"PlayersDuel":[]}],"Vid":0}}'
```

Report a coupon code only if:

- realtime preflight passed for the exact submitted legs immediately before SaveCoupon
- `saveOk=true`
- `couponUsable=true`
- `expectedEventCount == returnedEventCount`
- `HasRemoveEvents=false`

If any check fails, say the coupon debug artifact is unusable and identify the removed/suspect leg.

## Mapping

- `G8T4`: `Kind=3`, `Type=4`, home-or-draw.
- `G8T6`: `Kind=3`, `Type=6`, draw-or-away.
- `G1T1`: usually `Kind=3`, `Type=1`.
- `G1T3`: usually `Kind=3`, `Type=3`.
- `G2T7P.../G2T8P...`: handicap; use `Kind=3`, `Type=7/8`, `Param=<line>` after verification. `Kind=2` can SaveCoupon but disappear in GetCoupon.
- `G101T401/G101T402`: line-feed winner-including-overtime codes; do not assume SaveCoupon `Type=401/402` unless verified.

Default event fields:

```json
{
  "Param": 0,
  "PV": null,
  "PlayerId": 0,
  "InstrumentId": 0,
  "Seconds": 0,
  "Price": 0,
  "Expired": 0,
  "PlayersDuel": []
}
```

## Output

Keep output concise. Include snapshot, window, scanned count, realtime preflight status, table of candidates, coupon verification if applicable, and a sure-win claim audit when requested. Separate `technicalValidity`, `realtimePreflight`, and `edgeEvidence`. Use labels `unsupported`, `weak`, `plausible`, and `strong-but-not-certain`; never output a binary guarantee. Add a short note that this is data analysis only, not a guarantee or betting instruction.
