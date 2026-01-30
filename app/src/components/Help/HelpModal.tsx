'use client';

import { useState } from 'react';
import { X, Upload, Search, MousePointer, Maximize2, Edit3, Download, Layers, Code2, GitBranch, ChevronRight, Keyboard } from 'lucide-react';

interface HelpModalProps {
  onClose: () => void;
}

type HelpSection = 'overview' | 'import' | 'navigation' | 'diagram' | 'function-flow' | 'editing' | 'export' | 'shortcuts';

const sections: { id: HelpSection; label: string; icon: React.ReactNode }[] = [
  { id: 'overview', label: 'Overview', icon: <Layers className="w-4 h-4" /> },
  { id: 'import', label: 'Import', icon: <Upload className="w-4 h-4" /> },
  { id: 'navigation', label: 'Navigation', icon: <Search className="w-4 h-4" /> },
  { id: 'diagram', label: 'Diagram', icon: <GitBranch className="w-4 h-4" /> },
  { id: 'function-flow', label: 'Function Flow', icon: <Code2 className="w-4 h-4" /> },
  { id: 'editing', label: 'Editing', icon: <Edit3 className="w-4 h-4" /> },
  { id: 'export', label: 'Export', icon: <Download className="w-4 h-4" /> },
  { id: 'shortcuts', label: 'Shortcuts', icon: <Keyboard className="w-4 h-4" /> },
];

export function HelpModal({ onClose }: HelpModalProps) {
  const [activeSection, setActiveSection] = useState<HelpSection>('overview');

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="bg-navy-800 border border-navy-600 rounded-xl shadow-2xl w-full max-w-4xl max-h-[85vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-navy-600">
          <h2 className="text-xl font-display font-semibold text-slate-100">Help</h2>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-200 hover:bg-navy-700 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 flex overflow-hidden">
          {/* Sidebar */}
          <div className="w-48 border-r border-navy-600 p-2 overflow-y-auto">
            {sections.map((section) => (
              <button
                key={section.id}
                onClick={() => setActiveSection(section.id)}
                className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-colors ${
                  activeSection === section.id
                    ? 'bg-mint/20 text-mint'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-navy-700'
                }`}
              >
                {section.icon}
                {section.label}
              </button>
            ))}
          </div>

          {/* Main content */}
          <div className="flex-1 p-6 overflow-y-auto">
            {activeSection === 'overview' && <OverviewSection />}
            {activeSection === 'import' && <ImportSection />}
            {activeSection === 'navigation' && <NavigationSection />}
            {activeSection === 'diagram' && <DiagramSection />}
            {activeSection === 'function-flow' && <FunctionFlowSection />}
            {activeSection === 'editing' && <EditingSection />}
            {activeSection === 'export' && <ExportSection />}
            {activeSection === 'shortcuts' && <ShortcutsSection />}
          </div>
        </div>
      </div>
    </div>
  );
}

function SectionTitle({ children }: { children: React.ReactNode }) {
  return <h3 className="text-lg font-display font-semibold text-slate-100 mb-4">{children}</h3>;
}

function Paragraph({ children }: { children: React.ReactNode }) {
  return <p className="text-slate-300 mb-4 leading-relaxed">{children}</p>;
}

function ListItem({ children }: { children: React.ReactNode }) {
  return (
    <li className="flex items-start gap-2 text-slate-300 mb-2">
      <ChevronRight className="w-4 h-4 text-mint mt-0.5 flex-shrink-0" />
      <span>{children}</span>
    </li>
  );
}

function Kbd({ children }: { children: React.ReactNode }) {
  return (
    <kbd className="px-1.5 py-0.5 bg-navy-700 border border-navy-500 rounded text-xs font-mono text-slate-300">
      {children}
    </kbd>
  );
}

function OverviewSection() {
  return (
    <>
      <SectionTitle>Sol-Flowについて</SectionTitle>
      <Paragraph>
        Sol-Flowは、Solidityスマートコントラクトの依存関係、継承構造、関数フローを
        インタラクティブな図として可視化するツールです。
      </Paragraph>
      <Paragraph>
        主な機能:
      </Paragraph>
      <ul className="mb-6">
        <ListItem>コントラクト間の継承・依存関係の可視化</ListItem>
        <ListItem>関数の内部呼び出しフローの図解表示</ListItem>
        <ListItem>プロキシパターン（ERC-7546, UUPS, Transparent, Diamond等）の自動検出</ListItem>
        <ListItem>OpenZeppelin、Solady等の主要ライブラリをプリロード済み</ListItem>
        <ListItem>PNG/SVG形式での図のエクスポート</ListItem>
      </ul>
      <Paragraph>
        左のメニューから各機能の詳細な使い方を確認できます。
      </Paragraph>
    </>
  );
}

function ImportSection() {
  return (
    <>
      <SectionTitle>コントラクトのインポート</SectionTitle>
      <Paragraph>
        Solidityファイル（.sol）をインポートして、依存関係図を生成します。
      </Paragraph>

      <h4 className="text-sm font-semibold text-slate-200 mb-2 mt-6">インポート方法</h4>
      <ul className="mb-6">
        <ListItem>ヘッダーの「Import」ボタンをクリック</ListItem>
        <ListItem>ファイルをドラッグ&ドロップ、またはクリックして選択</ListItem>
        <ListItem>複数ファイルを一度にインポート可能</ListItem>
      </ul>

      <h4 className="text-sm font-semibold text-slate-200 mb-2 mt-6">外部ライブラリの解決</h4>
      <Paragraph>
        以下のライブラリからのimportは自動的に解決されます:
      </Paragraph>
      <ul className="mb-6">
        <ListItem>@openzeppelin/contracts</ListItem>
        <ListItem>@openzeppelin/contracts-upgradeable</ListItem>
        <ListItem>solady</ListItem>
      </ul>

      <h4 className="text-sm font-semibold text-slate-200 mb-2 mt-6">プロジェクトの保存</h4>
      <Paragraph>
        インポートしたプロジェクトは自動的にブラウザのローカルストレージに保存されます。
        「Projects」ボタンから保存されたプロジェクトを管理できます。
      </Paragraph>
    </>
  );
}

function NavigationSection() {
  return (
    <>
      <SectionTitle>ナビゲーション</SectionTitle>

      <h4 className="text-sm font-semibold text-slate-200 mb-2">検索</h4>
      <Paragraph>
        ヘッダーの検索バーでコントラクト名、関数名、イベント名を検索できます。
        検索結果をクリックすると、該当するコントラクトにフォーカスします。
      </Paragraph>

      <h4 className="text-sm font-semibold text-slate-200 mb-2 mt-6">サイドバー</h4>
      <Paragraph>
        左サイドバーにはカテゴリ別にコントラクトが表示されます:
      </Paragraph>
      <ul className="mb-6">
        <ListItem><span className="text-blue-400">Token</span> - ERC20, ERC721, ERC1155等のトークン</ListItem>
        <ListItem><span className="text-purple-400">Access</span> - アクセス制御（Ownable, AccessControl等）</ListItem>
        <ListItem><span className="text-amber-400">Proxy</span> - プロキシパターン</ListItem>
        <ListItem><span className="text-green-400">Finance</span> - 金融関連</ListItem>
        <ListItem><span className="text-pink-400">Governance</span> - ガバナンス</ListItem>
        <ListItem><span className="text-cyan-400">Utils</span> - ユーティリティ</ListItem>
        <ListItem><span className="text-slate-400">Interface</span> - インターフェース</ListItem>
        <ListItem><span className="text-orange-400">Library</span> - ライブラリ</ListItem>
      </ul>

      <h4 className="text-sm font-semibold text-slate-200 mb-2 mt-6">カテゴリフィルター</h4>
      <Paragraph>
        サイドバーのカテゴリヘッダーをクリックすると、そのカテゴリの表示/非表示を切り替えられます。
      </Paragraph>
    </>
  );
}

function DiagramSection() {
  return (
    <>
      <SectionTitle>ダイアグラム</SectionTitle>

      <h4 className="text-sm font-semibold text-slate-200 mb-2">基本操作</h4>
      <ul className="mb-6">
        <ListItem>マウスホイールまたはピンチでズーム</ListItem>
        <ListItem>ドラッグで移動（パン）</ListItem>
        <ListItem>コントラクトノードをクリックして展開/折りたたみ</ListItem>
        <ListItem>関数名をクリックしてFunction Flowを表示</ListItem>
      </ul>

      <h4 className="text-sm font-semibold text-slate-200 mb-2 mt-6">レイアウトモード</h4>
      <Paragraph>
        ヘッダーのレイアウト切り替えボタンで表示を変更できます:
      </Paragraph>
      <ul className="mb-6">
        <ListItem><strong>Grid</strong> - カテゴリ内をグリッド配置</ListItem>
        <ListItem><strong>Hierarchy</strong> - カテゴリ内を継承階層で配置</ListItem>
      </ul>

      <h4 className="text-sm font-semibold text-slate-200 mb-2 mt-6">エッジ（接続線）</h4>
      <Paragraph>
        コントラクト間の関係を線で表示:
      </Paragraph>
      <ul className="mb-6">
        <ListItem><span className="text-mint">緑の実線</span> - 継承関係（is）</ListItem>
        <ListItem><span className="text-lavender">紫の破線</span> - 依存関係（import/using）</ListItem>
        <ListItem><span className="text-amber-400">オレンジ</span> - プロキシ関係</ListItem>
      </ul>

      <h4 className="text-sm font-semibold text-slate-200 mb-2 mt-6">プロキシグループ</h4>
      <Paragraph>
        ERC-7546、UUPS、Transparent、Diamond、Beacon等のプロキシパターンを自動検出し、
        グループとして視覚的に表示します。
      </Paragraph>
    </>
  );
}

function FunctionFlowSection() {
  return (
    <>
      <SectionTitle>Function Flow</SectionTitle>
      <Paragraph>
        関数の内部呼び出しフローを詳細に表示するモーダルダイアログです。
      </Paragraph>

      <h4 className="text-sm font-semibold text-slate-200 mb-2 mt-6">開き方</h4>
      <ul className="mb-6">
        <ListItem>展開したコントラクトノード内の関数名をクリック</ListItem>
        <ListItem>検索結果から関数を選択</ListItem>
      </ul>

      <h4 className="text-sm font-semibold text-slate-200 mb-2 mt-6">フローダイアグラム</h4>
      <Paragraph>
        左側に関数の呼び出しフローが図として表示されます:
      </Paragraph>
      <ul className="mb-6">
        <ListItem><span className="text-mint">緑のノード</span> - external関数（view/pure）</ListItem>
        <ListItem><span className="text-coral">オレンジのノード</span> - external関数（状態変更あり）</ListItem>
        <ListItem><span className="text-lavender">紫のノード</span> - internal関数</ListItem>
        <ListItem><span className="text-amber-400">黄色のノード</span> - modifier</ListItem>
        <ListItem><span className="text-cyan-400">水色のノード</span> - イベント</ListItem>
      </ul>

      <h4 className="text-sm font-semibold text-slate-200 mb-2 mt-6">ソースコード表示</h4>
      <Paragraph>
        右側にはフロー内の各ノードのソースコードが表示されます。
        フロー図のノードをクリックすると、対応するソースコードがハイライトされます。
      </Paragraph>
    </>
  );
}

function EditingSection() {
  return (
    <>
      <SectionTitle>編集モード</SectionTitle>
      <Paragraph>
        ユーザープロジェクト（インポートしたプロジェクト）では、編集モードで図をカスタマイズできます。
      </Paragraph>

      <h4 className="text-sm font-semibold text-slate-200 mb-2 mt-6">編集モードの開始</h4>
      <ul className="mb-6">
        <ListItem>キャンバス右上の「Edit」ボタンをクリック</ListItem>
        <ListItem>ボタンがオレンジ色に変わり、編集モードが有効になります</ListItem>
      </ul>

      <h4 className="text-sm font-semibold text-slate-200 mb-2 mt-6">エッジの追加</h4>
      <ul className="mb-6">
        <ListItem>編集モード中にコントラクトノードのハンドル（丸い点）をドラッグ</ListItem>
        <ListItem>別のコントラクトノードにドロップして接続を作成</ListItem>
        <ListItem>仮のエッジ（点線）として表示され、保存すると確定</ListItem>
      </ul>

      <h4 className="text-sm font-semibold text-slate-200 mb-2 mt-6">エッジの削除</h4>
      <ul className="mb-6">
        <ListItem>編集モード中にエッジをクリック</ListItem>
        <ListItem>表示される「×」ボタンをクリックして削除</ListItem>
      </ul>

      <h4 className="text-sm font-semibold text-slate-200 mb-2 mt-6">注意</h4>
      <Paragraph>
        編集モードはユーザープロジェクトでのみ利用可能です。
        ビルトインライブラリ（OpenZeppelin等）では編集できません。
      </Paragraph>
    </>
  );
}

function ExportSection() {
  return (
    <>
      <SectionTitle>エクスポート</SectionTitle>
      <Paragraph>
        現在表示されている図を画像としてエクスポートできます。
      </Paragraph>

      <h4 className="text-sm font-semibold text-slate-200 mb-2 mt-6">PNG形式</h4>
      <ul className="mb-6">
        <ListItem>ヘッダーのダウンロードボタン → 「Export as PNG」</ListItem>
        <ListItem>高解像度のラスター画像として保存</ListItem>
        <ListItem>プレゼンテーションやドキュメントに最適</ListItem>
      </ul>

      <h4 className="text-sm font-semibold text-slate-200 mb-2 mt-6">SVG形式</h4>
      <ul className="mb-6">
        <ListItem>ヘッダーのダウンロードボタン → 「Export as SVG」</ListItem>
        <ListItem>スケーラブルなベクター画像として保存</ListItem>
        <ListItem>拡大しても画質が劣化しない</ListItem>
        <ListItem>技術ドキュメントや印刷物に最適</ListItem>
      </ul>
    </>
  );
}

function ShortcutsSection() {
  return (
    <>
      <SectionTitle>キーボードショートカット</SectionTitle>

      <h4 className="text-sm font-semibold text-slate-200 mb-2">ダイアグラム操作</h4>
      <div className="space-y-2 mb-6">
        <div className="flex items-center justify-between py-2 border-b border-navy-700">
          <span className="text-slate-300">ズームイン</span>
          <span><Kbd>Ctrl</Kbd> + <Kbd>+</Kbd> または <Kbd>Cmd</Kbd> + <Kbd>+</Kbd></span>
        </div>
        <div className="flex items-center justify-between py-2 border-b border-navy-700">
          <span className="text-slate-300">ズームアウト</span>
          <span><Kbd>Ctrl</Kbd> + <Kbd>-</Kbd> または <Kbd>Cmd</Kbd> + <Kbd>-</Kbd></span>
        </div>
        <div className="flex items-center justify-between py-2 border-b border-navy-700">
          <span className="text-slate-300">全体を表示</span>
          <span><Kbd>Ctrl</Kbd> + <Kbd>0</Kbd> または <Kbd>Cmd</Kbd> + <Kbd>0</Kbd></span>
        </div>
      </div>

      <h4 className="text-sm font-semibold text-slate-200 mb-2 mt-6">モーダル操作</h4>
      <div className="space-y-2 mb-6">
        <div className="flex items-center justify-between py-2 border-b border-navy-700">
          <span className="text-slate-300">モーダルを閉じる</span>
          <span><Kbd>Esc</Kbd></span>
        </div>
      </div>

      <h4 className="text-sm font-semibold text-slate-200 mb-2 mt-6">検索</h4>
      <div className="space-y-2 mb-6">
        <div className="flex items-center justify-between py-2 border-b border-navy-700">
          <span className="text-slate-300">検索にフォーカス</span>
          <span><Kbd>Ctrl</Kbd> + <Kbd>K</Kbd> または <Kbd>Cmd</Kbd> + <Kbd>K</Kbd></span>
        </div>
      </div>
    </>
  );
}
