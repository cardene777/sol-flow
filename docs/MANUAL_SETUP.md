# Manual Setup for GitHub Pages

These settings are made once by hand, outside the repository.
The publish command itself is in [DEPLOY.md](./DEPLOY.md).

## Cloudflare DNS record

`cardene.dev` is managed on Cloudflare.
The owner adds this record on the [DNS records page of cardene.dev](https://dash.cloudflare.com/2574ee436cabdd83c108214ed6b150f3/cardene.dev/dns/records).

| Field | Value |
|-------|-------|
| Type | `CNAME` |
| Name | `sol-flow` |
| Target | `cardene777.github.io` |
| Proxy status | DNS only (grey cloud) |
| TTL | Auto |

Keep the proxy off.
With the proxy on, GitHub cannot issue the HTTPS certificate for `sol-flow.cardene.dev`.

## GitHub Pages settings

On [Settings → Pages of cardene777/sol-flow](https://github.com/cardene777/sol-flow/settings/pages):

| Setting | Value |
|---------|-------|
| Source | Deploy from a branch |
| Branch | `gh-pages`, folder `/ (root)` |
| Custom domain | `sol-flow.cardene.dev` |
| Enforce HTTPS | On, once the certificate is issued |

The same settings can be made with the GitHub CLI.

```bash
gh api -X POST repos/cardene777/sol-flow/pages -f "source[branch]=gh-pages" -f "source[path]=/"
gh api -X PUT repos/cardene777/sol-flow/pages -f cname=sol-flow.cardene.dev
gh api -X PUT repos/cardene777/sol-flow/pages -F https_enforced=true
```
