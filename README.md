# XBet Odds Analyst Skill Package

Installable skill package for Codex and Claude Code.

This package is for QA, public odds-feed analysis, market integrity checks, and SaveCoupon compatibility debugging. It is not gambling advice, account automation, bet placement, deposit/withdrawal automation, or anti-bot bypass work.

## What Is Included

- `skills/xbet-odds-analyst/SKILL.md`: the main Codex/Claude skill.
- `skills/xbet-odds-analyst/scripts/xbet-odds-onefile.js`: one-file runtime containing the local server, odds scanner, analyzer, and coupon debug API.
- `skills/xbet-odds-analyst/references/failed-coupon-lessons.md`: QA lessons and avoid rules.
- `skills/xbet-odds-analyst/exports/chatgpt.md`: prompt export for ChatGPT projects.
- `skills/xbet-odds-analyst/exports/claude-code.md`: prompt export for Claude Code.

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

## ChatGPT / Claude Prompt Exports

Use these files when a platform does not support local skill folders directly:

```text
skills/xbet-odds-analyst/exports/chatgpt.md
skills/xbet-odds-analyst/exports/claude-code.md
```

## Safety Boundary

The skill audits "sure win" claims as evidence labels such as `unsupported`, `weak`, `plausible`, or `strong-but-not-certain`. It must not present any leg, coupon, or market as guaranteed.
