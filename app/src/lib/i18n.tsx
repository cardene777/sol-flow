'use client';

import { createContext, useContext, useState, useCallback, useEffect, useMemo, ReactNode } from 'react';

export type Language = 'en' | 'ja';

interface LandingTranslations {
  heroTitle: string;
  heroTitleHighlight: string;
  heroTitleSuffix: string;
  heroDescription: string;
  getStarted: string;
  viewFeatures: string;
  features: string;
  featuresDescription: string;
  feature1Title: string;
  feature1Description: string;
  feature2Title: string;
  feature2Description: string;
  feature3Title: string;
  feature3Description: string;
  feature4Title: string;
  feature4Description: string;
  feature5Title: string;
  feature5Description: string;
  feature6Title: string;
  feature6Description: string;
  howToUse: string;
  howToUseDescription: string;
  step1Title: string;
  step1Description: string;
  step2Title: string;
  step2Description: string;
  step2Item1: string;
  step2Item2: string;
  step2Item3: string;
  step3Title: string;
  step3Description: string;
  supportedLibraries: string;
  supportedLibrariesDescription: string;
  ctaTitle: string;
  ctaDescription: string;
  start: string;
  footer: string;
}

interface HeaderTranslations {
  goToLanding: string;
  manageProjects: string;
  renameProject: string;
  save: string;
  cancel: string;
  searchContracts: string;
  gridLayout: string;
  hierarchyLayout: string;
  projects: string;
  reload: string;
  exportDiagram: string;
  exportPng: string;
  exportPngDesc: string;
  exportSvg: string;
  exportSvgDesc: string;
  import: string;
  menu: string;
  layout: string;
  export: string;
  aboutSolFlow: string;
}

interface CommonTranslations {
  language: string;
  english: string;
  japanese: string;
}

interface Translations {
  landing: LandingTranslations;
  header: HeaderTranslations;
  common: CommonTranslations;
}

const translations: Record<Language, Translations> = {
  en: {
    landing: {
      heroTitle: 'Visualize Solidity Contracts',
      heroTitleHighlight: 'Visualize',
      heroTitleSuffix: 'to Deepen Understanding',
      heroDescription: 'Sol-Flow visualizes dependencies, inheritance structures, and function flows of Solidity smart contracts as interactive diagrams. It helps understand complex codebases and streamlines security reviews.',
      getStarted: 'Get Started',
      viewFeatures: 'View Features',
      features: 'Features',
      featuresDescription: 'Sol-Flow is designed for smart contract developers and security auditors',
      feature1Title: 'Inheritance Visualization',
      feature1Description: 'Visually display inheritance and implementation relationships between contracts. Easily understand relationships with libraries like OpenZeppelin.',
      feature2Title: 'Function Flow Diagram',
      feature2Description: 'Click on a function to see a visual diagram of internal calls. View alongside the actual source code.',
      feature3Title: 'Proxy Pattern Detection',
      feature3Description: 'Automatically detect proxy patterns like ERC-7546, UUPS, Transparent, Diamond, Beacon and display them grouped.',
      feature4Title: 'Smart Search',
      feature4Description: 'Quickly search by contract name, function name, or event name. Instantly access any location even in large codebases.',
      feature5Title: 'Easy Import',
      feature5Description: 'Just drag and drop Solidity files. External libraries (OpenZeppelin, Solady, etc.) are automatically resolved.',
      feature6Title: 'Built-in Libraries',
      feature6Description: 'Major libraries like OpenZeppelin, Solady, Avalanche ICM are preloaded. Reference them immediately.',
      howToUse: 'How to Use',
      howToUseDescription: 'Visualize your contracts in 3 steps',
      step1Title: 'Import Contracts',
      step1Description: 'Click the "Import" button in the top right and drag & drop or select Solidity files (.sol) to upload.',
      step2Title: 'Explore the Diagram',
      step2Description: 'Check the automatically generated dependency diagram. Freely manipulate with zoom, pan, and category filters.',
      step2Item1: 'Mouse wheel to zoom',
      step2Item2: 'Drag to pan',
      step2Item3: 'Filter with sidebar',
      step3Title: 'View Function Flow',
      step3Description: 'Click on a contract to expand it, then click on a function name to see detailed flow diagram and source code.',
      supportedLibraries: 'Supported Libraries',
      supportedLibrariesDescription: 'Major Solidity libraries are preloaded',
      ctaTitle: 'Try Sol-Flow Now',
      ctaDescription: 'No account required. Runs in browser. Completely free.',
      start: 'Start',
      footer: 'Built for the Solidity community',
    },
    header: {
      goToLanding: 'Go to Landing Page',
      manageProjects: 'Manage Projects',
      renameProject: 'Rename Project',
      save: 'Save',
      cancel: 'Cancel',
      searchContracts: 'Search contracts and functions',
      gridLayout: 'Grid: Arrange by grid within category',
      hierarchyLayout: 'Hierarchy: Arrange by inheritance within category',
      projects: 'Projects',
      reload: 'Reload diagram',
      exportDiagram: 'Export as PNG/SVG',
      exportPng: 'Export as PNG',
      exportPngDesc: 'High-quality image',
      exportSvg: 'Export as SVG',
      exportSvgDesc: 'Scalable vector',
      import: 'Import Solidity files',
      menu: 'Menu',
      layout: 'Layout',
      export: 'Export',
      aboutSolFlow: 'About Sol-Flow',
    },
    common: {
      language: 'Language',
      english: 'English',
      japanese: 'Japanese',
    },
  },
  ja: {
    landing: {
      heroTitle: 'Solidityコントラクトを可視化',
      heroTitleHighlight: '可視化',
      heroTitleSuffix: 'して理解を深める',
      heroDescription: 'Sol-Flowは、Solidityスマートコントラクトの依存関係、継承構造、関数フローをインタラクティブな図として可視化するツールです。複雑なコードベースの理解を助け、セキュリティレビューを効率化します。',
      getStarted: '今すぐ始める',
      viewFeatures: '機能を見る',
      features: '主な機能',
      featuresDescription: 'Sol-Flowは、スマートコントラクト開発者とセキュリティ監査者のために設計されています',
      feature1Title: '継承関係の可視化',
      feature1Description: 'コントラクト間の継承・実装関係を視覚的に表示。OpenZeppelin等のライブラリとの関係も一目で把握できます。',
      feature2Title: '関数フロー図',
      feature2Description: '関数をクリックすると、内部呼び出しのフローを図解表示。実際のソースコードと共に確認できます。',
      feature3Title: 'プロキシパターン検出',
      feature3Description: 'ERC-7546、UUPS、Transparent、Diamond、Beacon等のプロキシパターンを自動検出し、グループ化して表示します。',
      feature4Title: 'スマート検索',
      feature4Description: 'コントラクト名、関数名、イベント名で素早く検索。大規模なコードベースでも目的の場所にすぐアクセスできます。',
      feature5Title: '簡単インポート',
      feature5Description: 'Solidityファイルをドラッグ&ドロップするだけ。外部ライブラリ（OpenZeppelin、Solady等）は自動解決されます。',
      feature6Title: 'ライブラリ内蔵',
      feature6Description: 'OpenZeppelin、Solady、Avalanche ICM等の主要ライブラリがプリロード済み。すぐに参照できます。',
      howToUse: '使い方',
      howToUseDescription: '3つのステップで、あなたのコントラクトを可視化',
      step1Title: 'コントラクトをインポート',
      step1Description: '右上の「Import」ボタンをクリックし、Solidityファイル（.sol）をドラッグ&ドロップまたは選択してアップロードします。',
      step2Title: '図を探索',
      step2Description: '自動生成された依存関係図を確認します。ズーム、パン、カテゴリフィルターで自由に操作できます。',
      step2Item1: 'マウスホイールでズーム',
      step2Item2: 'ドラッグで移動',
      step2Item3: 'サイドバーでフィルター',
      step3Title: '関数フローを確認',
      step3Description: 'コントラクトをクリックして展開し、関数名をクリックすると詳細なフロー図とソースコードが表示されます。',
      supportedLibraries: '対応ライブラリ',
      supportedLibrariesDescription: '主要なSolidityライブラリをプリロード済み',
      ctaTitle: '今すぐSol-Flowを試す',
      ctaDescription: 'アカウント登録不要。ブラウザ上で完結。すべて無料で利用できます。',
      start: '始める',
      footer: 'Built for the Solidity community',
    },
    header: {
      goToLanding: 'ランディングページへ移動',
      manageProjects: 'プロジェクトを管理',
      renameProject: 'プロジェクト名を変更',
      save: '保存',
      cancel: 'キャンセル',
      searchContracts: 'コントラクト・関数を検索',
      gridLayout: 'Grid: カテゴリ内をグリッド配置',
      hierarchyLayout: 'Hierarchy: 継承階層で配置',
      projects: 'プロジェクト・ライブラリを管理',
      reload: 'ダイアグラムを再読み込み',
      exportDiagram: '図をPNG/SVG形式でエクスポート',
      exportPng: 'Export as PNG',
      exportPngDesc: 'High-quality image',
      exportSvg: 'Export as SVG',
      exportSvgDesc: 'Scalable vector',
      import: 'Solidityファイルをインポート',
      menu: 'メニュー',
      layout: 'レイアウト',
      export: 'エクスポート',
      aboutSolFlow: 'Sol-Flowについて',
    },
    common: {
      language: '言語',
      english: 'English',
      japanese: '日本語',
    },
  },
};

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: Translations;
}

const LanguageContext = createContext<LanguageContextType | null>(null);

const LANGUAGE_KEY = 'sol-flow-language';

function getInitialLanguage(): Language {
  if (typeof window === 'undefined') return 'en';
  const saved = localStorage.getItem(LANGUAGE_KEY) as Language | null;
  if (saved && (saved === 'en' || saved === 'ja')) {
    return saved;
  }
  const browserLang = navigator.language.toLowerCase();
  return browserLang.startsWith('ja') ? 'ja' : 'en';
}

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [language, setLanguageState] = useState<Language>('en');
  const [mounted, setMounted] = useState(false);

  // Initialize language after mount to avoid hydration mismatch
  useEffect(() => {
    const initialLang = getInitialLanguage();
    setLanguageState(initialLang);
    if (!localStorage.getItem(LANGUAGE_KEY)) {
      localStorage.setItem(LANGUAGE_KEY, initialLang);
    }
    setMounted(true);
  }, []);

  const setLanguage = useCallback((lang: Language) => {
    localStorage.setItem(LANGUAGE_KEY, lang);
    setLanguageState(lang);
  }, []);

  const t = translations[language];

  const contextValue = useMemo(() => ({
    language,
    setLanguage,
    t,
  }), [language, setLanguage, t]);

  // Show loading or default content during hydration
  if (!mounted) {
    return (
      <LanguageContext.Provider value={{ language: 'en', setLanguage: () => {}, t: translations['en'] }}>
        {children}
      </LanguageContext.Provider>
    );
  }

  return (
    <LanguageContext.Provider value={contextValue}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within LanguageProvider');
  }
  return context;
}
