<p align="center">
  <img src="docs/images/logo.png" alt="Sol-Flow Logo" width="120" />
</p>

<h1 align="center">Sol-Flow</h1>

<p align="center">
  <strong>Solidityスマートコントラクトを可視化して理解を深める</strong>
</p>

<p align="center">
  <a href="https://github.com/cardene777/sol-flow/blob/main/LICENSE">
    <img src="https://img.shields.io/badge/license-MIT-blue.svg" alt="License: MIT" />
  </a>
  <a href="https://github.com/cardene777/sol-flow">
    <img src="https://img.shields.io/github/stars/cardene777/sol-flow?style=social" alt="GitHub Stars" />
  </a>
</p>

<p align="center">
  <a href="#features">Features</a> •
  <a href="#demo">Demo</a> •
  <a href="#getting-started">Getting Started</a> •
  <a href="#usage">Usage</a> •
  <a href="#built-in-libraries">Built-in Libraries</a> •
  <a href="#contributing">Contributing</a>
</p>

---

## Overview

Sol-Flowは、Solidityスマートコントラクトの**依存関係**、**継承構造**、**関数フロー**をインタラクティブな図として可視化するツールです。

複雑なコードベースの理解を助け、セキュリティレビューを効率化します。

<p align="center">
  <img src="docs/images/screenshot.png" alt="Sol-Flow Screenshot" width="800" />
</p>

## Features

### 🔗 継承関係の可視化
コントラクト間の継承・実装関係を視覚的に表示。OpenZeppelin等のライブラリとの関係も一目で把握できます。

### 📊 関数フロー図
関数をクリックすると、内部呼び出しのフローを図解表示。実際のソースコードと共に確認できます。

### 🔍 プロキシパターン検出
ERC-7546、UUPS、Transparent、Diamond、Beacon等のプロキシパターンを自動検出し、グループ化して表示します。

### 🎯 スマート検索
コントラクト名、関数名、イベント名で素早く検索。大規模なコードベースでも目的の場所にすぐアクセスできます。

### 📁 簡単インポート
Solidityファイルをドラッグ&ドロップするだけ。外部ライブラリ（OpenZeppelin、Solady等）は自動解決されます。

### 📚 ライブラリ内蔵
OpenZeppelin、Solady、Avalanche ICM等の主要ライブラリがプリロード済み。すぐに参照できます。

## Demo

🌐 **Live Demo**: [https://sol-flow.vercel.app](https://sol-flow.vercel.app)

## Getting Started

### Prerequisites

- Node.js 18+
- pnpm

### Installation

```bash
# Clone the repository with submodules
git clone --recurse-submodules https://github.com/cardene777/sol-flow.git
cd sol-flow

# If you already cloned without submodules, run:
git submodule update --init --recursive

# Install dependencies
cd app
pnpm install

# Start the development server
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## Usage

### 1. Import Contracts

右上の「Import」ボタンをクリックし、Solidityファイル（.sol）をドラッグ&ドロップまたは選択してアップロードします。

```
src/
├── MyToken.sol
├── Governance.sol
└── Treasury.sol
```

### 2. Explore the Diagram

自動生成された依存関係図を確認します。

- **マウスホイール**: ズーム
- **ドラッグ**: パン（移動）
- **クリック**: コントラクトを展開/折りたたみ
- **サイドバー**: カテゴリフィルター

### 3. View Function Flow

展開したコントラクト内の関数名をクリックすると、詳細なフロー図とソースコードが表示されます。

| アイコン | 説明 |
|:---:|---|
| 🟢 | external view/pure |
| 🟠 | external write |
| 🟣 | internal |

## Built-in Libraries

以下のライブラリがプリロード済みです：

| ライブラリ | 説明 |
|---|---|
| **OpenZeppelin Contracts** | 業界標準のスマートコントラクトライブラリ |
| **OpenZeppelin Upgradeable** | プロキシパターン対応のアップグレード可能なコントラクト |
| **Solady** | ガス最適化されたSolidityスニペット |
| **Avalanche Teleporter** | Avalanche間のクロスチェーンメッセージング |
| **Avalanche ICTT** | Interchain Token Transfer |
| **Avalanche Validator Manager** | バリデータ管理 |

ヘッダーの「Projects」ボタンから切り替え可能です。

## Tech Stack

| Category | Technology |
|---|---|
| Framework | Next.js 15 (App Router) |
| UI | React 19, Tailwind CSS |
| Graph | React Flow |
| Parser | @solidity-parser/parser |
| Language | TypeScript |

## Project Structure

```
sol-flow/
├── app/                    # Next.js アプリケーション
│   ├── src/
│   │   ├── app/            # App Router (pages)
│   │   ├── components/     # React コンポーネント
│   │   ├── lib/            # パーサー、ユーティリティ
│   │   ├── types/          # 型定義
│   │   └── utils/          # ヘルパー関数
│   └── package.json
├── library/                # ビルトインライブラリソース (Git submodules)
│   ├── openzeppelin-contracts/
│   ├── openzeppelin-contracts-upgradeable/
│   ├── solady/
│   └── icm-services/
├── docs/                   # ドキュメント
└── README.md
```

## Contributing

コントリビューションを歓迎します！

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

詳細は [CONTRIBUTING.md](CONTRIBUTING.md) をご覧ください。

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Acknowledgments

- [OpenZeppelin](https://openzeppelin.com/) - Smart contract library
- [Solady](https://github.com/Vectorized/solady) - Gas optimized Solidity snippets
- [React Flow](https://reactflow.dev/) - Graph visualization library
- [Avalanche](https://www.avax.network/) - ICM libraries

---

<p align="center">
  Made with ❤️ for the Solidity community
</p>
