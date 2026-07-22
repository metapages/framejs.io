set shell := ["bash", "-c"]
set dotenv-load := true
set export := true

DEFAULT_APP_FQDN := "framejs-io.localhost"
APP_FQDN := env_var_or_default("APP_FQDN", DEFAULT_APP_FQDN)
APP_PORT := env_var_or_default("APP_PORT", "4430")
APP_PORT_BROWSER := env_var_or_default("APP_PORT_BROWSER", "4440")
DENO_DEPLOY_TOKEN := env_var_or_default("DENO_DEPLOY_TOKEN", "")

# minimal formatting, bold is very useful

bold := '\033[1m'
normal := '\033[0m'
green := "\\e[32m"
yellow := "\\e[33m"
blue := "\\e[34m"
magenta := "\\e[35m"
grey := "\\e[90m"
cyan := "\\e[36m"

@_help:
    just --list --unsorted
    echo -e ""
    echo -e "    Github  URL 🔗        {{ green }}https://github.com/metapages/framejs.io{{ normal }}"
    echo -e "    Production URL 🔗     {{ green }}https://framejs.io/{{ normal }}"
    echo -e "    Python Package URL 🔗 {{ green }}https://pypi.org/project/metaframe-widget/{{ normal }}"
    echo -e "    Local develop URL 🔗  {{ green }}https://{{ APP_FQDN }}:{{ APP_PORT }}/{{ normal }}"
    echo -e "    Deploy Console URL 🔗 {{ green }}https://console.deno.com/metapage/metaframe-js{{ normal }}"
    echo -e "    Analytics Dashboard 🔗{{ green }}https://cloud.umami.is/analytics/us/websites/774a7551-b487-4691-a52a-9b2b79a20872{{ normal }}"
    echo -e ""
    echo -e "    Sub-commands: (just <sub-command> <?command>)"
    echo -e "        {{ cyan }}docs{{ normal }}"
    echo -e "        {{ cyan }}examples{{ normal }}"

# Run the server in development mode
@dev +args="": build-skill _mkcert open
    docker compose up --build {{ args }}

# Shut down the local server
@down +args="":
    docker compose down {{ args }}

check:
    just editor/check
    just worker/check

# Format TypeScript (editor: Prettier, worker: deno fmt)
fmt:
    just editor/fmt
    just worker/fmt

# Save a framejs.io URL to a readable dir (code.js + options/inputs.json) for git versioning — no server
@frame-save url dir:
    ./bin/framejs-frame.sh save "{{ url }}" "{{ dir }}"

# Rebuild (print) a framejs.io URL from a saved dir — no server. Pass a base url to target local/staging.
@frame-restore dir base="https://framejs.io/":
    ./bin/framejs-frame.sh restore "{{ dir }}" "{{ base }}"

# Browse & live-edit framejs frames on local disk (needs only deno). Root defaults to cwd.
@local-server root="." port="4700" origin="https://framejs.io":
    cd local-server && deno run \
      --allow-read="{{ justfile_directory() }}/{{ root }}" \
      --allow-write="{{ justfile_directory() }}/{{ root }}" \
      --allow-net --allow-env \
      server.ts --root "{{ justfile_directory() }}/{{ root }}" --port "{{ port }}" --origin "{{ origin }}"

# DEV: generate TLS certs for HTTPS over localhost https://blog.filippo.io/mkcert-valid-https-certificates-for-localhost/
@_mkcert: _delete-certs _hostcheck
    mkdir -p .traefik/certs
    mkcert -cert-file .traefik/certs/local-cert.pem -key-file .traefik/certs/local-key.pem {{ APP_FQDN }} s3.localhost localhost

open:
    deno run --allow-all https://deno.land/x/metapages@v0.0.17/exec/open_url.ts 'https://metapages.github.io/load-page-when-available/?url=https://{{ APP_FQDN }}:{{ APP_PORT }}'

#
build: build-skill
    just docs/build
    # build the client in editor/dist
    just editor/build
    # Publish the design-system CSS at a stable URL (https://framejs.io/blueprint.css)
    # so the local-file-io server can load the live look. Source of truth: editor/src/styles.
    cp editor/src/styles/blueprint.css worker/static/blueprint.css

# Regenerate the legacy LLM/command files from the framejs Agent Skill (single source of truth)
build-skill:
    node scripts/build-skill-artifacts.mjs
    # Format generated markdown so it matches `just fmt` output — keeps the two idempotent and prevents fmt from ever rewriting (or re-breaking) generated files
    deno fmt worker/static/llms-prompt.md > /dev/null

# Validate the framejs Agent Skill (spec compliance + regenerates artifacts) and
# exercise the helper's create/update/state/env flow against a local stub.
check-skill: build-skill
    node scripts/validate-skill.mjs
    node scripts/test-skill-helper.mjs

# Symlink the skill into a skills dir for live local-stack testing (default
# ~/.claude/skills). Edits become live; the helper then auto-targets the local
# dev stacks via this repo's .env. See worker/static/skill/README.md.
dev-install-skill dir="~/.claude/skills":
    #!/usr/bin/env bash
    set -euo pipefail
    target="${dir/#\~/$HOME}"
    src="{{ justfile_directory() }}/worker/static/skill/framejs"
    mkdir -p "$target"
    rm -rf "$target/framejs"
    ln -s "$src" "$target/framejs"
    echo -e "{{ green }}Symlinked{{ normal }} $target/framejs -> $src"
    echo "Restart your agent so it reloads SKILL.md."

# deno deploy to framejs.io
deploy: build
    #!/usr/bin/env bash
    set -euo pipefail
    deploy=$(mktemp -d)
    cp -r editor/dist $deploy/editor
    cp -r docs/.vitepress/dist $deploy/docs
    cp -r worker/server.ts $deploy/
    cp -r worker/src $deploy/
    cp -r worker/deno.json $deploy/
    cp -r worker/deno.lock $deploy/
    cp -r worker/index.html $deploy/
    cp -r worker/sw.js $deploy/
    cp -r worker/cache-test-utils.js $deploy/
    cp -r worker/static $deploy/
    cd $deploy
    deno deploy --prod

# Checks and tests
test:
    just check-skill
    just editor/test
    just worker/test
    just _integration-test
    just examples/test-jupyter
    just examples/test-marimo

# Run canonical metaframe-widget unit tests
test-python:
    cd python && pytest tests/ -v

# Build the metaframe-widget package (outputs to python/dist/)
build-python:
    cd python && hatch build

# Build and publish metaframe-widget to PyPI (requires HATCH_INDEX_USER and HATCH_INDEX_AUTH env vars, or interactive login)
publish-python: build-python
    cd python && hatch publish

# The default host is *.localhost, which makes the page origin itself "local".
# Running on a hostname that isn't is how you check behaviour keyed off
# localhost (e.g. inputs pointing at http://localhost:<port>) the way production
# sees it. The hostname must map to 127.0.0.1 in /etc/hosts.
# Run the integration tests with the stack on a NON-localhost hostname
test-nonlocal fqdn="framejs-io.dev" +args="":
    APP_FQDN={{ fqdn }} just _integration-test {{ args }}

# Bring the dev stack up on a NON-localhost hostname (see test-nonlocal)
dev-nonlocal fqdn="framejs-io.dev" +args="":
    APP_FQDN={{ fqdn }} just dev {{ args }}

# Run integration tests: starts the dev stack, runs vitest unit + playwright integration tests, tears down
_integration-test +args="": _mkcert
    #!/usr/bin/env bash
    set -uo pipefail

    # s3.localhost must resolve for Playwright to follow S3 redirects
    if ! grep -q 's3\.localhost' /etc/hosts; then
      echo "⚠️  s3.localhost not found in /etc/hosts. Add it with:"
      echo "   echo '127.0.0.1 s3.localhost' | sudo tee -a /etc/hosts"
      exit 1
    fi

    npm --prefix test install
    npx --prefix test playwright install chromium

    # Run unit tests (no server needed)
    npm --prefix test run test:unit

    # Start dev stack in background; use port 0 for Traefik web UI to avoid conflicts with host ports
    TRAEFIK_WEB_UI_PORT=0 docker compose up --build -d

    # On exit (success or failure), shut down the dev stack and preserve exit code
    cleanup() {
      local code=$?
      docker compose down
      exit $code
    }
    trap cleanup EXIT

    # Wait for server to be ready
    echo "Waiting for dev server at https://{{ APP_FQDN }}:{{ APP_PORT }}..."
    if ! timeout 90 bash -c 'until curl -skf "https://{{ APP_FQDN }}:{{ APP_PORT }}" >/dev/null 2>&1; do sleep 2; done'; then
      echo "❌ Dev server did not become ready within 90s"
      exit 1
    fi
    echo "Dev server ready."

    # Run playwright integration tests
    (cd test && npx playwright test {{ args }})

# Delete all cached and generated files, and docker volumes
clean: _delete-certs
    just editor/clean
    rm -rf deploy
    docker compose down -v

@_delete-certs:
    rm -rf .traefik/certs

show-metapage-lib:
    @rg "@metapages/metapage@"

python-bump-version:
    #!/usr/bin/env bash
    set -euo pipefail
    pyproject_path="python/pyproject.toml"
    # Read the version currently in pyproject.toml
    toml_version=$(python3 - <<'PY'
    import pathlib, re, sys
    text = pathlib.Path("python/pyproject.toml").read_text()
    match = re.search(r'^version\s*=\s*"(\d+)\.(\d+)\.(\d+)"\s*$', text, re.MULTILINE)
    if not match:
        sys.exit("Could not find semver version in python/pyproject.toml")
    print(".".join(match.groups()))
    PY
    )
    toml_tag="python-v$toml_version"
    # If the tag for the toml version already exists, bump patch
    if git rev-parse "$toml_tag" >/dev/null 2>&1; then
        IFS=. read -r major minor patch <<< "$toml_version"
        new_version="$major.$minor.$((patch + 1))"
        echo "Tag $toml_tag exists — bumping to $new_version"
        python3 - <<PY "$new_version"
    import pathlib, re, sys
    new_version = sys.argv[1]
    path = pathlib.Path("python/pyproject.toml")
    text = path.read_text()
    updated, count = re.subn(
        r'^version\s*=\s*"\d+\.\d+\.\d+"\s*$',
        f'version = "{new_version}"',
        text,
        count=1,
        flags=re.MULTILINE,
    )
    if count != 1:
        sys.exit("Failed to update version in python/pyproject.toml")
    path.write_text(updated)
    PY
        git add "$pyproject_path"
        git commit -m "python: bump version to $new_version"
    else
        new_version="$toml_version"
        echo "Tag $toml_tag does not exist — using toml version $new_version as-is"
    fi
    new_tag="python-v$new_version"
    git tag "$new_tag"
    git push origin HEAD
    git push origin "$new_tag"
    echo "$new_tag"


alias docs := _docs
@_docs +args="":
    just docs/{{ args }}

alias examples := _examples
@_examples +args="":
    just examples/{{ args }}

# Verify the dev host resolves: the dev server binds to APP_FQDN, and neither
# a *.localhost name nor a custom one like framejs-io.dev is resolved to
# loopback by macOS automatically (browsers do, the OS resolver doesn't), so
# without an /etc/hosts entry the server fails with `getaddrinfo ENOTFOUND`.
_hostcheck:
    #!/usr/bin/env bash
    set -euo pipefail
    if [ "{{ APP_FQDN }}" != "{{ DEFAULT_APP_FQDN }}" ]; then
        echo -e "{{ yellow }}[hostcheck] APP_FQDN override in effect: {{ bold }}{{ APP_FQDN }}\033[0m{{ yellow }} (default: {{ DEFAULT_APP_FQDN }})\033[0m" >&2
        echo -e "{{ yellow }}            The whole stack — certs, routing, tests — runs on this host.\033[0m" >&2
    fi
    escaped=$(printf '%s' '{{ APP_FQDN }}' | sed 's/\./\\./g')
    if ! grep -qE "^[[:space:]]*127\.0\.0\.1[[:space:]]+([^#]*[[:space:]])?${escaped}([[:space:]]|$)" /etc/hosts; then
        echo -e "\033[1m[hostcheck] Missing /etc/hosts entry for {{ APP_FQDN }}\033[0m" >&2
        echo "" >&2
        echo "The dev server binds to '{{ APP_FQDN }}', but your OS can't resolve it," >&2
        echo "so it will fail with: getaddrinfo ENOTFOUND {{ APP_FQDN }}" >&2
        echo "" >&2
        echo "Fix it by adding the loopback mapping to /etc/hosts:" >&2
        echo "" >&2
        echo "    echo '127.0.0.1 {{ APP_FQDN }}' | sudo tee -a /etc/hosts" >&2
        echo "" >&2
        exit 1
    fi