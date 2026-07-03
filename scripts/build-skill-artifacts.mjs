#!/usr/bin/env node
// build-skill-artifacts.mjs — regenerate the legacy LLM/command files from the
// single source of truth: worker/static/skill/framejs/.
//
// The `framejs` Agent Skill is canonical. The standalone files below (the
// Claude-Code slash command, the chat/API prompt, the CLI guide) are COMPOSED
// from the same skill references so they can never drift. Each carries a
// "generated" banner and should not be hand-edited.
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

// --- command-js.md / .txt — Claude-Code slash command (full automation) -------
// Standalone single file: no bundled script, so the inline-node delivery in the
// short-URL reference is the path to use. argument-hint is QUOTED (issue #53).
const commandJs = `---
description: Generate browser JavaScript and open it at framejs.io
argument-hint: "[short URL or sha256] [description of changes], or [description of what to create], with optional local file paths"
allowed-tools: Bash(node *), Read
---

${BANNER}
<!-- Prefer the portable \`framejs\` Agent Skill: https://framejs.io/skill/framejs/SKILL.md -->

You generate JavaScript that runs at https://framejs.io — a hosted web app that
executes an ES6 module from the URL. The ONLY output you produce is the result of
running a node command that creates a short URL and opens it in the browser.

# USER REQUEST: $ARGUMENTS

\`$ARGUMENTS\` can be: (1) a description to create from scratch; (2) a short URL
(\`https://framejs.io/j/<sha256>\`) or bare 64-char hex id plus a change request —
fetch and modify the existing app; (3) local file paths to visualize — upload and
pass as inputs.

# HOW TO DELIVER (this is a standalone command — use the inline-node commands below)

ALWAYS deliver by creating a short URL and printing it. NEVER create HTML files,
NEVER write local .js files, NEVER output a code block for the user to copy, and
NEVER build a long URL with the code in the hash. On every update, create a NEW
short URL.

${body(shortUrlApi)}

# LOCAL FILE INPUTS

${body(fileInputs)}

# BROWSER JAVASCRIPT CODING GUIDE

${body(codingGuide)}
`;
write("command-js.md", commandJs);
write("command-js.txt", commandJs);

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
