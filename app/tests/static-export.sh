#!/usr/bin/env bash
# GitHub Pages で配る静的な書き出しを確かめる。
# 1 つの確認ごとに `ok: <名前>` か `not ok: <名前>` を 1 行出し、最後に `Ran N tests` を出す。
# SKIP_BUILD=1 の時は `pnpm build` を回さず、今ある app/out/ を見る。
set -u

app_dir=$(cd "$(dirname "$0")/.." && pwd)
repo_dir=$(cd "$app_dir/.." && pwd)
out_dir="$app_dir/out"
ran=0
failed=0
build_status=0
build_log=$(mktemp)
trap 'rm -f "$build_log"' EXIT

check() {
  local name=$1 fn=$2
  why=""
  ran=$((ran + 1))
  if "$fn"; then
    echo "ok: $name"
  else
    failed=$((failed + 1))
    echo "not ok: $name"
    [ -n "$why" ] && echo "  $why"
  fi
}

if [ "${SKIP_BUILD:-0}" != "1" ]; then
  rm -rf "$out_dir"
  (cd "$app_dir" && NEXT_TELEMETRY_DISABLED=1 pnpm build) > "$build_log" 2>&1
  build_status=$?
fi

build_writes_out() {
  [ "$build_status" -eq 0 ] || { why="pnpm build exited $build_status: $(tail -5 "$build_log" | tr '\n' ' ')"; return 1; }
  [ -f "$out_dir/index.html" ] || { why="app/out/index.html is missing"; return 1; }
  [ -f "$out_dir/app/index.html" ] || { why="app/out/app/index.html is missing"; return 1; }
}

no_api_routes() {
  local found
  found=$(find "$app_dir/src/app/api" -name 'route.ts' 2>/dev/null)
  [ -z "$found" ] || { why="route handlers remain: $(echo "$found" | sed "s|$app_dir/||" | tr '\n' ' ')"; return 1; }
}

library_json_written() {
  local id
  for id in openzeppelin openzeppelin-upgradeable solady sample-uups sample-transparent sample-diamond sample-beacon sample-erc7546; do
    [ -f "$out_dir/libraries/$id.json" ] || { why="app/out/libraries/$id.json is missing"; return 1; }
    node -e 'const d=JSON.parse(require("fs").readFileSync(process.argv[1],"utf8")); if(!d.callGraph||!Array.isArray(d.callGraph.contracts)) process.exit(1)' "$out_dir/libraries/$id.json" \
      || { why="app/out/libraries/$id.json has no callGraph.contracts"; return 1; }
  done
}

cname_and_nojekyll() {
  [ -f "$out_dir/CNAME" ] || { why="app/out/CNAME is missing"; return 1; }
  [ "$(tr -d '[:space:]' < "$out_dir/CNAME")" = "sol-flow.cardene.dev" ] || { why="app/out/CNAME holds $(cat "$out_dir/CNAME")"; return 1; }
  [ -f "$out_dir/.nojekyll" ] || { why="app/out/.nojekyll is missing"; return 1; }
}

metadata_base_is_custom_domain() {
  [ -f "$out_dir/index.html" ] || { why="app/out/index.html is missing"; return 1; }
  grep -Eq 'property="og:image" content="https://sol-flow\.cardene\.dev/' "$out_dir/index.html" \
    || { why="og:image of app/out/index.html does not start with https://sol-flow.cardene.dev"; return 1; }
}

no_api_fetch() {
  local found
  found=$(git -C "$repo_dir" grep -n -F "/api/" -- app/src 2>/dev/null)
  [ -z "$found" ] || { why="app/src still calls the API: $(echo "$found" | head -3 | tr '\n' ' ')"; return 1; }
  git -C "$repo_dir" grep -q -F "new Worker(" -- app/src || { why="app/src has no new Worker( call"; return 1; }
}

deploy_script_exists() {
  node -e '
    const s = require(process.argv[1]).scripts || {};
    const d = s["deploy:pages"] || "";
    if (!d) { console.error("no deploy:pages script"); process.exit(1); }
  ' "$app_dir/package.json" 2>/dev/null || { why="app/package.json has no deploy:pages script"; return 1; }
  [ -f "$app_dir/scripts/deploy-pages.sh" ] || { why="app/scripts/deploy-pages.sh is missing"; return 1; }
  grep -q 'gh-pages' "$app_dir/scripts/deploy-pages.sh" || { why="app/scripts/deploy-pages.sh does not push gh-pages"; return 1; }
}

no_workflows() {
  local found
  found=$(git -C "$repo_dir" ls-files -- .github/workflows)
  [ -z "$found" ] || { why="workflow files exist: $found"; return 1; }
}

no_vercel_json() {
  [ ! -e "$repo_dir/vercel.json" ] || { why="vercel.json exists"; return 1; }
}

docs_link_custom_domain() {
  local found file
  found=$(git -C "$repo_dir" grep -n -F "sol-flow.vercel.app" -- . 2>/dev/null)
  [ -z "$found" ] || { why="sol-flow.vercel.app remains: $(echo "$found" | head -3 | tr '\n' ' ')"; return 1; }
  for file in README.md ja/README.md docs/guides/README.md docs/ja/guides/README.md; do
    grep -q -F "https://sol-flow.cardene.dev" "$repo_dir/$file" || { why="$file does not link https://sol-flow.cardene.dev"; return 1; }
  done
}

api_docs_updated() {
  local file
  for file in docs/API.md docs/ja/API.md; do
    if grep -Eq '^\| *(GET|POST) *\| *`/api/' "$repo_dir/$file" || grep -Eq '^## (GET|POST) /api/' "$repo_dir/$file"; then
      why="$file still documents /api/ as server endpoints"
      return 1
    fi
  done
}

check build-writes-out build_writes_out
check no-api-routes no_api_routes
check library-json-written library_json_written
check cname-and-nojekyll cname_and_nojekyll
check metadata-base-is-custom-domain metadata_base_is_custom_domain
check no-api-fetch no_api_fetch
check deploy-script-exists deploy_script_exists
check no-workflows no_workflows
check no-vercel-json no_vercel_json
check docs-link-custom-domain docs_link_custom_domain
check api-docs-updated api_docs_updated

echo "Ran $ran tests"
[ "$failed" -eq 0 ]
