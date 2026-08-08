#!/usr/bin/env node
// Reports drift between this repo and the framejs entry in
// ComposioHQ/awesome-claude-skills. Network-only, no deps, no writes.
// See ../SKILL.md. Run via `just check-awesome-listing`.
//
// Exit 0 = in sync, 1 = drift (or the entry is missing), 2 = check failed to run.

import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const SKILL_DIR = join(dirname(fileURLToPath(import.meta.url)), "..");
const RAW = "https://raw.githubusercontent.com/ComposioHQ/awesome-claude-skills/master";

// Pin: bump together with references/upstream-contributing.md when the rules change.
const EXPECTED_CONTRIBUTING_SHA256 =
  "94c4c5b719fa6e8b03d4d34508f1f673f44548f9ae15fa511811b164351a8910";

// The canonical skill location the listing points at.
const SKILL_RAW =
  "https://raw.githubusercontent.com/metapages/framejs.io/main/worker/static/skill/framejs/SKILL.md";

const json = process.argv.includes("--json");
const results = [];
const record = (name, ok, detail) => results.push({ name, ok, detail });

const sha256 = (s) => createHash("sha256").update(s).digest("hex");

async function fetchText(url) {
  const res = await fetch(url, { headers: { "user-agent": "framejs-listing-check" } });
  if (!res.ok) throw new Error(`${res.status} ${res.statusText} for ${url}`);
  return res.text();
}

const expectedEntry = readFileSync(join(SKILL_DIR, "listing-entry.txt"), "utf8").trim();

let readme;
try {
  readme = await fetchText(`${RAW}/README.md`);
} catch (err) {
  console.error(`Could not fetch upstream README: ${err.message}`);
  process.exit(2);
}

// 1 + 2. Is our entry there, and does it still match listing-entry.txt?
const entryLines = readme
  .split("\n")
  .map((l) => l.trim())
  .filter((l) => l.startsWith("- [") && /framejs/i.test(l));

if (entryLines.length === 0) {
  record("listing present", false, "no framejs entry in upstream README — submit the PR (see SKILL.md)");
} else if (entryLines.length > 1) {
  record("listing present", false, `${entryLines.length} framejs-ish entries found:\n    ${entryLines.join("\n    ")}`);
} else if (entryLines[0] === expectedEntry) {
  record("listing matches", true, "upstream line is identical to listing-entry.txt");
} else {
  record(
    "listing matches",
    false,
    `upstream differs from listing-entry.txt\n    upstream: ${entryLines[0]}\n    ours:     ${expectedEntry}`,
  );
}

// 3. Does the URL the listing points at still resolve?
const linked = expectedEntry.match(/\]\((https:\/\/github\.com\/[^)]+)\)/)?.[1];
try {
  await fetchText(SKILL_RAW);
  record("skill url resolves", true, `${linked ?? SKILL_RAW} → SKILL.md found on main`);
} catch (err) {
  record("skill url resolves", false, `${SKILL_RAW} → ${err.message} (push the skill, or fix the path)`);
}

// 4. Have the contribution rules changed under us?
try {
  const contributing = await fetchText(`${RAW}/CONTRIBUTING.md`);
  const got = sha256(contributing);
  if (got === EXPECTED_CONTRIBUTING_SHA256) {
    record("contributing pinned", true, `sha256 ${got.slice(0, 12)}… unchanged`);
  } else {
    record(
      "contributing pinned",
      false,
      `upstream CONTRIBUTING.md changed (${got.slice(0, 12)}… ≠ ${EXPECTED_CONTRIBUTING_SHA256.slice(0, 12)}…)\n` +
        `    diff it against references/upstream-contributing.md, then re-pin`,
    );
  }
} catch (err) {
  record("contributing pinned", false, `could not fetch: ${err.message}`);
}

const drift = results.filter((r) => !r.ok);

if (json) {
  console.log(JSON.stringify({ ok: drift.length === 0, results }, null, 2));
} else {
  for (const r of results) console.log(`${r.ok ? "✔" : "✖"} ${r.name}: ${r.detail}`);
  console.log(
    drift.length === 0
      ? "\nListing is up to date."
      : `\n${drift.length} item(s) need attention — see .claude/skills/awesome-claude-skills-listing/SKILL.md`,
  );
}

process.exit(drift.length === 0 ? 0 : 1);
