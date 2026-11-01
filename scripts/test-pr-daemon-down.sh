#!/usr/bin/env bash
# `just pr-daemon-down` keeps the volumes only when PR_DAEMON_KEEP_DATA is set.
# Runs the real recipe, from a throwaway copy of the justfile with a fake docker
# on PATH, so it never touches the branch's running stack or .traefik/pr-daemon.
set -euo pipefail

repo="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
tmp="$(mktemp -d)"
trap 'rm -rf "$tmp"' EXIT

cp "$repo/justfile" "$tmp/justfile"
git -C "$tmp" init -q -b test-branch
git -C "$tmp" -c user.name=test -c user.email=test@example.com -c commit.gpgsign=false \
    commit -q --allow-empty -m test

mkdir "$tmp/bin"
cat > "$tmp/bin/docker" <<'EOF'
#!/usr/bin/env bash
echo "$COMPOSE_PROJECT_NAME: $*" >> "$DOCKER_LOG"
EOF
chmod +x "$tmp/bin/docker"

# run_down <expected docker args> [VAR=value for the recipe's environment]
run_down() {
    local expected="metaframe-js-test-branch: $1"
    shift
    mkdir -p "$tmp/.traefik/pr-daemon"
    : > "$tmp/docker.log"
    (cd "$tmp" && env -u PR_DAEMON_KEEP_DATA PATH="$tmp/bin:$PATH" DOCKER_LOG="$tmp/docker.log" "$@" \
        just pr-daemon-down)
    local actual
    actual="$(cat "$tmp/docker.log")"
    if [ "$actual" != "$expected" ]; then
        echo "FAIL ($*): expected '$expected', got '$actual'"
        exit 1
    fi
    if [ -e "$tmp/.traefik/pr-daemon" ]; then
        echo "FAIL ($*): .traefik/pr-daemon was left behind"
        exit 1
    fi
}

run_down "compose down -v --remove-orphans"
run_down "compose down -v --remove-orphans" PR_DAEMON_KEEP_DATA=
run_down "compose down --remove-orphans" PR_DAEMON_KEEP_DATA=1

echo "✅ pr-daemon-down keeps the volumes only with PR_DAEMON_KEEP_DATA"
