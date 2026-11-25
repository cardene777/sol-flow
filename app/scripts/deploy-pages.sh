#!/usr/bin/env bash
# 静的なサイトを build し、app/out/ を gh-pages ブランチへ push する。
# GitHub Pages は「Deploy from a branch」で gh-pages を https://sol-flow.cardene.dev に配る。
# GitHub Actions は使わず、手元でこの命令を 1 回回すだけで公開する。
set -euo pipefail

app_dir=$(cd "$(dirname "$0")/.." && pwd)
repo_dir=$(git -C "$app_dir" rev-parse --show-toplevel)

if [ -n "$(git -C "$repo_dir" status --porcelain)" ]; then
  echo "deploy-pages: commit or stash the changes first, so the published site matches a commit" >&2
  exit 1
fi
head=$(git -C "$repo_dir" rev-parse --short HEAD)

(cd "$app_dir" && NEXT_TELEMETRY_DISABLED=1 pnpm build)

work=$(mktemp -d)
cleanup() {
  git -C "$repo_dir" worktree remove --force "$work" > /dev/null 2>&1 || true
  rm -rf "$work"
}
trap cleanup EXIT

if git -C "$repo_dir" ls-remote --exit-code --heads origin gh-pages > /dev/null 2>&1; then
  git -C "$repo_dir" fetch -q origin gh-pages
  git -C "$repo_dir" worktree add -q -B gh-pages "$work" origin/gh-pages
else
  git -C "$repo_dir" worktree add -q --orphan -b gh-pages "$work"
fi

rsync -a --delete --exclude .git "$app_dir/out/" "$work/"
git -C "$work" add -A
if git -C "$work" diff --cached --quiet; then
  echo "deploy-pages: gh-pages already holds this build"
  exit 0
fi
git -C "$work" commit -q -m "deploy: ${head}"
git -C "$work" push -q origin gh-pages
echo "deploy-pages: pushed ${head} to gh-pages"
