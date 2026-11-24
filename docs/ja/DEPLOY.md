# Sol-Flowの公開

Sol-Flowは、GitHub Pagesの[https://sol-flow.cardene.dev](https://sol-flow.cardene.dev)で静的なfileとして公開します。
GitHub Actionsは使いません。
手元の1つの命令がサイトを`build`し、`gh-pages`ブランチへpushします。

## 公開する

変更を全部コミットしてから、repoの一番上でこの命令を回します。

```bash
pnpm --dir app deploy:pages
```

この命令は`app/scripts/deploy-pages.sh`を回し、次の順に進みます。

1. コミットしていない変更が残る時は止まる。公開するサイトを必ずコミットと一致させるため
2. `pnpm build`を回し、静的なサイトを`app/out/`へ書き出す (`app/next.config.ts`の`output: 'export'`)
3. 一時のworktreeで`gh-pages`ブランチへ`app/out/`を写し、`deploy: <コミット>`としてコミットする
4. `gh-pages`を`origin`へpushする

GitHub Pagesは、1〜2分ほどで新しいコミットを配り始めます。

## `app/out/`の中身

| パス | 中身 |
|------|------|
| `index.html`、`app/index.html` | 最初の画面とアプリの画面 |
| `libraries/<id>.json` | ライブラリごとに事前に作ったCallGraph ([API.md](./API.md)を参照) |
| `CNAME` | GitHub Pagesが配る独自のドメイン`sol-flow.cardene.dev` |
| `.nojekyll` | GitHub Pagesの`Jekyll`を止める。`Jekyll`が動くと`_next/`のフォルダが配られない |

`CNAME`と`.nojekyll`は`app/public/`から入ります。

## 公開したサイトを確かめる

```bash
bash app/tests/check-live.sh
```

`https://sol-flow.cardene.dev/`と`/app/`が200を返し、`/libraries/openzeppelin.json`が圧縮されて届くかを確かめます。

## 1回だけ行う設定

DNSのレコードとGitHub Pagesの設定は、1回だけ手で行います。
内容は[MANUAL_SETUP.md](./MANUAL_SETUP.md)にあります。
