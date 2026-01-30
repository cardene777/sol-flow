<p align="center">
  <img src="../docs/images/logo.png" alt="Sol-Flow Logo" width="120" />
</p>

<h1 align="center">Sol-Flow</h1>

<p align="center">
  <strong>Solidityスマートコントラクトのインタラクティブ可視化ツール</strong>
</p>

<p align="center">
  <a href="https://github.com/cardene777/sol-flow/blob/main/LICENSE">
    <img src="https://img.shields.io/badge/license-Non--Commercial-red.svg" alt="License: Non-Commercial" />
  </a>
  <a href="https://github.com/cardene777/sol-flow">
    <img src="https://img.shields.io/github/stars/cardene777/sol-flow?style=social" alt="GitHub Stars" />
  </a>
</p>

<p align="center">
  <a href="#機能">機能</a> •
  <a href="#デモ">デモ</a> •
  <a href="#はじめに">はじめに</a> •
  <a href="#使い方">使い方</a> •
  <a href="#内蔵ライブラリ">内蔵ライブラリ</a> •
  <a href="../docs/ja/guides/README.md">ガイド</a> •
  <a href="#コントリビュート">コントリビュート</a> •
  <a href="../README.md">English</a>
</p>

---

## 概要

Sol-Flowは、Solidityスマートコントラクトの**依存関係**、**継承構造**、**関数呼び出しフロー**をインタラクティブな図として可視化するWebベースのツールです。

複雑なコードベースの理解を助け、セキュリティレビューを効率化します。

## 機能

### 🔗 継承関係の可視化
コントラクト間の継承・実装関係を視覚的に表示。OpenZeppelin等のライブラリとの関係も一目で把握できます。

### 📊 関数フロー図
関数をクリックすると、内部呼び出しのフローを実際のソースコードと共に図解表示します。

### 🔍 プロキシパターン検出
ERC-7546、UUPS、Transparent、Diamond、Beacon等のプロキシパターンを自動検出し、グループ化して表示します。

### 🎯 スマート検索
コントラクト名、関数名、イベント名で素早く検索。大規模なコードベースでも目的の場所にすぐアクセスできます。

### 📁 簡単インポート
Solidityファイルをドラッグ&ドロップするだけ。外部ライブラリ（OpenZeppelin、Solady等）は自動解決されます。

### 📚 ライブラリ内蔵
OpenZeppelin、Solady等の主要ライブラリがプリロード済み。すぐに参照できます。

### ✏️ 編集モード
静的解析では捉えられない関係性をカスタムエッジで追加できます。プロキシ関係やクロスコントラクトの相互作用をドキュメント化するのに最適です。

### 📝 ソースコードビューア
Solidityシンタックスハイライト付きでコントラクトの完全なソースコードを表示。コメント、インポート、NatSpecドキュメントも適切にカラーリングされます。

## デモ

🌐 **ライブデモ**: [https://sol-flow.vercel.app](https://sol-flow.vercel.app)

## はじめに

### 必要条件

- Node.js 18+
- pnpm

### インストール

```bash
# サブモジュールを含めてリポジトリをクローン
git clone --recurse-submodules https://github.com/cardene777/sol-flow.git
cd sol-flow

# サブモジュールなしでクローン済みの場合:
git submodule update --init --recursive

# 依存関係をインストール
cd app
pnpm install

# 開発サーバーを起動
pnpm dev
```

ブラウザで [http://localhost:3000](http://localhost:3000) を開きます。

## 使い方

### 1. コントラクトをインポート

「Import」ボタンをクリックし、Solidityファイル（.sol）をドラッグ&ドロップまたは選択してアップロードします。

```
src/
├── MyToken.sol
├── Governance.sol
└── Treasury.sol
```

### 2. ダイアグラムを探索

自動生成された依存関係図を操作します：

- **マウスホイール**: ズームイン/アウト
- **ドラッグ**: ビューをパン（移動）
- **コントラクトをクリック**: 詳細を展開/折りたたみ
- **サイドバー**: カテゴリでフィルタリング

### 3. 関数フローを表示

展開したコントラクト内の関数名をクリックすると、詳細なコールフローとソースコードが表示されます。

| アイコン | 説明 |
|:---:|---|
| 🟢 | external view/pure |
| 🟠 | external write |
| 🟣 | internal |

### 4. 編集モード（プロジェクトのみ）

編集モードを有効にすると、コントラクト間にカスタム関係エッジを追加できます。変更はプロジェクトに保存されます。

## 内蔵ライブラリ

以下のライブラリがプリロード済みです：

| ライブラリ | 説明 |
|---|---|
| **OpenZeppelin Contracts** | 業界標準のスマートコントラクトライブラリ |
| **OpenZeppelin Upgradeable** | プロキシパターン対応のアップグレード可能なコントラクト |
| **Solady** | ガス最適化されたSolidityスニペット |

ヘッダーの「Projects」ボタンからライブラリを切り替えできます。

## 技術スタック

| カテゴリ | 技術 |
|---|---|
| フレームワーク | Next.js 15 (App Router) |
| UI | React 19, Tailwind CSS |
| グラフ | React Flow |
| パーサー | @solidity-parser/parser |
| 言語 | TypeScript |

## プロジェクト構造

```
sol-flow/
├── app/                    # Next.js アプリケーション
│   ├── src/
│   │   ├── app/            # App Router (ページ)
│   │   ├── components/     # React コンポーネント
│   │   ├── lib/            # パーサー、ユーティリティ
│   │   ├── constants/      # アプリケーション定数
│   │   ├── types/          # 型定義
│   │   └── utils/          # ヘルパー関数
│   └── package.json
├── library/                # 内蔵ライブラリソース (Git submodules)
│   ├── openzeppelin-contracts/
│   ├── openzeppelin-contracts-upgradeable/
│   └── solady/
├── docs/                   # ドキュメント
└── README.md
```

## コントリビュート

コントリビューションを歓迎します！

1. リポジトリをフォーク
2. フィーチャーブランチを作成 (`git checkout -b feature/amazing-feature`)
3. 変更をコミット (`git commit -m 'Add amazing feature'`)
4. ブランチにプッシュ (`git push origin feature/amazing-feature`)
5. プルリクエストを開く

詳細は [CONTRIBUTING.md](CONTRIBUTING.md) をご覧ください。（[English](../CONTRIBUTING.md)）

## ライセンス

このプロジェクトは **Sol-Flow Non-Commercial Open Source License** の下でライセンスされています。

- ❌ 商用利用禁止
- ✅ 非商用利用可
- ✅ 改変可（同じライセンスで共有必須）
- ✅ ネットワーク/SaaS利用可（ソースコード開示必須）

詳細は [LICENSE](../LICENSE) ファイルをご覧ください。商用ライセンスについては、作者にお問い合わせください。

## 謝辞

- [OpenZeppelin](https://openzeppelin.com/) - スマートコントラクトライブラリ
- [Solady](https://github.com/Vectorized/solady) - ガス最適化されたSolidityスニペット
- [React Flow](https://reactflow.dev/) - グラフ可視化ライブラリ

---

<p align="center">
  Made with ❤️ for the Solidity community
</p>
