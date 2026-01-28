# Contributing to Sol-Flow

Sol-Flowへのコントリビューションを歓迎します！このドキュメントでは、プロジェクトへの貢献方法について説明します。

## 開発環境のセットアップ

### Prerequisites

- Node.js 18+
- pnpm

### Setup

```bash
# リポジトリをクローン
git clone https://github.com/cardene777/sol-flow.git
cd sol-flow

# 依存関係をインストール
cd app
pnpm install

# 開発サーバーを起動
pnpm dev
```

## コントリビューションの方法

### Issue

- バグ報告や機能リクエストは [Issues](https://github.com/cardene777/sol-flow/issues) から行ってください
- 既存のIssueを確認し、重複がないことを確認してください
- Issueテンプレートに従って記述してください

### Pull Request

1. リポジトリをForkする
2. フィーチャーブランチを作成する
   ```bash
   git checkout -b feature/amazing-feature
   ```
3. 変更をコミットする
   ```bash
   git commit -m 'Add amazing feature'
   ```
4. ブランチをプッシュする
   ```bash
   git push origin feature/amazing-feature
   ```
5. Pull Requestを作成する

### コミットメッセージ

以下の形式でコミットメッセージを書いてください：

```
<type>: <description>

[optional body]
```

#### Type

- `feat`: 新機能
- `fix`: バグ修正
- `docs`: ドキュメントの変更
- `style`: コードの意味に影響しない変更（空白、フォーマット等）
- `refactor`: バグ修正でも機能追加でもないコード変更
- `perf`: パフォーマンス改善
- `test`: テストの追加・修正
- `chore`: ビルドプロセスやツールの変更

#### 例

```
feat: Add proxy pattern detection for ERC-7546

- Detect ERC-7546 proxy pattern in contracts
- Group related contracts in the diagram
- Add visual indicator for proxy relationships
```

## コードスタイル

### TypeScript

- ESLintの設定に従ってください
- 型を明示的に定義してください
- `any`型の使用は避けてください

### React

- 関数コンポーネントを使用してください
- Hooksを適切に使用してください
- コンポーネントは単一責任の原則に従ってください

### CSS

- Tailwind CSSを使用してください
- カスタムCSSは最小限にしてください
- レスポンシブデザインを考慮してください

## ディレクトリ構造

```
app/src/
├── app/            # Next.js App Router
├── components/     # Reactコンポーネント
│   ├── Canvas/     # ダイアグラム関連
│   ├── Layout/     # レイアウト（Header, Sidebar等）
│   ├── FunctionFlow/  # 関数フロー表示
│   └── ...
├── lib/            # ユーティリティ、パーサー
├── types/          # 型定義
└── utils/          # ヘルパー関数
```

## テスト

現在テストは未実装ですが、将来的に追加予定です。

## ライセンス

コントリビューションは [MIT License](LICENSE) の下でライセンスされます。

## 質問

質問がある場合は、[Discussions](https://github.com/cardene777/sol-flow/discussions) または [Issues](https://github.com/cardene777/sol-flow/issues) でお気軽にどうぞ。

---

Thank you for contributing to Sol-Flow! 🎉
