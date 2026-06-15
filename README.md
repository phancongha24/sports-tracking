# XBet Odds Analyst Skill Package

Installable skill package for Codex and Claude Code.

This package is for QA, public odds-feed analysis, market integrity checks, and SaveCoupon compatibility debugging. It is not gambling advice, account automation, bet placement, deposit/withdrawal automation, or anti-bot bypass work.

## What Is Included

- `skills/xbet-odds-analyst/SKILL.md`: the main Codex/Claude skill.
- `skills/xbet-odds-analyst/scripts/xbet-odds-onefile.js`: one-file runtime containing the local server, odds scanner, analyzer, and coupon debug API.
- `skills/xbet-odds-analyst/references/failed-coupon-lessons.md`: QA lessons and avoid rules.
- `skills/xbet-odds-analyst/exports/chatgpt.md`: prompt export for ChatGPT projects.
- `skills/xbet-odds-analyst/exports/chatgpt-actions.openapi.yaml`: OpenAPI schema for ChatGPT Custom GPT Actions.
- `skills/xbet-odds-analyst/exports/chatgpt-actions.md`: setup guide for ChatGPT Actions, HTTPS tunnel, and intent routing.
- `skills/xbet-odds-analyst/exports/claude-code.md`: prompt export for Claude Code.
- `tools/build-xbet-onefile.js`: rebuilds the one-file runtime from an unpacked or local split-source tree.

The split local source files (`server.js`, `scripts/xbet-odds-filter.js`, `scripts/xbet-pick-analyzer.js`) are intentionally not required by the installable package. Use the bundled one-file runtime.

## Install For Codex

```bash
./install-codex.sh
```

This copies the skill to:

```text
~/.codex/skills/xbet-odds-analyst
```

## Install For Claude Code

```bash
./install-claude.sh
```

This copies the skill to:

```text
~/.claude/skills/xbet-odds-analyst
```

## Runtime Commands

From this repo:

```bash
node skills/xbet-odds-analyst/scripts/xbet-odds-onefile.js server
node skills/xbet-odds-analyst/scripts/xbet-odds-onefile.js odds --help
node skills/xbet-odds-analyst/scripts/xbet-odds-onefile.js analyze --help
```

From inside an installed skill folder:

```bash
node scripts/xbet-odds-onefile.js server
node scripts/xbet-odds-onefile.js odds --help
node scripts/xbet-odds-onefile.js analyze --help
```

## Business Feature Framework

Business features are the reusable rule layer above raw odds scanning. Existing features include:

- `general`: normal shortlist mode.
- `lucky-friday` / `t6mm`: T6MM rules, exactly 3-leg coupon shape, settlement gate, winner/double-chance eligibility, and corners/cards/offsides winner-style support.
- `handicap-total`: handicap/total research mode.
- `live-lock`: in-play nearly-decided market mode.

The extension point is:

```text
scripts/xbet-business-features.js
```

Because the package ships a single runtime file, develop new features with this flow:

```bash
node skills/xbet-odds-analyst/scripts/xbet-odds-onefile.js unpack /tmp/xbet-src
# edit /tmp/xbet-src/scripts/xbet-business-features.js
node tools/build-xbet-onefile.js /tmp/xbet-src skills/xbet-odds-analyst/scripts/xbet-odds-onefile.js
```

To develop from this local workspace instead of an unpacked source tree:

```bash
node tools/build-xbet-onefile.js . skills/xbet-odds-analyst/scripts/xbet-odds-onefile.js
```

Add a new feature by adding one entry to `BUSINESS_FEATURES` with:

- `id`, `label`, and `aliases`
- `defaults` for odds range, scan mode, subgames, hours, and event count
- `couponDefaults` for fixed coupon shape, such as exact leg count
- `marketPattern` and optional `excludedMarketPattern`
- `usesSettlementGate` / `requiresInplay` when needed
- `safetyDefaults` and `ultraSafeRules`
- `tableVariant` and `scoringProfile`

## ChatGPT / Claude Prompt Exports

Use these files when a platform does not support local skill folders directly:

```text
skills/xbet-odds-analyst/exports/chatgpt.md
skills/xbet-odds-analyst/exports/chatgpt-actions.md
skills/xbet-odds-analyst/exports/chatgpt-actions.openapi.yaml
skills/xbet-odds-analyst/exports/claude-code.md
```

For ChatGPT Custom GPT Actions:

1. Run the local server:
   ```bash
   node skills/xbet-odds-analyst/scripts/xbet-odds-onefile.js server
   ```
2. Expose it through an HTTPS tunnel or deployed wrapper.
3. Replace `https://YOUR_PUBLIC_BASE_URL` in `chatgpt-actions.openapi.yaml`.
4. Import the updated schema into `Custom GPT -> Actions`.

The action schema maps common intents to endpoints:

- `t6mm` / `Lucky Friday` -> `GET /api/xbet/odds?promoMode=t6mm...`
- `live-lock` / in-play nearly-decided scans -> `GET /api/xbet/odds?promoMode=live-lock...`
- `payload` / mapping debug -> `POST /api/xbet/coupon-draft`
- `coupon` / `mã` -> `POST /api/xbet/coupon?verify=1&cookieMode=auto`

## Safety Boundary

The skill audits "sure win" claims as evidence labels such as `unsupported`, `weak`, `plausible`, or `strong-but-not-certain`. It must not present any leg, coupon, or market as guaranteed.
