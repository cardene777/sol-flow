# 内蔵ライブラリ

Sol-Flowの内蔵ライブラリシステムと新しいライブラリの追加方法のドキュメント。

## 目次

- [概要](#概要)
- [利用可能なライブラリ](#利用可能なライブラリ)
- [ライブラリ構造](#ライブラリ構造)
- [新しいライブラリの追加](#新しいライブラリの追加)
- [ライブラリデータの再生成](#ライブラリデータの再生成)
- [APIエンドポイント](#apiエンドポイント)

---

## 概要

Sol-Flowには、ファイルをアップロードせずに探索できるプリパース済みSolidityライブラリが含まれています。これらのライブラリはパース済みの`CallGraph`データを含むJSONファイルとして保存されています。

### メリット

- **即時探索**: アップロードやパースが不要
- **高速読み込み**: 事前計算済みデータの高速読み込み
- **リファレンス資料**: OpenZeppelin、Solady、Avalanche ICMの実装を探索

---

## 利用可能なライブラリ

| ライブラリ | ID | 説明 |
|----------|------|------|
| OpenZeppelin Contracts | `openzeppelin` | 業界標準スマートコントラクトライブラリ（v5.0.0） |
| OpenZeppelin Upgradeable | `openzeppelin-upgradeable` | アップグレード可能なコントラクトバリアント |
| Solady | `solady` | ガス最適化されたSolidityスニペット |
| Avalanche Teleporter | `avalanche-teleporter` | Avalanche向けクロスチェーンメッセージング |
| Avalanche ICTT | `avalanche-ictt` | インターチェーントークン転送 |
| Avalanche Validator Manager | `avalanche-validator-manager` | バリデータ管理コントラクト |

---

## ライブラリ構造

### ソースコードの場所

ライブラリのソースコードは`library/`ディレクトリにGitサブモジュールとして保存:

```
library/
├── openzeppelin-contracts/          # OpenZeppelin Contracts
├── openzeppelin-contracts-upgradeable/  # OZ Upgradeable
├── solady/                          # Solady
└── icm-services/                    # Avalanche ICM
```

### プリパース済みデータ

パース済みライブラリデータは`app/src/data/libraries/`に保存:

```
app/src/data/libraries/
├── openzeppelin-parsed.json         # ~1MB
├── openzeppelin-upgradeable-parsed.json  # ~1.2MB
├── solady-parsed.json               # ~800KB
├── avalanche-teleporter-parsed.json
├── avalanche-ictt-parsed.json
└── avalanche-validator-manager-parsed.json
```

### JSON構造

各JSONファイルには完全な`CallGraph`が含まれます:

```typescript
{
  "version": "1.0.0",
  "generatedAt": "2024-01-15T12:00:00.000Z",
  "projectName": "OpenZeppelin Contracts",
  "structure": { /* DirectoryNodeツリー */ },
  "contracts": [ /* Contract[] */ ],
  "dependencies": [ /* Dependency[] */ ],
  "proxyGroups": [ /* ProxyGroup[] */ ],
  "stats": {
    "totalContracts": 150,
    "totalLibraries": 45,
    "totalInterfaces": 80,
    "totalFunctions": 1200
  }
}
```

---

## 新しいライブラリの追加

### ステップ1: ソースコードの追加

ライブラリをGitサブモジュールとして追加:

```bash
cd sol-flow/library
git submodule add https://github.com/example/library.git example-library
```

### ステップ2: 再生成スクリプトの更新

`app/scripts/regenerate-libraries.mjs`を編集:

```javascript
const LIBRARIES = [
  // ... 既存のライブラリ ...
  {
    id: 'example-library',
    name: 'Example Library',
    version: '1.0.0',
    sourcePath: '../library/example-library/contracts',
    outputPath: './src/data/libraries/example-library-parsed.json',
    // オプション: インポート用のパスリマッピング
    remappings: {
      '@example/': '../library/example-library/',
    },
  },
];
```

### ステップ3: ライブラリメタデータの定義

`app/src/constants/libraries.ts`を更新:

```typescript
export const LIBRARIES = [
  // ... 既存のライブラリ ...
  {
    id: 'example-library',
    name: 'Example Library',
    version: '1.0.0',
    description: 'ライブラリの説明',
  },
];
```

### ステップ4: APIルートの更新

`app/src/app/api/libraries/[id]/route.ts`を編集:

```typescript
import exampleLibraryData from '@/data/libraries/example-library-parsed.json';

const LIBRARY_DATA: Record<string, any> = {
  // ... 既存のライブラリ ...
  'example-library': exampleLibraryData,
};
```

### ステップ5: データの再生成

```bash
cd sol-flow/app
pnpm run regenerate-libraries
```

---

## ライブラリデータの再生成

### 再生成が必要な場合

- ライブラリサブモジュールを新しいバージョンに更新した後
- パーサーロジックを修正した後
- 新しいライブラリを追加した後

### 再生成コマンド

```bash
cd sol-flow/app
pnpm run regenerate-libraries
```

### スクリプトの詳細

再生成スクリプト（`app/scripts/regenerate-libraries.mjs`）:

1. ライブラリソースディレクトリからすべての`.sol`ファイルを読み込み
2. Solidityパーサーを使用して各ファイルをパース
3. コントラクトに`isExternalLibrary: true`と`librarySource`をマーク
4. 完全なCallGraphを構築
5. 完全なソースコードを含むJSON出力を書き込み

### スクリプト設定

```javascript
// ライブラリごとの設定
{
  id: 'openzeppelin',
  name: 'OpenZeppelin Contracts',
  version: '5.0.0',
  sourcePath: '../library/openzeppelin-contracts/contracts',
  outputPath: './src/data/libraries/openzeppelin-parsed.json',
  librarySource: 'openzeppelin',  // librarySourceフィールドに使用
  exclude: [
    'mocks',      // テストモックを除外
    'test',       // テストユーティリティを除外
  ],
}
```

---

## APIエンドポイント

### ライブラリ一覧

```
GET /api/libraries
```

レスポンス:
```json
{
  "libraries": [
    { "id": "openzeppelin", "name": "OpenZeppelin Contracts", "version": "5.0.0" },
    { "id": "solady", "name": "Solady", "version": "latest" }
  ]
}
```

### ライブラリデータの取得

```
GET /api/libraries/[id]
```

レスポンス:
```json
{
  "library": {
    "id": "openzeppelin",
    "name": "OpenZeppelin Contracts",
    "version": "5.0.0"
  },
  "callGraph": { /* CallGraphデータ */ }
}
```

### デフォルトライブラリの取得

```
GET /api/libraries/default
```

OpenZeppelin Contracts（デフォルトライブラリ）を返します。

---

## ライブラリソースフィールド

ライブラリからのコントラクトには追加フィールドがあります:

```typescript
interface Contract {
  // ... 標準フィールド ...

  isExternalLibrary?: boolean;  // ライブラリコントラクトの場合true
  librarySource?: 'openzeppelin' | 'openzeppelin-upgradeable' | 'solady' | 'avalanche-icm';
}
```

これらのフィールドは以下に使用:
- コントラクトノードにライブラリバッジを表示
- サイドバーでライブラリコントラクトのフィルタリングを有効化
- ユーザーコントラクトとライブラリコントラクトを区別

---

## サブモジュール管理

### サブモジュールの初期化

```bash
git submodule update --init --recursive
```

### すべてのサブモジュールを更新

```bash
git submodule update --remote --merge
```

### 特定のサブモジュールを更新

```bash
cd library/openzeppelin-contracts
git fetch origin
git checkout v5.0.0  # または特定のタグ
cd ../..
git add library/openzeppelin-contracts
git commit -m "Update OpenZeppelin to v5.0.0"
```
