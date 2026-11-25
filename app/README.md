# Sol-Flow app

The Next.js app of Sol-Flow, exported as static files and published on GitHub Pages at [https://sol-flow.cardene.dev](https://sol-flow.cardene.dev).

## Commands

| Command | What it does |
|---------|--------------|
| `pnpm dev` | Starts the development server |
| `pnpm build` | Writes the static site to `out/` |
| `pnpm test` | Runs the Vitest tests in `tests/` |
| `bash tests/run.sh` | Runs Vitest, the static export checks, and the live site check |
| `pnpm deploy:pages` | Builds and pushes `out/` to the `gh-pages` branch |

See [docs/DEPLOY.md](../docs/DEPLOY.md) for publishing.
