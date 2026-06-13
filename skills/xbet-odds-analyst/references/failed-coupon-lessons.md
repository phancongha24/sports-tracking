# Failed Coupon Lessons

Use this reference before generating new coupon candidates. These notes are post-result QA feedback, not betting instructions.

## 2026-06-08 QJNGF

Coupon:

- `Mukhiddin Madaminov vs Nikolas Theodorou` - `Draw or Theodorou` @ `1.104`
- `Ekaterina Alexandrova vs Panna Udvardy` - `Alexandrova` @ `1.196`
- `Bianca Andreescu vs Elise Mertens` - `Mertens` @ `1.319`

Result: user reported the coupon failed.

Lessons:

- A technically verified coupon (`saveOk=true`, `couponUsable=true`, returned legs match expected) is not evidence of outcome quality.
- Do not use chess double-chance in many-leg coupons when the edge case is mainly rating gap plus event prestige. Chess double chance still dies if the selected side loses, and a rating gap alone is not enough.
- Do not upgrade tennis R32/early-round favorites on seed/ranking alone, especially during surface changes or grass season. Require recent form, surface form, matchup/H2H, injury/availability notes, and market sanity.
- Treat a player returning by wildcard, protected ranking, injury comeback, or unstable recent form as a material counter-risk even when the opponent is seeded.
- For multi-leg coupons, if any leg is only `rating/seed/ranking + low odds`, cap it at `weak` and exclude it from "safe" coupons unless the user explicitly asks for a forced debug coupon.
- Prefer fewer legs with stronger evidence over 3+ legs that are merely individually plausible. If the user asks for more legs, explain compounded risk and require evidence beyond name value.

Active avoid rules:

- Avoid chess double-chance as a default coupon leg unless there is external form/context beyond rating.
- Avoid tennis favorites in early rounds when the only support is seed/ranking.
- Require `edge-supported` evidence per leg for many-leg coupons: relative strength plus at least one of recent form, matchup, motivation, availability, or market sanity.

## 2026-06-09 J6RXF / Kebumen leg

Coupon included:

- `F45T Angels Semarang (Women) vs Kebumen United (Women)` - `Draw or Kebumen United (Women)` @ `1.13`

Result: user reported the Kebumen leg failed.

Lessons:

- Do not treat low-tier women's futsal double chance as safe from H2H plus market shape alone.
- A prior H2H win and opponent blowout loss are not enough when current roster, table pressure, venue, and recent form are not fully verified.
- For Indonesian WPFL or similarly thin-liquidity futsal markets, require fresh standings/form evidence from official/reputable sources before inclusion; otherwise cap at `weak`.
- Avoid reusing the same event after a failed leg, including alternative markets from that match.

Active avoid additions:

- Exclude `F45T Angels Semarang (Women) vs Kebumen United (Women)` from future coupon candidates in this session.
- Downgrade low-tier futsal women markets to `weak` unless evidence covers relative strength, recent form, motivation, and market sanity.

## 2026-06-09 Esports noisy feed audit

User flagged `Dota 2. Berserk League` as fake/noisy.

Lessons:

- Treat `Berserk League`, repeating short-map feeds, anonymous player/team names, and events with `esports_without_clear_stakes` as likely synthetic/noisy unless independently verified by HLTV, Liquipedia, official tournament pages, or other reputable esport sources.
- Do not include low-clean-score esport rows merely because the rate is attractive.
- For esport coupon legs, prefer major/tier-1 events with official/reputable fixture pages, clear match format, real progression stakes, and team pages/form context.

Active avoid additions:

- Exclude `Berserk League` esport rows by default.
- Exclude esport rows with `cleanScore < 80` unless there is independent external evidence and the user explicitly asks for forced/debug candidates.
