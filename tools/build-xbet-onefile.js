#!/usr/bin/env node
"use strict";

const fs = require("node:fs");
const path = require("node:path");

const sourceRoot = path.resolve(process.argv[2] || ".");
const outputFile = path.resolve(process.argv[3] || "skills/xbet-odds-analyst/scripts/xbet-odds-onefile.js");

const sourceFiles = [
  "server.js",
  "scripts/xbet-business-features.js",
  "scripts/xbet-odds-filter.js",
  "scripts/xbet-pick-analyzer.js"
];

function readSource(file) {
  const fullPath = path.join(sourceRoot, file);
  if (!fs.existsSync(fullPath)) {
    throw new Error(`Missing source file: ${fullPath}`);
  }
  return fs.readFileSync(fullPath, "utf8");
}

const filesObject = Object.fromEntries(sourceFiles.map((file) => [file, readSource(file)]));

const output = `#!/usr/bin/env node
"use strict";

// Generated single-file export for sports-tracking xBet QA tooling.
// Source files embedded: ${sourceFiles.join(", ")}.
// This tool analyzes public odds feeds and creates SaveCoupon debug artifacts only; it does not log in, submit bets, or handle money.

const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");
const { spawnSync } = require("node:child_process");

const FILES = ${JSON.stringify(filesObject, null, 2)};

function runtimeRoot() {
  return process.env.XBET_ONEFILE_RUNTIME || path.join(os.tmpdir(), "xbet-odds-onefile-runtime");
}

function writeRuntime(target = runtimeRoot()) {
  for (const [name, content] of Object.entries(FILES)) {
    const filePath = path.join(target, name);
    fs.mkdirSync(path.dirname(filePath), { recursive: true });
    fs.writeFileSync(filePath, content, "utf8");
    if (name.startsWith("scripts/")) fs.chmodSync(filePath, 0o755);
  }
  return target;
}

function runNode(entry, args) {
  const root = writeRuntime();
  const result = spawnSync(process.execPath, [path.join(root, entry), ...args], {
    cwd: root,
    stdio: "inherit",
    env: { ...process.env, XBET_ONEFILE_RUNTIME: root }
  });
  process.exit(result.status ?? 1);
}

function usage() {
  console.log([
    "Usage:",
    "  node xbet-odds-onefile.js server",
    "  node xbet-odds-onefile.js odds [xbet-odds-filter args]",
    "  node xbet-odds-onefile.js analyze [xbet-pick-analyzer args]",
    "  node xbet-odds-onefile.js unpack [target-dir]",
    "",
    "Examples:",
    "  node xbet-odds-onefile.js server",
    "  node xbet-odds-onefile.js odds --mode all --sports football --include-subgames --subgame-tags corners,yellow-cards,offsides --json",
    "  node xbet-odds-onefile.js analyze --sports football --mode all --promo-mode t6mm --include-subgames --subgame-tags corners,yellow-cards,offsides",
    "",
    "Notes:",
    "  Coupon helpers are local QA/debug only. No login, bet submission, deposits, or account automation are performed.",
  ].join("\\n"));
}

const [command, ...args] = process.argv.slice(2);
if (!command || command === "help" || command === "--help" || command === "-h") {
  usage();
} else if (command === "server") {
  runNode("server.js", args);
} else if (command === "odds" || command === "scan") {
  runNode("scripts/xbet-odds-filter.js", args);
} else if (command === "analyze" || command === "rank") {
  runNode("scripts/xbet-pick-analyzer.js", args);
} else if (command === "unpack") {
  const target = path.resolve(args[0] || "./xbet-odds-toolkit-unpacked");
  writeRuntime(target);
  console.log(target);
} else {
  console.error("Unknown command: " + command);
  usage();
  process.exit(2);
}
`;

fs.mkdirSync(path.dirname(outputFile), { recursive: true });
fs.writeFileSync(outputFile, output, "utf8");
fs.chmodSync(outputFile, 0o755);
console.log(outputFile);
