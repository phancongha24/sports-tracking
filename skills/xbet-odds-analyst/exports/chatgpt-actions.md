# ChatGPT Actions Setup: XBet Odds Analyst

This guide wires ChatGPT Custom GPT Actions to the local `sports-tracking`
server. The workflow is for public odds QA, data integrity checks, market
monitoring, and SaveCoupon compatibility debugging only. It is not gambling
advice, account automation, bet placement, deposit/withdrawal automation, or
anti-bot bypass work.

## 1. Run The Local Server

From this repo:

```bash
node skills/xbet-odds-analyst/scripts/xbet-odds-onefile.js server
```

Default local URL:

```text
http://localhost:4173
```

Smoke check:

```bash
curl -sS 'http://localhost:4173/api/xbet/status' | jq
```

## 2. Expose An HTTPS URL For ChatGPT

ChatGPT Actions cannot call `localhost` directly. Put an HTTPS tunnel or deployed
wrapper in front of the local server.

Examples:

```bash
cloudflared tunnel --url http://localhost:4173
```

or:

```bash
ngrok http 4173
```

Copy the generated HTTPS base URL, for example:

```text
https://example-tunnel.trycloudflare.com
```

## 3. Import The OpenAPI Schema

Open this file:

```text
skills/xbet-odds-analyst/exports/chatgpt-actions.openapi.yaml
```

Replace:

```text
https://YOUR_PUBLIC_BASE_URL
```

with your tunnel/deployed HTTPS base URL.

Then paste the updated YAML into:

```text
Custom GPT -> Configure -> Actions -> Create new action -> Import from schema
```

Authentication:

```text
None
```

The local server does not require account credentials. Do not paste or store
1xBet account cookies, sessions, credentials, or device headers in the action.

## 4. Custom GPT Instructions

Paste this into the Custom GPT instructions together with `chatgpt.md`:

```text
Use the XBet Odds Analyst Actions for public odds QA only.

Intent routing:
- If the user says "t6mm", "thứ 6 may mắn", or "lucky friday":
  call scanXbetOdds with promoMode=t6mm, sports=all, mode=all,
  includeSubgames=true, subgameTags=corners,yellow-cards,offsides,
  min/max from the user or default 1.4..1.7, and any settleBefore or
  settleWithinMinutes gate the user gives.
- If the user says "live-lock", "đang live", "ngã ngũ", or "pretty sure live":
  call scanXbetOdds with promoMode=live-lock, eventStatus=inplay,
  includeStarted=true, liveFeed=true, and the user's odds range.
- If the user asks for "tạo coupon", "coupon", "slip", or "mã":
  first select candidate legs, run a fresh scan as realtime preflight for the
  exact final legs, then call createVerifiedXbetCoupon with verify=true and
  cookieMode=auto.
- If the user asks "payload", "debug payload", or "mapping":
  call buildXbetCouponDraft instead of createVerifiedXbetCoupon.
- If no scan has happened in the current session, call getXbetActionStatus
  first, then scanXbetOdds before creating any coupon.

Coupon rules:
- T6MM coupon mode requires exactly 3 legs.
- Maximum one public coupon debug payload should contain 25 legs.
- Prefer stable mappings: G8T4, G8T6, G1T1, G1T3.
- For G2 handicap mappings use Kind=3, Type=7/8, Param=<line>.
- Default PlayersDuel must be [].
- A coupon is usable only if saveOk=true, couponUsable=true,
  expectedEventCount equals returnedEventCount, and HasRemoveEvents=false.
- Coupon verification alone is not enough. Immediately before creating a
  coupon, run realtime preflight with scanXbetOdds: match each leg by
  gameId+code, confirm market shape/status/window, and reject or replace legs
  that disappeared, started in an upcoming-only flow, locked, or drifted beyond
  tolerance.

Analysis rules:
- Separate technicalValidity, realtimePreflight, and edgeEvidence.
- Never call a candidate guaranteed or a sure win.
- Use labels: unsupported, weak, plausible, strong-but-not-certain.
- Explain why each selected leg was chosen and the main counter-risk.
- Do not encourage betting, all-in, chasing losses, or financial risk.
- Do not automate account login, real bet placement, deposits, withdrawals,
  account operations, or anti-bot/session/header bypass.
```

## 5. Example Calls

T6MM scan:

```http
GET /api/xbet/odds?promoMode=t6mm&sports=all&mode=all&min=1.4&max=1.7&includeSubgames=1&subgameTags=corners,yellow-cards,offsides&count=100
```

Live-lock scan:

```http
GET /api/xbet/odds?promoMode=live-lock&eventStatus=inplay&includeStarted=1&liveFeed=1&min=1.001&max=1.35&count=100
```

Coupon debug from selected legs:

```http
POST /api/xbet/coupon?verify=1&summ=100000&cookieMode=auto
content-type: application/json

{
  "saveCouponPayload": {
    "notWait": true,
    "CheckCf": 1,
    "partner": 1,
    "AntiExpressCoef": 6,
    "Summ": 100000,
    "Events": [
      {
        "GameId": 727055161,
        "Type": 4,
        "Coef": 1.124,
        "Param": 0,
        "PV": null,
        "PlayerId": 0,
        "Kind": 3,
        "InstrumentId": 0,
        "Seconds": 0,
        "Price": 0,
        "Expired": 0,
        "PlayersDuel": []
      }
    ],
    "Vid": 0
  }
}
```

## 6. Expected Response Discipline

When ChatGPT returns a coupon, it should include:

- `couponCode`
- combined rate
- leg count
- realtime preflight summary
- verification result
- per-leg reason and counter-risk
- `technicalValidity` vs `realtimePreflight` vs `edgeEvidence`
- coupon-level verdict

The response should explicitly state that this is a QA/debug artifact and not a
promise of outcome.
