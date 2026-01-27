# Sol-Flow Design System

## Design Concept: "Circuit Blueprint"

スマートコントラクトは「デジタル回路」のようなもの。関数の呼び出しチェーンは電気信号の流れに似ている。この概念を視覚言語に落とし込む。

**トーン**: 回路図 × テクニカルドキュメント × ダークモードIDE

---

## 技術スタック

| カテゴリ | 選定 | 理由 |
|---------|------|------|
| ビルドツール | **Vite** | 完全クライアントサイド、軽量、GitHub Pages対応 |
| フレームワーク | React 18 | React Flow との親和性 |
| 言語 | TypeScript | 型安全性 |
| スタイリング | Tailwind CSS | ユーティリティファースト |
| ダイアグラム | React Flow | ノードベースグラフ |
| 状態管理 | Zustand | 軽量 |
| アニメーション | Framer Motion | 高品質トランジション |

---

## Color Palette

### Base Colors (Deep Navy)

```css
:root {
  /* Background Layers */
  --bg-primary: #0a0e1a;      /* 最深部 */
  --bg-secondary: #0f1628;    /* キャンバス */
  --bg-tertiary: #151d35;     /* カード背景 */
  --bg-elevated: #1a2444;     /* ノード背景 */
  --bg-hover: #1f2d54;        /* ホバー状態 */

  /* Blueprint Grid */
  --grid-line: rgba(64, 156, 255, 0.06);
  --grid-line-strong: rgba(64, 156, 255, 0.12);
}
```

### Semantic Colors (Function Types)

```css
:root {
  /* Primary Actions */
  --accent-primary: #00d4aa;     /* Mint - メインアクセント */
  --accent-primary-dim: rgba(0, 212, 170, 0.15);

  /* Function Visibility */
  --color-external: #00d4aa;     /* Mint - external/public */
  --color-internal: #a78bfa;     /* Lavender - internal/private */
  --color-library: #fbbf24;      /* Amber - library calls */

  /* Events & Errors */
  --color-event: #f472b6;        /* Pink - events */
  --color-error: #ef4444;        /* Red - errors/reverts */

  /* Dependencies */
  --color-inherit: #60a5fa;      /* Blue - inheritance */
  --color-implements: #818cf8;   /* Indigo - interface impl */
  --color-uses: #fbbf24;         /* Amber - library usage */
}
```

### Text Colors

```css
:root {
  --text-primary: #e2e8f0;       /* 主要テキスト */
  --text-secondary: #94a3b8;     /* 補助テキスト */
  --text-muted: #64748b;         /* 薄いテキスト */
  --text-accent: #00d4aa;        /* アクセントテキスト */
}
```

### Glow Effects

```css
:root {
  --glow-primary: 0 0 20px rgba(0, 212, 170, 0.3);
  --glow-purple: 0 0 20px rgba(167, 139, 250, 0.3);
  --glow-amber: 0 0 20px rgba(251, 191, 36, 0.3);
  --glow-blue: 0 0 20px rgba(96, 165, 250, 0.3);
}
```

---

## Typography

### Font Families

```css
@import url('https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;500;600;700&family=Outfit:wght@300;400;500;600;700&display=swap');

:root {
  --font-display: 'Outfit', sans-serif;
  --font-mono: 'JetBrains Mono', monospace;
}
```

| 用途 | フォント | ウェイト | サイズ |
|------|----------|----------|--------|
| ロゴ/タイトル | Outfit | 600 | 24px |
| セクション見出し | Outfit | 500 | 16px |
| 本文 | Outfit | 400 | 14px |
| コントラクト名 | JetBrains Mono | 600 | 14px |
| 関数名 | JetBrains Mono | 500 | 13px |
| シグネチャ | JetBrains Mono | 400 | 12px |
| ラベル/バッジ | Outfit | 500 | 11px |

---

## Layout Structure

```
┌─────────────────────────────────────────────────────────────────────────────┐
│  Header (h: 56px)                                                           │
│  ┌─────────┬─────────────────────────────────────┬────────────────────────┐ │
│  │  Logo   │  Search Bar                         │  Toolbar               │ │
│  └─────────┴─────────────────────────────────────┴────────────────────────┘ │
├────────────────┬────────────────────────────────────────────────────────────┤
│  Sidebar       │  Canvas                                                    │
│  (w: 280px)    │  (flex: 1)                                                 │
│                │                                                            │
│  ┌──────────┐  │  ┌────────────────────────────────────────────────────┐   │
│  │ Tree     │  │  │                                                    │   │
│  │ View     │  │  │   React Flow Canvas                                │   │
│  │          │  │  │   with Blueprint Grid                              │   │
│  │          │  │  │                                                    │   │
│  ├──────────┤  │  │   ┌─────────┐      ┌─────────┐                     │   │
│  │ Legend   │  │  │   │  Node   │──────│  Node   │                     │   │
│  │          │  │  │   └─────────┘      └─────────┘                     │   │
│  ├──────────┤  │  │                                                    │   │
│  │ Stats    │  │  │                                                    │   │
│  └──────────┘  │  └────────────────────────────────────────────────────┘   │
│                │                                                            │
└────────────────┴────────────────────────────────────────────────────────────┘
```

### Spacing Scale

```css
:root {
  --space-1: 4px;
  --space-2: 8px;
  --space-3: 12px;
  --space-4: 16px;
  --space-5: 20px;
  --space-6: 24px;
  --space-8: 32px;
  --space-10: 40px;
  --space-12: 48px;
}
```

---

## Component Design

### 1. Contract Node

```
╭───────────────────────────────╮
│ ▣ ERC721               token  │  ← Header: Icon + Name + Badge
├───────────────────────────────┤
│                               │
│  Read ────────────────────    │  ← Section Label (muted)
│   ○ balanceOf(address)        │
│   ○ ownerOf(uint256)          │
│   ○ getApproved(uint256)      │
│                               │
│  Write ───────────────────    │
│   ● transferFrom(...)         │  ← Hover: show full signature
│   ● approve(address,uint256)  │
│   ● setApprovalForAll(...)    │
│                               │
╰───────────────────────────────╯
```

**スタイル**:
```css
.contract-node {
  min-width: 240px;
  background: var(--bg-elevated);
  border: 1px solid rgba(0, 212, 170, 0.2);
  border-radius: 12px;
  box-shadow:
    0 0 0 1px rgba(0, 212, 170, 0.1),
    0 4px 24px rgba(0, 0, 0, 0.4),
    inset 0 1px 0 rgba(255, 255, 255, 0.05);
}

.contract-node:hover {
  border-color: rgba(0, 212, 170, 0.5);
  box-shadow:
    var(--glow-primary),
    0 8px 32px rgba(0, 0, 0, 0.5);
}

.contract-node.selected {
  border-color: var(--accent-primary);
  box-shadow:
    0 0 0 2px var(--accent-primary-dim),
    var(--glow-primary);
}
```

### 2. Library Node

```
┌ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ┐
  ◈ ERC721Lib          library
├ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ┤
│                              │
   ○ balanceOf()
   ○ update()
│  ○ mint()                    │
   ○ burn()
└ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ┘
```

**スタイル**: 破線ボーダー、Amberアクセント

### 3. Edge Types

| タイプ | スタイル | 色 |
|--------|----------|-----|
| inherits | 実線 + 三角矢印 | Blue (#60a5fa) |
| implements | 実線 + 空心矢印 | Indigo (#818cf8) |
| uses | 破線 | Amber (#fbbf24) |

**アニメーション**: 選択時にダッシュが流れる

```css
@keyframes dash-flow {
  to { stroke-dashoffset: -20; }
}

.edge.active {
  animation: dash-flow 1s linear infinite;
}
```

### 4. Function Flow Modal

```
╭─────────────────────────────────────────────────────────────────────╮
│  ERC721.transferFrom()                                       [×]    │
│  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━   │
│                                                                     │
│         ┌─────────────────────────────────┐                        │
│         │  📥 transferFrom(from, to, id)  │  Entry                 │
│         └───────────────┬─────────────────┘                        │
│                         │                                           │
│                         ▼                                           │
│         ┌─────────────────────────────────┐                        │
│         │  ⚠️ require: to != address(0)   │  Condition            │
│         └───────────────┬─────────────────┘                        │
│                         │                                           │
│         ┌───────────────▼─────────────────┐                        │
│         │  🔒 _update(to, tokenId, auth)  │  Internal              │
│         │  ┌─────────────────────────────┐│                        │
│         │  │ 📚 ERC721Lib.update()       ││  Library               │
│         │  │   ├─ _checkAuthorized()     ││                        │
│         │  │   ├─ _decreaseBalance()     ││                        │
│         │  │   └─ emit Transfer ─────────││──→ 📡 Event            │
│         │  └─────────────────────────────┘│                        │
│         └─────────────────────────────────┘                        │
│                                                                     │
│  ───────────────────────────────────────────────────────────────   │
│  🔵 Entry  🟣 Internal  🟡 Library  🩷 Event  🔴 Error              │
╰─────────────────────────────────────────────────────────────────────╯
```

### 5. Search Bar

```css
.search-bar {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 16px;
  background: var(--bg-tertiary);
  border: 1px solid transparent;
  border-radius: 8px;
  transition: all 0.2s ease;
}

.search-bar:focus-within {
  border-color: var(--accent-primary);
  box-shadow: 0 0 0 3px var(--accent-primary-dim);
}
```

---

## Background Design

### Blueprint Grid

```css
.canvas-background {
  background:
    /* Major grid lines (100px) */
    linear-gradient(var(--grid-line-strong) 1px, transparent 1px),
    linear-gradient(90deg, var(--grid-line-strong) 1px, transparent 1px),
    /* Minor grid lines (20px) */
    linear-gradient(var(--grid-line) 1px, transparent 1px),
    linear-gradient(90deg, var(--grid-line) 1px, transparent 1px),
    /* Base color */
    var(--bg-secondary);
  background-size:
    100px 100px,
    100px 100px,
    20px 20px,
    20px 20px;
}
```

### Optional: Noise Texture Overlay

```css
.canvas-background::after {
  content: '';
  position: absolute;
  inset: 0;
  background-image: url('/noise.png');
  opacity: 0.02;
  pointer-events: none;
}
```

---

## Interaction States

### Node States

| State | Visual Change |
|-------|---------------|
| Default | 標準スタイル |
| Hover | ボーダー明るく、シャドウ強調、グロー |
| Selected | プライマリカラーボーダー、強いグロー |
| Dimmed | opacity: 0.4 (非関連ノード) |
| Highlighted | パルスアニメーション |

### Function Item States

```css
.function-item {
  padding: 4px 8px;
  border-radius: 4px;
  cursor: pointer;
  transition: all 0.15s ease;
}

.function-item:hover {
  background: var(--bg-hover);
}

.function-item.view::before {
  content: '○';
  color: var(--color-external);
}

.function-item.write::before {
  content: '●';
  color: var(--color-external);
}
```

---

## Animation Guidelines

### Page Load

```css
/* Staggered reveal for nodes */
.contract-node {
  animation: fadeInUp 0.4s ease backwards;
}

.contract-node:nth-child(1) { animation-delay: 0.1s; }
.contract-node:nth-child(2) { animation-delay: 0.15s; }
.contract-node:nth-child(3) { animation-delay: 0.2s; }
/* ... */

@keyframes fadeInUp {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}
```

### Edge Connection Animation

```css
@keyframes draw-line {
  from { stroke-dashoffset: 1000; }
  to { stroke-dashoffset: 0; }
}

.edge path {
  stroke-dasharray: 1000;
  animation: draw-line 0.8s ease forwards;
}
```

### Modal Open/Close

```css
/* Using Framer Motion */
const modalVariants = {
  hidden: { opacity: 0, scale: 0.95, y: 20 },
  visible: {
    opacity: 1,
    scale: 1,
    y: 0,
    transition: { duration: 0.2, ease: 'easeOut' }
  },
  exit: {
    opacity: 0,
    scale: 0.95,
    transition: { duration: 0.15 }
  }
};
```

---

## Iconography

### Category Icons

| Category | Icon | Color |
|----------|------|-------|
| contract | `▣` (filled square) | Primary |
| library | `◈` (diamond) | Amber |
| interface | `◇` (hollow diamond) | Indigo |
| abstract | `▢` (hollow square) | Blue |

### Function Visibility Icons

| Visibility | Icon |
|------------|------|
| external/public view | `○` (hollow circle) |
| external/public write | `●` (filled circle) |
| internal view | `◦` (small hollow) |
| internal write | `•` (small filled) |

---

## Responsive Breakpoints

```css
:root {
  --breakpoint-sm: 640px;
  --breakpoint-md: 768px;
  --breakpoint-lg: 1024px;
  --breakpoint-xl: 1280px;
}
```

| Breakpoint | Layout |
|------------|--------|
| xl (>1280px) | Sidebar(280px) + Canvas + DetailPanel(320px) |
| lg (1024-1280px) | Sidebar(240px) + Canvas |
| md (768-1024px) | Collapsible Sidebar + Canvas |
| sm (<768px) | Canvas only + Bottom Sheet (将来対応) |

---

## Accessibility

- フォーカスリングは常に visible（`outline: 2px solid var(--accent-primary)`）
- カラーコントラスト比: WCAG AA 準拠
- キーボードナビゲーション: Tab/Enter/Escape
- スクリーンリーダー: 適切な aria-label

---

## File Structure (Design Assets)

```
src/
├── styles/
│   ├── globals.css          # CSS変数、リセット、基本スタイル
│   ├── components.css       # コンポーネント固有スタイル（必要に応じて）
│   └── animations.css       # アニメーション定義
├── assets/
│   └── noise.png            # ノイズテクスチャ（オプション）
└── components/
    └── ui/                  # 再利用可能UIコンポーネント
        ├── Badge.tsx
        ├── Button.tsx
        ├── Modal.tsx
        └── Tooltip.tsx
```

---

## Design Tokens (Tailwind Config)

```javascript
// tailwind.config.js
export default {
  theme: {
    extend: {
      colors: {
        navy: {
          900: '#0a0e1a',
          800: '#0f1628',
          700: '#151d35',
          600: '#1a2444',
          500: '#1f2d54',
        },
        mint: {
          DEFAULT: '#00d4aa',
          dim: 'rgba(0, 212, 170, 0.15)',
        },
        lavender: '#a78bfa',
        amber: '#fbbf24',
        coral: '#f472b6',
      },
      fontFamily: {
        display: ['Outfit', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace'],
      },
      boxShadow: {
        'glow-mint': '0 0 20px rgba(0, 212, 170, 0.3)',
        'glow-purple': '0 0 20px rgba(167, 139, 250, 0.3)',
        'glow-amber': '0 0 20px rgba(251, 191, 36, 0.3)',
      },
    },
  },
};
```
