---
name: xbet-odds-analyst
description: Analyze public 1xBet/1xlite odds data from the local sports-tracking Node.js tools for QA, data integrity, market monitoring, and research. Use when Codex needs to crawl all sports/esports or each category, inspect odds/rates, rank events by motivation/market cleanliness/risk, audit "sure win" or high-confidence claims, analyze xbet-odds-filter JSON or CSV, create a non-wagering SaveCoupon compatibility debug payload, verify coupon leg retention, or apply T6MM/Lucky Friday/handicap-total filtering rules. This skill is not for gambling advice, account automation, bet placement, or bypassing anti-bot/account systems.
---

# XBet Odds Analyst

## Purpose

Use the local `sports-tracking` tools to inspect public odds feeds, rank candidate events, and debug market/coupon payload compatibility. Treat this as QA/data-analysis work only.

Do not frame outputs as gambling instructions. Treat "sure win" as a claim to audit, not as a promise to make. Use terms such as "candidate", "shortlist", "sure-win claim audit", "heuristic confidence", "market cleanliness", "coupon debug payload", and "verification result". If the user uses betting language, keep the response analytical and explicitly state that the output is not a guarantee or betting instruction.

## Locate Tooling

When this skill is installed from the exported package, prefer the bundled one-file runtime:

```bash
node scripts/xbet-odds-onefile.js server
node scripts/xbet-odds-onefile.js odds --help
node scripts/xbet-odds-onefile.js analyze --help
```

Command translation for packaged installs:

- `node server.js ...` -> `node scripts/xbet-odds-onefile.js server ...`
- `node scripts/xbet-odds-filter.js ...` -> `node scripts/xbet-odds-onefile.js odds ...`
- `node scripts/xbet-pick-analyzer.js ...` -> `node scripts/xbet-odds-onefile.js analyze ...`

Prefer this repo when present:

```bash
/Users/ha.phan/Documents/phancongha24@git/sports-tracking
```

If the current directory is different, locate the repo by finding:

```bash
scripts/xbet-odds-filter.js
scripts/xbet-pick-analyzer.js
server.js
```

If those split files are not present, stay inside the installed skill directory and use `scripts/xbet-odds-onefile.js`; it contains the server, odds scanner, analyzer, and coupon debug endpoint in one file.

## Standard Workflow

1. Run a fresh scan unless the user explicitly provides a JSON/CSV file or asks to reuse a prior snapshot.
2. Before generating a coupon, check `references/failed-coupon-lessons.md` when present and apply any active avoid rules from prior failed coupons.
3. Start broad: all sports/esports first. Apply safety, promotion, and sport filters after scanning unless the user narrowed the scope.
4. Rank with `scripts/xbet-pick-analyzer.js`; prefer JSON output because it preserves stage, motivation, clean score, and coupon codes.
5. Prefer clear markets: `Double chance`, then verified `Winner/1X2`; treat `Winner incl OT` as coupon-risky unless single-leg verification or UI payload confirms the SaveCoupon mapping.
6. For final shortlists, report snapshot time, window, scanned count, confidence/clean/motivation scores, and why lower-ranked rows were excluded.
7. If the user asks for "sure win", "ăn chắc", "cực safe", or similar, include a `Sure-win claim audit` section for each candidate.
8. If the user asks for evidence or final recommendations, verify the top candidates with official/primary sources where feasible and cite them.
9. If creating a coupon debug code, verify the returned coupon contains all requested legs and `HasRemoveEvents=false`; otherwise mark it unusable and replace the failed leg.
10. Treat event existence, official fixture presence, and low odds as input validation only. They do not prove edge, safety, or relative team/player strength.

## Business Feature Framework

Business features are the common rule layer for product modes such as T6MM, live-lock, or handicap/total research. Do not add new product modes by scattering `if promoMode === ...` checks through the analyzer. Add or edit the feature registry instead.

Registry source after unpacking or in the local split-source workspace:

```bash
scripts/xbet-business-features.js
```

Current feature ids:

- `general`
- `lucky-friday` / `t6mm`
- `handicap-total`
- `live-lock`

Each feature owns:

- `aliases`: user-facing names and CLI aliases.
- `defaults`: odds band, scanner mode, hours, subgame behavior, and event count.
- `marketPattern` / `excludedMarketPattern`: eligibility rules.
- `usesSettlementGate` and `requiresInplay`: flow gates.
- `safetyDefaults` and `ultraSafeRules`: conservative/ultra-safe defaults.
- `tableVariant` and `scoringProfile`: output/scoring behavior.

When adding a new business feature:

1. Unpack the runtime if split sources are absent:
   ```bash
   node scripts/xbet-odds-onefile.js unpack /tmp/xbet-src
   ```
2. Add one `BUSINESS_FEATURES` entry in `scripts/xbet-business-features.js`.
3. Rebuild the one-file runtime:
   ```bash
   node tools/build-xbet-onefile.js /tmp/xbet-src skills/xbet-odds-analyst/scripts/xbet-odds-onefile.js
   ```
4. Verify with `node scripts/xbet-odds-onefile.js analyze --promo-mode <new-id> --help` and one narrow smoke scan.

## Coupon Generation Mode

Use this mode whenever the user asks to `gen coupon`, `tao coupon`, `tao slip`, `gom nhieu leg`, `target rate`, or asks how many safe legs are needed for a desired combined rate.

Inputs to infer or ask for if missing:

- `targetRate`: desired combined decimal odds, e.g. `1.5`.
- `minLegs` / `maxLegs`: desired leg count range. If absent, compute the smallest reasonable leg count that reaches `targetRate`.
- `legOddsBand`: default `1.01..1.30` for "sieu hen"; otherwise use the user's range.
- `couponProfile`: `coupon-stable`, `buffer-handicap`, or `mixed`.
- `timeWindow`: default current time through 16 hours ahead unless the user gives a tighter window.

Leg count heuristic:

- Sort usable legs by risk-adjusted quality first, not by odds.
- Estimate how many legs are needed with `ceil(log(targetRate) / log(medianCandidateOdds))`.
- Then build candidate coupons for nearby counts, e.g. `n-1`, `n`, `n+1`, because combined rate and leg quality trade off.
- Prefer the coupon with the fewest legs that reaches or is close to the target while preserving leg quality.
- If the only way to reach the target requires too many weak legs, say so and return a safer lower-rate coupon plus the riskier target-reaching option.

Coupon profile rules:

- `coupon-stable`: use verified `G8T4`, `G8T6`, `G1T1`, `G1T3`; avoid `G101`, raw, totals, and unverified handicap.
- `buffer-handicap`: allow handicap/asian handicap only when the selection has an explicit cushion such as `+1`, `+1.5`, `+2.5`, or a favorite with positive/forgiving handicap. Send `Kind=3` for `G2` handicap coupon events unless a fresh single-leg verification proves otherwise.
- `mixed`: combine coupon-stable legs and verified buffer-handicap legs. Do not include totals by default.

Coupon construction rules:

- Do not reuse the same `gameId` inside one coupon unless the user explicitly wants correlation testing.
- Avoid strongly correlated legs from the same match, same team, or same market family.
- Keep every leg inside the requested odds band.
- Build the coupon from current odds, not stale conversation data, unless the user explicitly asks to reuse a snapshot.
- For many-leg coupons, apply a real motivation gate before coupon creation: every included leg must have a concrete reason for serious play, not merely low odds.
- Prefer motivation that can be externally verified: official tournament/league schedule, final/semifinal/playoff/qualification stage, promotion/relegation/title/standings pressure, series-deciding game, or major-event context.
- Treat metadata-only motivation as insufficient for large coupons unless the user explicitly accepts that risk. If kept, label it `metadata-only` and do not call the coupon safe.
- Exclude dead-rubber, friendly/warm-up, unclear low-tier, virtual/simulated, generic, or no-source events from many-leg coupons by default.
- Verify with `/api/xbet/coupon?verify=1&summ=100000&cookieMode=auto`.
- If verification removes any leg, identify the removed/suspect leg, replace it, and verify again.

Edge evidence gate:

- Separate technical coupon validity from probabilistic edge. A coupon can be `couponUsable=true` and still fail the edge gate.
- Do not call a leg `plausible` or stronger from fixture existence alone. "The match exists", "official schedule confirms it", and "double chance" are not enough.
- For each leg, gather evidence in these buckets when available:
  - `existence`: official/reputable fixture confirms the event, teams, time, and competition.
  - `relativeStrength`: standings/ranking/table position, ELO/power rating, seed, market consensus, or clear favorite/underdog context.
  - `recentForm`: recent match results, set/map/game trend, or current live score when the user explicitly asks for live.
  - `matchup`: H2H, style matchup, handicap cushion relevance, or sport-specific scoring margin logic.
  - `motivation`: knockout/playoff/final/qualification, promotion/relegation/title pressure, standings pressure, series-decider, or official major-event context.
  - `availability`: lineup, roster, injury, rest, travel, rotation, or suspension notes when the sport makes this material.
  - `marketSanity`: odds band realism, no contradictory nearby markets, no virtual/cyber/noisy low-tier context, no suspicious coupon mapping.
- Edge gate labels:
  - `unsupported`: only existence/fixture/low odds is known, or the event is virtual/cyber/noisy/low-tier without external support.
  - `weak`: existence plus market shape is known, but relative strength and form are missing.
  - `plausible`: at least relative strength plus one of form, matchup, motivation, or marketSanity supports the leg, and no major counter-risk is present.
  - `strong-but-not-certain`: relative strength, recent form, motivation/stage, market sanity, and coupon retention are all supported by official/reputable evidence, with no major availability red flag.
- If a requested `ultra-safe` coupon has no legs that pass at least `plausible`, return `no qualified coupon` or a clearly labeled `forced debug coupon`, not an "ultra-safe" coupon.
- For multi-leg coupons, estimate compounded risk qualitatively. If individual leg confidence is weak or unknown, explicitly say combined risk is not acceptable even if combined odds look attractive.

Coupon conviction and explanation gate:

- Before returning a coupon code, write a short selection thesis: why this exact mix is better than the nearest alternatives for the requested window, rate band, and leg count.
- For every leg, explicitly state the safety case: market shape, buffer amount if handicap, real motivation, evidence quality, clean/mapping stability, and the main way the leg can still fail.
- Include a per-leg `sure-win claim audit` label: `unsupported`, `weak`, `plausible`, or `strong-but-not-certain`. Never call a leg or coupon guaranteed.
- If a coupon is created mainly for SaveCoupon/debug compatibility, say that first and do not let a valid coupon code imply a recommended or safe outcome.
- Include a coupon-level verdict:
  - `strong-but-not-certain`: all legs have stable coupon mapping, strong motivation, no major counter-risk, and mostly official/reputable evidence.
  - `plausible`: coupon is technically clean and legs have reasonable motivation, but one or more legs rely on metadata-only evidence, live volatility, lower-liquidity context, or weaker form data.
  - `weak`: coupon verifies technically but needs too many legs, low odds alone, live/late state, weak motivation, or low-quality evidence.
  - `no qualified coupon`: current scan did not produce enough edge evidence for the user's requested safety level.
- If the user asks whether it is "truly ultra-safe", answer directly with the verdict and the reason. Do not soften a weak coupon as ultra-safe.
- If a coupon is technically usable but not convincingly ultra-safe, return the code only with a clear downgrade note and, when possible, a smaller safer alternative.

Every coupon response must include:

- `couponCode`, combined rate, leg count, and verification result.
- A table of every leg.
- A "Why these legs" column or section explaining the concrete reason for inclusion: market shape, buffer amount, real motivation, clean score, mapping stability, and residual risk.
- A `motivationEvidence` field per leg: `official-source`, `reputable-source`, `external-verified`, or `metadata-only`. Large coupons should not rely on `metadata-only` legs.
- A coupon-level selection thesis, coupon-level verdict, and per-leg counter-risk so the user can judge whether the "ultra-safe" claim is actually supported.
- An explicit `technicalValidity` vs `edgeEvidence` distinction. Technical validity means SaveCoupon/GetCoupon retained the legs; edge evidence means the leg has a defensible probability case.
- A short note on excluded candidates when relevant, especially rate-too-high, coupon-risky mapping, weak motivation, low-tier/noisy context, or correlation.
- A non-guarantee note: coupon is a QA/debug artifact and the analysis is not a promise of outcome.

## Ultra-Safe All-Category Workflow

Use this workflow whenever the user asks for "list keo ultra-safe", "an chac", "sure-ish", "rate cao chac", or asks to mix every sport/category.

1. Scan every available category first. Do not start from a manually chosen sport list unless the user explicitly narrowed the scope.
2. For each category/sport, keep about 20 candidates before global ranking. Use `--by-sport --per-sport-limit 20 --sport-concurrency 4`; raise the per-sport limit only if a category returns too few usable rows or the user asks for a very large final list.
3. Unify the category outputs into one normalized candidate pool:
   - Deduplicate by `gameId + market + pick + code`.
   - Prefer one market per event unless the user explicitly wants market comparison.
   - Preserve `sport`, `league`, `stage`, `timeVN`, `odds`, `code`, `cleanScore`, confidence/motivation fields, and coupon mapping.
   - Exclude events already given in the same conversation when the user asks for a fresh list.
4. Run a risk-adjusted profitability/value audit. This is QA terminology, not financial advice. Remove candidates that are not worth carrying forward because the estimated risk is not justified by the odds band or evidence quality.
5. Build a final shortlist sorted by:
   - market clarity and coupon stability,
   - clean score and metadata quality,
   - motivation/stage strength,
   - relative-strength evidence,
   - recent-form evidence,
   - matchup or handicap-cushion relevance,
   - external evidence support,
   - timing volatility,
   - odds realism inside the requested band.
6. Take the final shortlist to web verification for edge evidence. Prefer official league/tournament/team sources; otherwise use reputable score/data providers. Capture why each event has or lacks motivation and relative strength: final/semifinal/playoff/qualification, standings pressure, promotion/relegation, title race, series decider, recent form, H2H, table/ranking, injury/lineup context, or official schedule context.
7. Return both the final list and a short exclusion summary: how many rows were scanned, how many survived unification, how many were removed as poor value, and the main removal reasons.
8. If the final list has no candidate that passes the edge evidence gate, return that outcome directly. Do not fill the answer with the "least bad" candidates unless the user explicitly asks for forced/debug candidates.

Profitability/value removal rules:

- Remove ultra-low odds that do not also have strong motivation and clean metadata; low return alone is not a safety signal.
- Remove high odds in the requested "safe" band when the market relies on weak evidence, obscure metadata, or low-liquidity category movement.
- Remove raw, virtual, simulated, fantasy, special, youth/reserve/amateur, generic, or unclear event rows.
- Remove friendly/warm-up rows unless the user explicitly accepts motivation risk.
- Remove live micro-markets by default; label live picks as volatile if the user explicitly asks for live.
- Remove totals/handicap/team-total unless the selected rule-set allows those markets.
- Remove coupon-risky mappings when a coupon debug artifact is requested, especially unverified `G101`, line-feed, or raw market codes.
- Downgrade events where external web evidence cannot confirm schedule, stage, teams, or competition context.
- Downgrade events where external evidence confirms only the schedule but not relative strength, form, or motivation. Fixture proof is not edge proof.
- For multi-leg coupons, remove any candidate whose safety case is only "low odds". Low odds without real motivation evidence is a fake-safe candidate.

## Safety Boundaries

This skill is not for gambling operations.

- Do not encourage betting, wagering, "all in", chasing losses, or financial risk taking.
- Do analyze "sure win" claims as part of the workflow. Classify them as `unsupported`, `weak`, `plausible`, or `strong-but-not-certain`.
- Do not present "sure win" as a guaranteed outcome or factual certainty.
- Do not automate account login, real bet placement, deposits, withdrawals, or wager submission.
- Do not reverse engineer or bypass anti-bot, `x-hd`, login, session, account, or device-fingerprint systems.
- Do not use user-provided session cookies or credentials from chat.
- Coupon creation here means a local public SaveCoupon compatibility/debug artifact only. It must not submit money, place a bet, or operate an account.
- When legal, financial, or addiction-risk concerns appear, keep the response factual and recommend not treating the output as financial advice.

## Commands

Fresh all-sports crawl:

```bash
node scripts/xbet-pick-analyzer.js \
  --top 20 \
  --min 1.10 \
  --max 1.70 \
  --hours 16 \
  --sports all \
  --mode all \
  --profile balanced \
  --event-status upcoming \
  --format markdown \
  --out /tmp/xbet-top-picks.md
```

Category-balanced all-sports crawl:

```bash
node scripts/xbet-pick-analyzer.js \
  --by-sport \
  --sports all \
  --mode all \
  --ultra-safe \
  --per-sport-limit 20 \
  --sport-concurrency 4 \
  --top 50 \
  --format json \
  --out /tmp/xbet-by-sport-ultra-safe.json
```

Ultra-safe heuristic:

```bash
node scripts/xbet-pick-analyzer.js \
  --sports all \
  --mode all \
  --ultra-safe \
  --top 20 \
  --format markdown \
  --out /tmp/xbet-ultra-safe.md
```

T6MM / Lucky Friday:

```bash
node scripts/xbet-pick-analyzer.js \
  --sports all \
  --mode all \
  --promo-mode t6mm \
  --ultra-safe \
  --top all \
  --format markdown \
  --out /tmp/xbet-t6mm-ultra-safe.md
```

Handicap/total research:

```bash
node scripts/xbet-pick-analyzer.js \
  --sports all \
  --mode all \
  --promo-mode handicap-total \
  --event-status upcoming \
  --top 50 \
  --format markdown \
  --out /tmp/xbet-handicap-total-picks.md
```

Exact Vietnam time window:

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

Live/in-play exploration:

```bash
node scripts/xbet-odds-filter.js \
  --mode all \
  --profile balanced \
  --sports all \
  --min 1.01 \
  --max 1.25 \
  --event-status both \
  --include-started \
  --started-minutes 120 \
  --live-feed \
  --json \
  --out /tmp/xbet-live.json
```

Label live picks as volatile. Do not combine live micro-markets into "safe" recommendations without explicit user request.

Live-lock / nearly-decided mode:

Use this when the user asks for live legs that look "pretty sure", "da nga ngu", "sap xong", "rate sieu thap live", or wants to collect in-play events that are already heavily decided instead of upcoming events.

```bash
node scripts/xbet-pick-analyzer.js \
  --sports all \
  --mode all \
  --promo-mode live-lock \
  --top 50 \
  --format json \
  --out /tmp/xbet-live-lock.json
```

Live-lock defaults:

- Scans `event-status=inplay` with realtime line-feed.
- Defaults to odds `1.001..1.35`; widen with `--max` only when the user explicitly accepts more market noise.
- Allows winner, double chance, winner incl OT, handicap, and totals because the goal is live-state lock detection, not T6MM eligibility.
- Ranks by `liveLockScore`, odds compression, elapsed/live state, market clarity, clean score, and risk penalty.
- Keeps `liveState` and `lockEvidence` in JSON/CSV/markdown output so a low odds row does not masquerade as proof.

Live-lock evidence gate:

- Local odds are only a market signal. They do not prove the score state.
- Before returning a live-lock candidate as usable, verify the live score/current state from an independent realtime source when feasible: official scoreboard, league site, Flashscore/Sofascore/ESPN, HLTV/Liquipedia for esports, or another reputable live tracker.
- Require one of these to label a candidate `plausible`:
  - The selected side is far ahead late in the event.
  - The remaining time/sets/maps make comeback mathematically or practically difficult.
  - The market is a forgiving cushion and the score/state supports the cushion.
- Label as `market-only` when external live score cannot be verified quickly. Do not put `market-only` legs into a coupon described as safe.
- Exclude virtual/cyber/simulated, no-source micro leagues, raw markets, and no-draw double chance (`G8T5`) unless the user explicitly asks for forced debug output.
- Re-check immediately before coupon generation because live odds can disappear, lock, or flip within seconds.

## Football Stat Subgame Flow

Use this flow when the user asks about corners, cards, yellow cards, offsides, stat markets, or says `Raw market G...` needs decoding.

Endpoint example:

```bash
curl 'http://localhost:4173/api/xbet/odds?mode=all&profile=raw&sports=football&min=1.01&max=2.2&eventStatus=upcoming&liveFeed=1&champRegex=World%20Cup&includeSubgames=1&subgameTags=corners,yellow-cards,offsides&subgameLimit=12&count=100'
```

Group catalog dump:

```bash
curl 'http://localhost:4173/api/xbet/odds?mode=all&profile=raw&sports=football&eventStatus=upcoming&liveFeed=1&champRegex=World%20Cup&includeSubgames=1&subgameTags=all&subgameLimit=0&eventCount=5000&dumpGroups=1&count=200'
```

Rules:

- `includeSubgames=1` follows football sub-games returned in `SG`.
- Use `subgameTags=corners,yellow-cards,offsides` for normal corners/cards/offside work.
- Use `subgameTags=all&subgameLimit=0` only for exhaustive market-mapping QA because it is slower and noisier.
- In subgame rows, `gameId` is the subgame id required to fetch that exact market group; `parentGameId` links back to the main match.
- Read `subMarket` and `period` before interpreting `G17/G15/G62`: the same group codes can mean match total, corners total, team corners, yellow-card total, team cards, offsides total, or team offsides depending on `TG/PN`.
- Do not treat corners/cards/offsides/stat handicap or total markets as T6MM/Lucky Friday eligible. Winner-style corners/cards/offsides markets, such as `Corners Winner/1X2`, `Yellow Cards Double chance`, or `Offsides Double chance`, may be included in T6MM only when the user explicitly wants the T6MM flow and the market shape is not handicap/total/raw.
- For behavior-heavy stat markets, require extra evidence before a confident coupon: corners need territory/crossing/shot-pressure profile; cards need referee, foul rate, rivalry, and game state; offsides need high defensive line, runner timing, and direct-pass tendency. South American/CONMEBOL context is a signal to investigate card/foul tendency, not standalone proof.
- If the task is to find every unknown/raw group, use `dumpGroups=1` with `subgameTags=all&subgameLimit=0`. Inspect `marketGroups[]`, especially rows where `raw=true`, and preserve `groupCode`, `selectionTypes`, `params`, `samples`, `subMarket`, `period`, `gameId`, and `parentGameId`.
- If a row still says `Raw <subMarket> market G...`, report it as an unmapped stat code and include `gameId`, `parentGameId`, `code`, `subMarket`, and `period` so the decoder can be extended.

## Coupon Debug Flow

Use coupon debug only for local QA of SaveCoupon-compatible payloads.

Endpoint:

```bash
curl -sS -X POST 'http://localhost:4173/api/xbet/coupon?verify=1&summ=100000&cookieMode=auto' \
  -H 'content-type: application/json' \
  --data '{"saveCouponPayload":{"notWait":true,"CheckCf":1,"partner":1,"AntiExpressCoef":6,"Summ":100000,"Events":[{"GameId":727055161,"Type":4,"Coef":1.124,"Param":0,"PV":null,"PlayerId":0,"Kind":3,"InstrumentId":0,"Seconds":0,"Price":0,"Expired":0,"PlayersDuel":[]}],"Vid":0}}'
```

Return only:

- `couponCode`
- `saveOk`
- `couponUsable`
- expected vs returned event count
- `HasRemoveEvents`
- short event summary
- why this exact coupon was selected over nearby alternatives
- why each leg was selected, including evidence quality and counter-risk
- coupon-level verdict on the "ultra-safe" claim

Do not paste the full response unless the user asks for debugging details.

Verification rule:

- Usable only if `saveOk=true`, `couponUsable=true`, `expectedEventCount == returnedEventCount`, and `HasRemoveEvents=false`.
- If the web UI later removes a leg, mark that market mapping as suspect and replace it with a verified `Double chance G8` leg where possible.

## Coupon Mapping Notes

Prefer `Double chance G8` for coupon debug because it has been most stable in UI apply tests.

- `G8T4` double chance home-or-draw -> `Kind=3`, `Type=4`, `Param=0`.
- `G8T6` double chance draw-or-away -> `Kind=3`, `Type=6`, `Param=0`.
- `G1T1` winner home -> usually `Kind=3`, `Type=1`, `Param=0`.
- `G1T3` winner away -> usually `Kind=3`, `Type=3`, `Param=0`.
- `G2T7P...` and `G2T8P...` handicap selections have verified better as `Kind=3`, `Type=7/8`, `Param=<line>` in public coupon debug. Treat `Kind=2` for `G2` as suspect because it can SaveCoupon but disappear in GetCoupon.
- `G101T401` and `G101T402` are line-feed market codes for `Winner incl OT`; do not assume `Type=401/402` is the correct SaveCoupon type. Treat these as coupon-risky until a single-leg SaveCoupon/GetCoupon/UI apply check confirms the mapping.

Default fields when source does not specify otherwise:

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

## Ranking Rules

Select the rule-set first:

- If the user says `T6MM`, `thứ 6 may mắn`, or `Lucky Friday`, use `--promo-mode t6mm`.
- If the user asks for "cực safe", "sure-ish", "sure win", "ăn chắc", "khả năng fail thấp", or similar, add `--ultra-safe` and include a `Sure-win claim audit`.
- If the user asks to mix every category or says each node should crawl one sport, add `--by-sport --per-sport-limit 20 --sport-concurrency 4`.
- If the user asks for `ultra-safe`, start with the Ultra-Safe All-Category Workflow: per-category scan around 20 candidates, unify, remove poor value/profitability candidates, then web-verify edge evidence before finalizing.
- If the user asks for a coupon, use Coupon Generation Mode, treat it as a debug artifact, build `saveCouponPayload.Events`, call `/api/xbet/coupon?verify=1&summ=100000&cookieMode=auto`, report verification status, and explain every leg.
- If the user asks for live nearly-decided picks, live "pretty sure" legs, or already-started games that look locked, use `--promo-mode live-lock` first, then independently verify current score/state before returning or couponing any leg.
- If the user asks for many-leg coupon safety, require edge evidence per leg before adding it to the coupon; otherwise return fewer legs, `no qualified coupon`, or a clearly labeled forced/debug candidate list.
- If the user says handicap/total research, use `--promo-mode handicap-total`.
- Otherwise use `--promo-mode general`.

Prefer:

- Final, semifinal, playoff, qualification, cup, world championship, major, or in-season cup stages.
- Named teams and named leagues with clean metadata.
- `Double chance` for coupon-stable shortlists.
- Odds in the requested band; if unspecified, use `1.10..1.70`, or lower for ultra-safe scans.

T6MM defaults:

- Odds default to `1.40..1.70` unless the user states another range.
- Use a broad scan by default. Do not force `hours=2` or `settleWithinMinutes=120` unless the user asks for a relative from-now settlement window.
- When the user gives a promo cutoff/end time such as `09:33`, use `--settle-before 09:33` or API `settleBefore=09:33`. This keeps the broad scan but removes long-duration events whose estimated finish exceeds the cutoff.
- For the server API, use `promoMode=t6mm`; it defaults to broad `hours=16` plus corners/yellow-card/offsides subgame scanning, with no settlement gate unless `settleBefore`, `settleWithinMinutes`, or `maxStartMinutes` is provided.
- Exclude handicap, Asian handicap, total, team-total, Asian total, and raw markets as ineligible, not just risky.
- Keep clear winner, double chance, verified winner-including-overtime, qualification-style markets, and winner-style corners/cards/offsides submarkets only. Corners/cards/offsides totals and handicaps remain ineligible.
- When a cutoff gate is provided, require the analyzer settlement column/gate to fit the requested T6MM window. Do not include long-duration candidates that are likely to finish after the promo cutoff even if they start before it.

Ultra-safe defaults:

- General mode defaults to `1.01..1.35` unless the user states another range.
- T6MM mode defaults to `1.40..1.55` unless the user states another range.
- Require higher confidence, motivation, relative-strength evidence, recent-form or matchup evidence, and clean score.
- Remove total/raw/niche/lower-tier rows aggressively.
- Exclude handicap in ultra-safe mode unless the rule-set is `handicap-total`.
- If the requested time window is too short and no candidate passes the edge gate, say that directly instead of filling the gap with the least suspicious rows.

Downgrade or exclude:

- Raw markets, special/fantasy/virtual/simulated/cyber markets.
- Generic events such as `Home vs Away` or `1st teams vs 2nd teams`.
- Youth, reserve, academy, amateur, or unclear lower-tier events.
- Warm-ups, friendlies, and live micro-markets unless explicitly requested.
- Low-liquidity niche sports when they outrank mainstream events only because of metadata.
- Any market whose coupon debug code passes SaveCoupon but loses legs in GetCoupon or UI apply.

## Sure-Win Claim Audit

When the user asks whether something is "sure win" or "ăn chắc", include this audit instead of simply refusing the phrase.

Use these labels:

- `unsupported`: metadata is weak, noisy, low-tier, live-volatility is high, or no external evidence.
- `weak`: odds are low or market shape is clean, but motivation, relative strength, form, or matchup evidence is incomplete.
- `plausible`: clean market plus relative-strength evidence and at least one of recent form, matchup/handicap cushion logic, motivation, or marketSanity support the leg.
- `strong-but-not-certain`: high clean score, stable market, verified coupon retention if relevant, and official/reputable evidence supports relative strength, recent form, motivation/stage, and no major availability red flag.

Audit factors:

- Market shape: `Double chance` is cleaner than totals/handicap/raw markets for this workflow.
- Motivation: final, semifinal, playoff, qualification, cup, major, or championship stage.
- Real motivation: knockout/final/playoff, qualification/promotion/relegation/title pressure, standings pressure, series-deciding game, or official major event context. Low odds alone is not motivation.
- Relative strength: table/ranking, seed, rating, market consensus, or clearly documented favorite/underdog context. Fixture existence alone is not relative strength.
- Recent form and matchup: recent results, H2H, scoring margin logic, live score state if explicitly requested, or sport-specific reason why the selected cushion matters.
- Odds realism: low odds can still be noisy; ultra-low return is not automatically safer.
- Data quality: named teams, recognized competition, clean score, confidence score.
- Timing: imminent/live events are more volatile.
- Coupon integrity: event count must survive SaveCoupon/GetCoupon/UI apply if a coupon debug code is requested.
- Counter-risk: injuries/news unavailable, rotation, low-liquidity sport, friendly status, lower-tier league, or suspicious mapping.

Never output a binary "sure win: yes". Output an audit label plus residual risk.

## Evidence

Use the analyzer's `motivationEvidence` first. For "why clean", "motivation", "evidence", or final shortlist requests, verify top candidates with sources in this order:

1. Official league/tournament/team pages.
2. Reputable sports data providers or news.
3. 1xBet metadata only when no external evidence is available; explicitly label it as metadata-only inference.

For generated coupons, especially many-leg coupons, verify motivation for every included leg when feasible. If a leg cannot be externally verified, either exclude it or label it `metadata-only` with a clear residual risk note.

Evidence minimums:

- `existence-only`: official/reputable schedule confirms the event but no strength/form/matchup edge is verified. This cannot support `plausible`.
- `edge-supported`: at least relative strength plus one of form, matchup, motivation, availability, or marketSanity is verified. This can support `plausible`.
- `edge-strong`: relative strength, form, motivation/stage, marketSanity, and no major availability red flag are verified. This can support `strong-but-not-certain`.
- When only `existence-only` evidence is available, output `no qualified coupon` for ultra-safe requests unless the user explicitly asks for a forced debug coupon.

## Output Style

Use concise tables:

- Time
- Category
- Event
- Market/pick
- Odds
- Motivation evidence
- Risk note
- Sure-win claim audit label when requested
- Coupon verification if applicable

Close with a short non-gambling disclaimer: the result is a data-analysis shortlist, not a guarantee or instruction to wager.
