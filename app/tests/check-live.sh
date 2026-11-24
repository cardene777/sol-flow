#!/usr/bin/env bash
# 本番の https://sol-flow.cardene.dev が配られているかを 1 回だけ確かめる。
# `ok: live-site-serves` か `not ok: live-site-serves` を 1 行出し、最後に `Ran 1 tests` を出す。
set -u

site="https://sol-flow.cardene.dev"
why=""

live_site_serves() {
  local status encoding
  status=$(curl -s -o /dev/null -w '%{http_code}' --max-time 20 "$site/") || { why="could not reach $site"; return 1; }
  [ "$status" = "200" ] || { why="$site/ returned $status"; return 1; }
  status=$(curl -s -o /dev/null -w '%{http_code}' --max-time 20 "$site/app/") || { why="could not reach $site/app/"; return 1; }
  [ "$status" = "200" ] || { why="$site/app/ returned $status"; return 1; }
  encoding=$(curl -s -D - -o /dev/null -H 'Accept-Encoding: gzip, br' --max-time 30 "$site/libraries/openzeppelin.json" \
    | tr -d '\r' | awk -F': ' 'tolower($1)=="content-encoding"{print $2}')
  [ -n "$encoding" ] || { why="$site/libraries/openzeppelin.json is served without compression"; return 1; }
}

if live_site_serves; then
  echo "ok: live-site-serves"
  status=0
else
  echo "not ok: live-site-serves"
  echo "  $why"
  status=1
fi
echo "Ran 1 tests"
exit "$status"
