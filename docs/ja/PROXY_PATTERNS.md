# プロキシパターン検出

Sol-Flowがプロキシパターンを検出しグループ化する方法の技術ドキュメント。

## 目次

- [概要](#概要)
- [対応パターン](#対応パターン)
- [検出アルゴリズム](#検出アルゴリズム)
- [グループ化ロジック](#グループ化ロジック)
- [ERC-7546の詳細](#erc-7546の詳細)

---

## 概要

Sol-Flowは以下を分析してプロキシパターンを自動検出:
- コントラクト名
- ファイルパスとディレクトリ構造
- 関数名
- イベント名
- 継承関係

### パターンタイプ

```typescript
type ProxyPatternType =
  | 'eip7546'      // Meta Contract / Borderless
  | 'uups'         // UUPS Upgradeable（EIP-1822）
  | 'transparent'  // Transparent Proxy
  | 'diamond'      // Diamond（EIP-2535）
  | 'beacon';      // Beacon Proxy
```

### ロール

```typescript
type ProxyRole =
  | 'proxy'          // ユーザー向けプロキシコントラクト
  | 'dictionary'     // 関数レジストリ（ERC-7546）
  | 'implementation' // ロジック/ファセットコントラクト
  | 'beacon'         // 実装アドレスを保持するビーコン
  | 'facet';         // Diamondファセット
```

---

## 対応パターン

### ERC-7546（Meta Contract / Borderless）

**アーキテクチャ:**
```
ユーザー → Proxy → Dictionary → Implementation(s)
```

**検出基準:**

| ロール | 基準 |
|--------|------|
| Dictionary | 名前: `Dictionary`、`DictionaryCore`<br>パス: `/dictionary/`<br>イベント: `DictionaryUpgraded`<br>関数: `bulkSetImplementation` |
| Proxy | 関数: `getDictionary`<br>名前: `BorderlessProxy` |
| Implementation | パス: `/functions/`ディレクトリ |

---

### UUPS（EIP-1822）

**アーキテクチャ:**
```
ユーザー → Proxy（データ保存） → Implementation（ロジック保存）
```

**検出基準:**

| ロール | 基準 |
|--------|------|
| Proxy | 関数: `upgradeTo`、`upgradeToAndCall`<br>継承: `ERC1967Proxy` |
| Implementation | 関数: `proxiableUUID`、`_authorizeUpgrade`<br>継承: `UUPSUpgradeable` |

---

### Transparent Proxy

**アーキテクチャ:**
```
ユーザー → Proxy → Implementation
管理者 → Proxy（管理者関数）
```

**検出基準:**

| ロール | 基準 |
|--------|------|
| Proxy | 継承: `TransparentUpgradeableProxy`<br>関数: `admin` |
| Implementation | （関係により決定） |

---

### Diamond（EIP-2535）

**アーキテクチャ:**
```
ユーザー → Diamond → Facet(s)
```

**検出基準:**

| ロール | 基準 |
|--------|------|
| Diamond | 関数: `diamondCut`、`facets`、`facetAddress`<br>イベント: `DiamondCut`<br>名前に`diamond`を含む |
| Facet | パス: `/facets/`<br>名前に`facet`を含む |
| Library | 名前: `LibDiamond` |

---

### Beacon Proxy

**アーキテクチャ:**
```
ユーザー → BeaconProxy → Beacon → Implementation
```

**検出基準:**

| ロール | 基準 |
|--------|------|
| Beacon | 継承: `UpgradeableBeacon`<br>関数: beacon名と共に`implementation` |
| Proxy | 継承: `BeaconProxy` |

---

## 検出アルゴリズム

### メイン検出関数

```typescript
function detectProxyPattern(contract: Contract): {
  pattern?: ProxyPatternType;
  role?: ProxyRole;
}
```

### 検出順序

アルゴリズムは以下の順序でパターンをチェック（誤検出を防ぐため重要）:

1. **ERC-7546 Dictionary** - 最も特定的なパターンを最初に
2. **ERC-7546 Proxy**
3. **ERC-7546 Implementation**（ディレクトリベース）
4. **UUPS** - 関数/継承ベース
5. **Diamond** - 関数/イベントベース
6. **Beacon** - 名前/継承ベース
7. **Transparent** - 継承ベース

### 誤検出防止

ERC-7546検出は他のパターンとの混同を避けるため厳格:

```typescript
// 以下の一般的な関数に基づいてERC-7546を検出しない:
// - setImplementation（UUPS、Transparentにもある）
// - getImplementation（UUPS、Beaconにもある）

// ERC-7546固有の指標のみ使用:
// - /functions/ディレクトリ構造
// - bulkSetImplementation関数
// - DictionaryUpgradedイベント
// - getDictionary関数
```

---

## グループ化ロジック

### ProxyGroup構造

```typescript
interface ProxyGroup {
  id: string;
  name: string;
  patternType: ProxyPatternType;
  proxy?: string;
  dictionary?: string;
  implementations: string[];
  beacon?: string;
}
```

### モジュール抽出

ERC-7546では、パスからモジュールを抽出:

```typescript
// パス: "sc/ERC721/functions/ERC721.sol"
// モジュール: "ERC721"

// パス: "sc/Services/Token/LETS/functions/LETS.sol"
// モジュール: "LETS"
```

### グループ作成プロセス

1. **第1パス**: すべてのコントラクトのパターンとロールを検出

2. **ERC-7546コアグループ**:
   - Dictionary + Proxy用の単一グループを作成
   - ID: `proxy-group-core`
   - 名前: `ERC7546 Core`

3. **ERC-7546モジュールグループ**:
   - 実装をベースディレクトリでグループ化
   - 関連ライブラリを含む
   - コアDictionary/Proxyを参照

4. **その他のパターン**:
   - 各プロキシコントラクトにグループを作成
   - 検出された実装にリンク

---

## ERC-7546の詳細

### ディレクトリ構造

ERC-7546プロジェクトの期待される構造:

```
project/
├── core/
│   ├── Dictionary.sol
│   └── BorderlessProxy.sol
├── ERC721/
│   ├── functions/
│   │   ├── ERC721.sol
│   │   ├── ERC721Metadata.sol
│   │   └── ERC721Enumerable.sol
│   ├── libs/
│   │   └── ERC721Lib.sol
│   └── interfaces/
│       └── IERC721.sol
└── Token/
    └── functions/
        └── Token.sol
```

### モジュールベースディレクトリ

```typescript
function getModuleBaseDir(filePath: string): string | null {
  const specialDirs = ['functions', 'libs', 'interfaces', 'storages', 'tests'];

  for (const special of specialDirs) {
    const idx = parts.findIndex(p => p.toLowerCase() === special);
    if (idx > 0) {
      return parts.slice(0, idx).join('/');
    }
  }

  return null;
}
```

### 関連コントラクトの検出

同じモジュール内のコントラクトは自動的にグループ化:

| ディレクトリ | 含まれる先 |
|-------------|-----------|
| `/functions/` | メイン実装 |
| `/libs/` | ライブラリ実装 |
| `/interfaces/` | 参照されるが実装ではない |
| `/storages/` | ストレージコントラクト |

---

## 可視化

### グループノード

検出されたプロキシグループは以下のように可視化:
- 関連コントラクトを含む専用グループノード
- パターンタイプの視覚的インジケータ
- 色分けされた関係

### エッジタイプ

| 関係 | エッジタイプ |
|------|-------------|
| Proxy → Implementation | `delegatecall` |
| Dictionary → Implementation | `registers` |
| Proxy → Dictionary | `uses` |
| Proxy → Beacon | `uses` |
| Beacon → Implementation | `delegatecall` |
