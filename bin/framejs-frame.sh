#!/usr/bin/env bash
# framejs-frame.sh — save/restore a framejs.io page to/from a readable dir.
#
# A framejs.io page is fully self-contained in its URL hash:
#   https://framejs.io/#?js=<b64>&options=<b64>&inputs=<b64>
# where each value is  base64( encodeURIComponent( text ) )  and the text is
# raw JS for `js`, compact JSON for `options`/`inputs`
# (encoding per @metapages/hash-query). No server is involved either way.
#
# Deps: bash, jq, openssl, printf  (all typically preinstalled).
#
# Usage:
#   framejs-frame.sh restore <dir> [base-url]   # dir  -> prints URL
#   framejs-frame.sh save    <url> <dir>        # URL  -> dir/{code.js,options.json,inputs.json}
set -euo pipefail

BASE_URL_DEFAULT="https://framejs.io/"
# Params to persist. Add more here if the app grows new hash params.
STRING_PARAMS=(js)                 # raw text
JSON_PARAMS=(options inputs)       # JSON blobs
declare -A FILE=( [js]=code.js [options]=options.json [inputs]=inputs.json )

die() { echo "error: $*" >&2; exit 1; }

# text -> base64(encodeURIComponent(text)) ; reads stdin
enc() { jq -sRr '@uri' | openssl base64 -A; }

# base64(encodeURIComponent(text)) -> text ; arg is the param value
dec() {
  local uri; uri=$(printf '%s' "$1" | openssl base64 -d -A)
  # decodeURIComponent via printf: %XX -> \xXX. encodeURIComponent never emits '+'.
  printf '%b' "${uri//%/\\x}"
}

# pull key=value out of a URL's hash fragment (value may contain +,/,= )
get_param() {
  local frag="${1#*#}"; frag="${frag#\?}"
  local kv IFS='&'
  for kv in $frag; do
    [[ "$kv" == "$2="* ]] && { printf '%s' "${kv#*=}"; return 0; }
  done
  return 1
}

cmd_restore() {
  local dir="${1:?usage: restore <dir> [base-url]}" base="${2:-$BASE_URL_DEFAULT}"
  [[ -d "$dir" ]] || die "no such dir: $dir"
  local parts=() key val f
  for key in "${STRING_PARAMS[@]}"; do
    f="$dir/${FILE[$key]}"; [[ -f "$f" ]] || continue
    val=$(enc <"$f"); parts+=("$key=$val")
  done
  for key in "${JSON_PARAMS[@]}"; do
    f="$dir/${FILE[$key]}"; [[ -f "$f" ]] || continue
    # compact + stable key order, mirroring fast-json-stable-stringify
    val=$(jq -cS -j . "$f" | enc); parts+=("$key=$val")
  done
  [[ ${#parts[@]} -gt 0 ]] || die "no frame files found in $dir"
  local joined; local IFS='&'; joined="${parts[*]}"
  printf '%s#?%s\n' "${base%/}/" "$joined"
}

cmd_save() {
  local url="${1:?usage: save <url> <dir>}" dir="${2:?usage: save <url> <dir>}"
  mkdir -p "$dir"
  local key val
  for key in "${STRING_PARAMS[@]}"; do
    val=$(get_param "$url" "$key") || continue
    dec "$val" >"$dir/${FILE[$key]}"
  done
  for key in "${JSON_PARAMS[@]}"; do
    val=$(get_param "$url" "$key") || continue
    dec "$val" | jq -S . >"$dir/${FILE[$key]}"   # pretty, sorted, for clean diffs
  done
  echo "saved -> $dir" >&2
  ls -1 "$dir" >&2
}

case "${1:-}" in
  restore) shift; cmd_restore "$@";;
  save)    shift; cmd_save "$@";;
  *) die "usage: $0 {restore <dir> [base-url] | save <url> <dir>}";;
esac
