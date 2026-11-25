# Deploying Sol-Flow

Sol-Flow is published as static files on GitHub Pages at [https://sol-flow.cardene.dev](https://sol-flow.cardene.dev).
No GitHub Actions workflow is used: one local command builds the site and pushes it to the `gh-pages` branch.

## Publish

Commit every change first, then run this from the repository root.

```bash
pnpm --dir app deploy:pages
```

The command runs `app/scripts/deploy-pages.sh`, which does the following.

1. Refuses to run while the working tree has uncommitted changes, so the site always matches a commit
2. Runs `pnpm build`, which writes the static site to `app/out/` (`output: 'export'` in `app/next.config.ts`)
3. Copies `app/out/` into the `gh-pages` branch in a temporary worktree and commits it as `deploy: <commit>`
4. Pushes `gh-pages` to `origin`

GitHub Pages starts serving the new commit within a minute or two.

## What `app/out/` holds

| Path | Content |
|------|---------|
| `index.html`, `app/index.html` | The landing page and the app page |
| `libraries/<id>.json` | Pre-built CallGraph of each library (see [API.md](./API.md)) |
| `CNAME` | `sol-flow.cardene.dev`, the custom domain GitHub Pages serves |
| `.nojekyll` | Stops GitHub Pages from running Jekyll, which would drop the `_next/` folder |

`CNAME` and `.nojekyll` come from `app/public/`.

## Check the published site

```bash
bash app/tests/check-live.sh
```

It checks that `https://sol-flow.cardene.dev/` and `/app/` answer 200, and that `/libraries/openzeppelin.json` is served compressed.

## One-time settings

The DNS record and the GitHub Pages settings are made once by hand.
They are listed in [MANUAL_SETUP.md](./MANUAL_SETUP.md).
