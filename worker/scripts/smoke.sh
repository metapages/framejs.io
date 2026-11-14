#!/usr/bin/env bash
# Read-only smoke test of a deployed framejs.io worker: every route family
# answers, and a known public frame resolves byte-identically to a reference
# deployment. Writes nothing (presign only signs a URL; nothing is uploaded).
#
#   scripts/smoke.sh https://framejs-io.<account>.workers.dev
#   scripts/smoke.sh https://framejs.io https://framejs-io.<account>.workers.dev
#
# The optional second argument is the reference (default https://framejs.io).
set -uo pipefail

BASE="${1:?usage: smoke.sh <base-url> [reference-url]}"
BASE="${BASE%/}"
REF="${2:-https://framejs.io}"
REF="${REF%/}"
# A public framejs.app frame (the torsion-drive explorer).
UUID="019f29d5-55bb-7e37-8869-cdc5474baef1"

fail=0
check() { # check <label> <expected status> <curl args...>
  local label="$1" want="$2"
  shift 2
  local got
  got=$(curl -s -o /dev/null -w '%{http_code}' "$@")
  if [[ "$got" == "$want" ]]; then
    printf '  ok    %-40s %s\n' "$label" "$got"
  else
    printf '  FAIL  %-40s %s (want %s)\n' "$label" "$got" "$want"
    fail=1
  fi
}
same() { # same <path>: byte-identical to the reference
  if cmp -s <(curl -s "$BASE$1") <(curl -s "$REF$1"); then
    printf '  ok    %-40s same as %s\n' "$1" "$REF"
  else
    printf '  FAIL  %-40s differs from %s\n' "$1" "$REF"
    fail=1
  fi
}

echo "Smoke testing $BASE"
check "/" 200 "$BASE/"
check "/index.html" 200 "$BASE/index.html"
check "/sw.js" 200 "$BASE/sw.js"
check "/metaframe.json" 200 "$BASE/metaframe.json"
check "/favicon.svg (asset)" 200 "$BASE/favicon.svg"
check "/llms.txt (asset)" 200 "$BASE/llms.txt"
check "/editor/ (asset)" 200 "$BASE/editor/"
check "/editor/metaframe.json" 200 "$BASE/editor/metaframe.json"
check "/docs/ (asset)" 200 "$BASE/docs/"
check "/docs/guide/url-state (clean url)" 200 "$BASE/docs/guide/url-state"
check "/does-not-exist" 404 "$BASE/does-not-exist"
check "/j/<uuid>" 200 "$BASE/j/$UUID"
check "/j/<uuid>.json" 200 "$BASE/j/$UUID.json"
check "/j/<uuid>/qrcode.png" 200 "$BASE/j/$UUID/qrcode.png"
check "/j/<missing sha256>" 404 "$BASE/api/j/$(printf '0%.0s' {1..64})"
check "/f/<id> (redirect)" 302 "$BASE/f/smoke"
check "/api/upload/presign (S3 configured)" 200 -X POST \
  -H 'content-type: application/json' -d '{"contentType":"text/plain"}' \
  "$BASE/api/upload/presign"
same "/api/j/$UUID/runtime-params"
same "/j/$UUID/metaframe.json"
same "/j/$UUID.js"

echo "Served by: $(curl -sI "$BASE/" | grep -i '^server:' | tr -d '\r')"
if [[ $fail -ne 0 ]]; then
  echo "SMOKE TEST FAILED"
  exit 1
fi
echo "All good."
