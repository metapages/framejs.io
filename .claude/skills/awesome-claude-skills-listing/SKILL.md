---
name: awesome-claude-skills-listing
description: >
  How the framejs Agent Skill is listed in the ComposioHQ/awesome-claude-skills
  directory, and the exact steps to submit or refresh that listing. Load when
  asked to publish/submit/contribute the framejs skill to awesome-claude-skills
  (or another skills directory), when the listing entry or its description needs
  updating after a skill change, when `just check-awesome-listing` reports drift,
  or when the upstream CONTRIBUTING rules have changed.
---

# Listing framejs in awesome-claude-skills

[ComposioHQ/awesome-claude-skills](https://github.com/ComposioHQ/awesome-claude-skills)
is a directory README. Our entry is **one line pointing back at this repo** —
not a vendored copy of the skill.

```
- [framejs](https://github.com/metapages/framejs.io/tree/main/worker/static/skill/framejs) - …description… *By [@dionjwa](https://github.com/dionjwa)*
```

That link-out is deliberate: `worker/static/skill/framejs/` stays the single
source of truth (see [[framejs-origins]]), the directory always resolves to the
current skill, and the only thing that can ever go stale is the one-line
description. A vendored `framejs/SKILL.md` copy in their repo would need a PR on
every skill change; this needs one only when the pitch changes.

**Upstream is not our fork.** Canonical repo: `ComposioHQ/awesome-claude-skills`
(default branch `master`). The local fork checkout is
`/Users/dion/dev/git/awesome-claude-skills` → `git@github.com:dionjwa/awesome-claude-skills.git`.

## Staying up to date

`just check-awesome-listing` (recipe in this repo's justfile; script:
[scripts/check-listing.mjs](scripts/check-listing.mjs)) fetches upstream and
reports on four things:

| Check                | Fails when                                                       | Fix                                                         |
| -------------------- | ---------------------------------------------------------------- | ----------------------------------------------------------- |
| Listing present      | upstream README has no framejs entry                             | Submit the PR — see *Submitting* below                       |
| Listing matches      | upstream's line ≠ [`listing-entry.txt`](listing-entry.txt)       | Open a PR updating their README line (or accept their edit by updating our file) |
| Skill URL resolves   | `worker/static/skill/framejs/SKILL.md` 404s on `main`            | Push the skill, or fix the path in `listing-entry.txt` **and** upstream |
| CONTRIBUTING pinned  | upstream CONTRIBUTING.md sha256 ≠ the pin in the script          | Read the new rules, update [references/upstream-contributing.md](references/upstream-contributing.md) + the `EXPECTED_CONTRIBUTING_SHA256` pin, and adjust this skill if the rules changed |

Run it after any release that changes what the skill *is* (new capability,
renamed skill, moved path) — a version bump alone needs nothing, because the
listing points at the live source.

[`listing-entry.txt`](listing-entry.txt) is the source of truth for our line.
Edit it first, then PR upstream to match; the checker compares upstream against
it verbatim.

## Submitting (or refreshing) the entry

1. **Sync the fork with upstream** — the fork drifts behind fast:
   ```bash
   cd /Users/dion/dev/git/awesome-claude-skills
   git remote get-url upstream 2>/dev/null || git remote add upstream https://github.com/ComposioHQ/awesome-claude-skills.git
   git fetch upstream && git checkout master && git reset --hard upstream/master
   ```
2. **Branch**: `git checkout -b add-framejs-skill` (refresh: `update-framejs-listing`).
3. **Edit `README.md` only.** No folder, no `SKILL.md` — we link out.
   - Category: **`### Development & Code Tools`**. (Note: CONTRIBUTING.md lists
     older category names like "Development"; the README's live headings win —
     always read the actual headings before inserting.)
   - Alphabetical within the category, case-insensitive on the visible name.
     `framejs` sits between `finishing-a-development-branch` and
     `Full-Page Screenshot`.
   - Paste the line from [`listing-entry.txt`](listing-entry.txt) verbatim.
     No emojis, sentence case, single hyphen separator, trailing
     `*By [@dionjwa](https://github.com/dionjwa)*` — match the neighbours exactly.
4. **Commit**: `git commit -m "Add framejs skill"` (refresh: `"Update framejs skill listing"`).
5. **Push & PR against `ComposioHQ/awesome-claude-skills:master`**:
   ```bash
   git push -u origin add-framejs-skill
   gh pr create --repo ComposioHQ/awesome-claude-skills \
     --base master --head dionjwa:add-framejs-skill \
     --title "Add framejs skill" --body-file /tmp/framejs-pr.md
   ```
   PR title is exactly `Add [Skill Name] skill` per their guidelines. Body must
   cover: the problem it solves, who uses the workflow, an example, and
   attribution — template in
   [references/pr-body.md](references/pr-body.md).

   `gh pr edit --body-file` currently dies on their repo (deprecated Projects
   classic GraphQL field). To change a body after the fact use the REST API:
   `gh api -X PATCH repos/ComposioHQ/awesome-claude-skills/pulls/<n> -F body=@file`.

**History:** first listed via
[PR #1568](https://github.com/ComposioHQ/awesome-claude-skills/pull/1568)
(2026-08-07).

**Confirm with the user before pushing a branch or opening the PR** — it is a
public, outward-facing action under their GitHub identity.

## Their requirements, and how framejs satisfies them

Full text (pinned copy):
[references/upstream-contributing.md](references/upstream-contributing.md).
The seven requirements and our standing answers:

- **Real use case** — framejs.io is a shipped product; the skill is the
  documented agent path into it.
- **Well documented** — `SKILL.md` + `references/{coding-guide,file-inputs,short-url-api}.md`.
- **Accessible** — the entry description avoids repo-internal jargon (no
  "metaframe", no origin split).
- **Examples** — the coding guide carries them; keep one concrete prompt in the
  PR body.
- **Tested** — `just check-skill` (spec validation + helper flow) before every
  listing PR.
- **Safe** — the helper only writes to frames it is given; no destructive local ops.
- **Portable** — the skill declares both automation (shell) and code-block
  (chat/API) delivery modes, so it works on Claude.ai, Claude Code, and the API.

Their SKILL.md template (name/description frontmatter, "When to Use", "What This
Skill Does", …) applies to skills *vendored into their repo*. Ours is not
vendored, so `worker/static/skill/framejs/SKILL.md` keeps its own structure and
stays governed by the Agent Skills spec via `just check-skill`. Don't reshape the
real skill to fit a directory template.

## If the rules change

When the checker reports a CONTRIBUTING sha mismatch: diff the new text against
[references/upstream-contributing.md](references/upstream-contributing.md),
apply anything that affects us (category renames, link-out policy, required
fields), refresh the pinned copy and the sha in the script, and note the change
here. If they ever *require* a vendored folder, the sync story changes
completely — raise it with the user rather than silently copying the skill in.
