#!/usr/bin/env node
// build-skill-artifacts.mjs — regenerate the legacy LLM/command files from the
// single source of truth: worker/static/skill/framejs/.
//
// The `framejs` Agent Skill is canonical. The standalone files below (the
// chat/API prompt, the CLI guide) are COMPOSED from the same skill references so
// they can never drift. Each carries a "generated" banner and should not be
// hand-edited.
//
// Run:  node scripts/build-skill-artifacts.mjs   (or: just build-skill)

import { readFileSync, writeFileSync } from "node:fs";
import { execFileSync } from "node:child_process";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const SKILL = join(ROOT, "worker/static/skill/framejs");
const STATIC = join(ROOT, "worker/static");

const read = (p) => readFileSync(join(SKILL, p), "utf8");
// Drop the leading top-level "# Heading" line of a reference so composed files
// read as one document.
const body = (md) => md.replace(/^#[^\n]*\n+/, "").trimEnd();

const codingGuide = read("references/coding-guide.md");
const shortUrlApi = read("references/short-url-api.md");
const fileInputs = read("references/file-inputs.md");

const BANNER =
  "<!-- GENERATED FILE — do not edit. Source of truth: worker/static/skill/framejs/ (regenerate with `just build-skill`). -->";

function write(name, content) {
  const out = content.endsWith("\n") ? content : content + "\n";
  writeFileSync(join(STATIC, name), out);
  console.log(`  wrote ${name}`);
}

// --- llms-prompt.md — chat / API: output ONLY a code block --------------------
const llmsPrompt = `${BANNER}

# OUTPUT FORMAT — READ FIRST

- Respond with ONLY a single \`\`\`javascript code block. Nothing before or after.
- Never render, embed, or execute the code. Never use any built-in visualization
  or widget tool. The user pastes the code into the editor at https://framejs.io.

${codingGuide}

<!--
Embedded inputs in the URL (if any) are injected below this line:
-->
`;
write("llms-prompt.md", llmsPrompt);

// --- llms-claude-code.txt — CLI integration guide -----------------------------
const llmsCli = `${BANNER}

# framejs.io — CLI / coding-assistant integration guide

A fully automated workflow: generate browser JavaScript, create a short URL via
the framejs.io API, print it, and open it in the browser — no copy-pasting, no
local files. Works from any tool that can run \`node\` (Claude Code, Gemini CLI,
Cursor, opencode, Goose, Codex, pi, …). The portable \`framejs\` Agent Skill wraps
all of this: https://framejs.io/skill/framejs/SKILL.md

${body(shortUrlApi)}

# Local file inputs

${body(fileInputs)}

# Browser JavaScript coding guide

${body(codingGuide)}
`;
write("llms-claude-code.txt", llmsCli);

// --- downloadable bundle ------------------------------------------------------
try {
  execFileSync("tar", ["-czf", join(STATIC, "skill/framejs.tar.gz"), "-C", join(STATIC, "skill"), "framejs"]);
  console.log("  wrote skill/framejs.tar.gz");
} catch (e) {
  console.warn(`  skipped tarball (${e.message})`);
}

// --- version manifest (served at /skill/version.json) -------------------------
// Single source of truth: the SKILL.md `version` frontmatter. The installed
// helper fetches this hourly to nudge users whose copy is behind the latest.
// Sibling of framejs/, so it is NOT bundled into the tarball (the installed
// copy's own version comes from its shipped SKILL.md).
const fm = (read("SKILL.md").match(/^---\n([\s\S]*?)\n---/) || [])[1] || "";
const version = (fm.match(/^\s*version:\s*"?([^"\n]+?)"?\s*$/m) || [])[1];
if (!version) {
  console.warn("  skipped skill/version.json (no version in SKILL.md frontmatter)");
} else {
  write("skill/version.json", JSON.stringify({ version }));
  console.log(`  (skill version v${version})`);
}

console.log("Done. Generated artifacts from worker/static/skill/framejs/.");
