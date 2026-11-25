# static-hosting

| Criterion | How to check | Origin |
|---|---|---|
| `pnpm build`を回すと、`app/out/`に`index.html`と`app/index.html`が書き出されて正常に終わる | `bash app/tests/static-export.sh` check `build-writes-out` passes | #13 |
| `app/src/app/api/`の下にRoute Handlerの`route.ts`が1つも無い | `bash app/tests/static-export.sh` check `no-api-routes` passes | #13 |
| `build`を回すと、ライブラリ8種の図が`app/out/libraries/<id>.json`として書き出される | `bash app/tests/static-export.sh` check `library-json-written` passes | #13 |
| サンプルのライブラリ (`sample-uups`など) の`.json`は、今の`GET /api/libraries/[id]`と同じく、依存するライブラリの契約を含む | `pnpm --dir app test` check `sample-library-merges-dependencies` passes | #13 |
| `build`を回すと、`app/out/`に`CNAME` (中身は`sol-flow.cardene.dev`) と`.nojekyll`が入る | `bash app/tests/static-export.sh` check `cname-and-nojekyll` passes | #13 |
| `app/out/index.html`のOGP画像のURLが`https://sol-flow.cardene.dev`で始まる | `bash app/tests/static-export.sh` check `metadata-base-is-custom-domain` passes | #13 |
| 解析の`Web Worker`は、`.sol`のfileを受け取ると呼び出し図を返す | `pnpm --dir app test` check `worker-returns-call-graph` passes | #13 |
| 解析の`Web Worker`は、契約を1つも含まないfileを受け取ると、呼び出し図を返さずにエラーを返す | `pnpm --dir app test` check `worker-refuses-no-contracts` passes | #13 |
| アップロード画面と再解析は`/api/parse`を呼ばず、`Web Worker`へ解析を渡す | `bash app/tests/static-export.sh` check `no-api-fetch` passes | #13 |
| OpenZeppelinだけを`import`する`.sol`の解析では、OpenZeppelinのJSONを読み、SoladyとUpgradeableのJSONを読まない | `pnpm --dir app test` check `loads-only-imported-libraries` passes | #13 |
| 同じ`.sol`を解析した呼び出し図は、組み替えの前と同じ契約と関数と依存を持つ | `pnpm --dir app test` check `parse-output-unchanged` passes | #13 |
| `pnpm --dir app deploy:pages`が、`build`した`app/out/`を`gh-pages`ブランチへpushする命令として`app/package.json`にある | `bash app/tests/static-export.sh` check `deploy-script-exists` passes | #13 |
| repoに`.github/workflows/`のfileが無い | `bash app/tests/static-export.sh` check `no-workflows` passes | #13 |
| repoに`vercel.json`が無い | `bash app/tests/static-export.sh` check `no-vercel-json` passes | #13 |
| repoの文書に`sol-flow.vercel.app`が残らず、公開先は`https://sol-flow.cardene.dev`を指す | `bash app/tests/static-export.sh` check `docs-link-custom-domain` passes | #13 |
| `docs/API.md`と`docs/ja/API.md`は、消した`/api/parse`と`/api/libraries`をサーバーのAPIとして書かない | `bash app/tests/static-export.sh` check `api-docs-updated` passes | #13 |
