# Contributing to Sol-Flow

Sol-Flowへのコントリビューションを歓迎します！このドキュメントでは、プロジェクトへの貢献方法について説明します。

[English](../CONTRIBUTING.md)

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

### Issue駆動開発

すべての作業はIssueから始めます：

1. **Issueを作成** - 適切なテンプレートを使用
   - `[Feature]` - 新機能・機能拡張
   - `[Bug]` - バグ報告・修正

2. **Issueに記載する内容**
   - 作業の明確な説明
   - 設計・実装メモ
   - 受け入れ基準（Acceptance Criteria）
   - 影響を受けるコンポーネント

### ブランチ命名規則

`main`から以下の形式でブランチを作成：

```
<type>/#<issue-number>-<short-description>
```

**Type:**
- `feature/` - 新機能
- `fix/` - バグ修正
- `refactor/` - リファクタリング
- `docs/` - ドキュメント更新
- `chore/` - メンテナンス

**例:**
```bash
git checkout -b feature/#42-add-search-filter
git checkout -b fix/#15-zoom-calculation
git checkout -b docs/#23-update-readme
```

### Pull Request

1. ブランチを最新の`main`に更新
2. PRを作成（明確なタイトルと説明）
3. 関連Issueをリンク（`Fixes #<number>`）
4. PRテンプレートのチェックリストを確認
5. 必要に応じてレビューをリクエスト

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

## リリースプロセス

[Semantic Versioning](https://semver.org/)を使用：
- **MAJOR** (1.0.0): 破壊的変更
- **MINOR** (0.1.0): 新機能（後方互換）
- **PATCH** (0.0.1): バグ修正

### リリース手順

1. `CHANGELOG.md`を更新
2. gitタグを作成：
   ```bash
   git tag -a v1.0.0 -m "Release v1.0.0"
   git push origin v1.0.0
   ```
3. タグからGitHub Releaseを作成
4. CHANGELOGからリリースノートをコピー

## ライセンス

コントリビューションは [Sol-Flow Non-Commercial Open Source License](../LICENSE) の下でライセンスされます。

## 質問

質問がある場合は、[Discussions](https://github.com/cardene777/sol-flow/discussions) または [Issues](https://github.com/cardene777/sol-flow/issues) でお気軽にどうぞ。

---

Thank you for contributing to Sol-Flow! 🎉
