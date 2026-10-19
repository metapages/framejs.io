#!/usr/bin/env node
// validate-skill.mjs — sanity-check the framejs Agent Skill against the
// Agent Skills spec (https://agentskills.io/specification) and guard against
// regressions that have bitten us (e.g. an inline ``` fence in prose that a
// markdown formatter then expands into a broken code block).
//
// Run:  node scripts/validate-skill.mjs   (or: just check-skill)
// Exits non-zero with a list of problems.

import { readFileSync, existsSync } from "node:fs";
import { dirname, join, basename } from "node:path";
import { fileURLToPath } from "node:url";
import { execFileSync } from "node:child_process";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const SKILL = join(ROOT, "worker/static/skill/framejs");
const errors = [];
const err = (m) => errors.push(m);

// --- frontmatter (name, description) -----------------------------------------
const skillMd = readFileSync(join(SKILL, "SKILL.md"), "utf8");
const fm = (skillMd.match(/^---\n([\s\S]*?)\n---/) || [])[1];
if (!fm) err("SKILL.md: missing YAML frontmatter");
else {
  const name = (fm.match(/^name:\s*(.+?)\s*$/m) || [])[1];
  const desc = (fm.match(/^description:\s*"?([\s\S]*?)"?\s*$/m) || [])[1] || "";
  if (!name) err("frontmatter: missing `name`");
  else {
    if (!/^[a-z0-9]+(-[a-z0-9]+)*$/.test(name)) {
      err(`frontmatter: name "${name}" must be lowercase alphanumeric + single hyphens`);
    }
    if (name.length > 64) err("frontmatter: name exceeds 64 chars");
    if (name !== basename(SKILL)) err(`frontmatter: name "${name}" must match folder "${basename(SKILL)}"`);
  }
  if (!desc) err("frontmatter: missing `description`");
  else if (desc.length > 1024) err(`frontmatter: description is ${desc.length} chars (max 1024)`);
}

// --- referenced files exist ---------------------------------------------------
for (const rel of [
  "references/coding-guide.md",
  "references/short-url-api.md",
  "references/file-inputs.md",
  "references/export-from-your-app.md",
  "scripts/framejs.mjs",
]) {
  if (!existsSync(join(SKILL, rel))) err(`missing bundled file: ${rel}`);
}

// --- no inline ``` fences in prose (the fmt-break regression) ------------------
// A valid fence line is only whitespace then ``` plus an optional info string.
const mdFiles = [
  "SKILL.md",
  "references/coding-guide.md",
  "references/short-url-api.md",
  "references/file-inputs.md",
  "references/export-from-your-app.md",
];
for (const rel of mdFiles) {
  const lines = readFileSync(join(SKILL, rel), "utf8").split("\n");
  lines.forEach((line, i) => {
    if (line.includes("```") && !/^\s*```[A-Za-z0-9._-]*\s*$/.test(line)) {
      err(`${rel}:${i + 1}: inline \`\`\` fence in prose — a formatter may break this. Reword without literal triple backticks.`);
    }
  });
}

// --- bundled scripts parse cleanly ------------------------------------------
const syntaxChecks = [
  ["node", ["--check", join(SKILL, "scripts/framejs.mjs")], "scripts/framejs.mjs"],
  ["sh", ["-n", join(ROOT, "worker/static/skill/install.sh")], "skill/install.sh"],
];
for (const [cmd, args, label] of syntaxChecks) {
  try {
    execFileSync(cmd, args, { stdio: "pipe" });
  } catch (e) {
    err(`${label}: ${cmd} syntax check failed — ${(e.stderr || e.message).toString().trim()}`);
  }
}

if (errors.length) {
  console.error("framejs skill validation FAILED:");
  for (const e of errors) console.error(`  - ${e}`);
  process.exit(1);
}
console.log("framejs skill validation passed.");
