# GitHub Pagesの手で行う設定

repoの外で、1回だけ手で行う設定です。
公開の命令は[DEPLOY.md](./DEPLOY.md)にあります。

## CloudflareのDNSのレコード

`cardene.dev`はCloudflareで管理しています。
持ち主が[cardene.devのDNSレコード](https://dash.cloudflare.com/2574ee436cabdd83c108214ed6b150f3/cardene.dev/dns/records)の画面で、次のレコードを足します。

| 項目 | 値 |
|------|-----|
| タイプ | `CNAME` |
| 名前 | `sol-flow` |
| ターゲット | `cardene777.github.io` |
| プロキシ ステータス | DNS のみ (灰色の雲) |
| TTL | 自動 |

プロキシはオフのままにします。
オンにすると、GitHubが`sol-flow.cardene.dev`のHTTPSの証明書を発行できません。

## GitHub Pagesの設定

[cardene777/sol-flowのSettings → Pages](https://github.com/cardene777/sol-flow/settings/pages)で、次のとおりに設定します。

| 設定 | 値 |
|------|-----|
| Source | Deploy from a branch |
| Branch | `gh-pages`、フォルダは`/ (root)` |
| Custom domain | `sol-flow.cardene.dev` |
| Enforce HTTPS | 証明書が発行された後にオン |

同じ設定は、GitHubのCLIでも行えます。

```bash
gh api -X POST repos/cardene777/sol-flow/pages -f "source[branch]=gh-pages" -f "source[path]=/"
gh api -X PUT repos/cardene777/sol-flow/pages -f cname=sol-flow.cardene.dev
gh api -X PUT repos/cardene777/sol-flow/pages -F https_enforced=true
```
