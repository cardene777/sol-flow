'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { X, ChevronLeft, ChevronRight, Upload, Search, MousePointer, Maximize2, Code2, Download, Edit3, FileCode, Eye } from 'lucide-react';

interface OnboardingTourProps {
  onComplete: () => void;
  onSkip: () => void;
}

interface TourStep {
  id: string;
  title: string;
  description: string;
  icon: React.ReactNode;
  targetSelector?: string; // CSS selector for the element to highlight
  tooltipPosition: 'top' | 'bottom' | 'left' | 'right' | 'center';
}

const tourSteps: TourStep[] = [
  {
    id: 'welcome',
    title: 'Sol-Flowへようこそ!',
    description: 'Solidityスマートコントラクトを可視化するツールです。このツアーで基本的な使い方を学びましょう。',
    icon: <Code2 className="w-6 h-6" />,
    tooltipPosition: 'center',
  },
  {
    id: 'sidebar',
    title: 'サイドバー',
    description: 'コントラクトがカテゴリ別に表示されます。コントラクト名にホバーするとコードアイコンが表示され、クリックすると詳細を確認できます。',
    icon: <MousePointer className="w-6 h-6" />,
    targetSelector: '[data-tour="sidebar"]',
    tooltipPosition: 'right',
  },
  {
    id: 'canvas',
    title: 'ダイアグラムキャンバス',
    description: 'コントラクトの依存関係図が表示されます。マウスホイールでズーム、ドラッグで移動。コントラクトノードをクリックすると関数一覧が表示されます。',
    icon: <Maximize2 className="w-6 h-6" />,
    targetSelector: '[data-tour="canvas"]',
    tooltipPosition: 'left',
  },
  {
    id: 'contract-details',
    title: 'コントラクト詳細',
    description: '展開したノードの「View Details」ボタンをクリックすると、変数、関数、イベント、ソースコードが確認できます。ソースコードはシンタックスハイライト付きで表示されます。',
    icon: <FileCode className="w-6 h-6" />,
    tooltipPosition: 'center',
  },
  {
    id: 'function-flow',
    title: '関数フロー',
    description: '展開したノード内の関数名をクリックすると、その関数の呼び出しフローとソースコードが表示されます。内部呼び出し、ライブラリ呼び出し、発行イベントなどが確認できます。',
    icon: <Eye className="w-6 h-6" />,
    tooltipPosition: 'center',
  },
  {
    id: 'search',
    title: '検索機能',
    description: 'コントラクト名、関数名、イベント名を検索できます。Ctrl+K（Mac: Cmd+K）でフォーカス。検索結果をクリックすると自動でズームします。',
    icon: <Search className="w-6 h-6" />,
    targetSelector: '[data-tour="search"]',
    tooltipPosition: 'bottom',
  },
  {
    id: 'import',
    title: 'インポート',
    description: '自分のSolidityファイルをインポートできます。OpenZeppelin等の外部ライブラリは自動解決されます。ドラッグ&ドロップまたはフォルダ選択でアップロード可能です。',
    icon: <Upload className="w-6 h-6" />,
    targetSelector: '[data-tour="import"]',
    tooltipPosition: 'bottom',
  },
  {
    id: 'edit-mode',
    title: '編集モード',
    description: '保存したプロジェクトでは編集モードが使えます。コントラクト間をドラッグしてカスタムエッジを追加できます。静的解析では捉えられない関係をドキュメント化するのに便利です。',
    icon: <Edit3 className="w-6 h-6" />,
    tooltipPosition: 'center',
  },
  {
    id: 'export',
    title: 'エクスポート',
    description: '図をPNGまたはSVG形式で保存できます。ドキュメントやプレゼンテーションに活用してください。',
    icon: <Download className="w-6 h-6" />,
    targetSelector: '[data-tour="export"]',
    tooltipPosition: 'bottom',
  },
  {
    id: 'complete',
    title: '準備完了!',
    description: 'これで基本操作は完了です。右上のヘルプボタン（?）からいつでも詳細なドキュメントを確認できます。さあ、コントラクトを探索しましょう！',
    icon: <Code2 className="w-6 h-6" />,
    tooltipPosition: 'center',
  },
];

interface SpotlightRect {
  top: number;
  left: number;
  width: number;
  height: number;
}

export function OnboardingTour({ onComplete, onSkip }: OnboardingTourProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const [isVisible, setIsVisible] = useState(true);
  const [spotlightRect, setSpotlightRect] = useState<SpotlightRect | null>(null);
  const [tooltipStyle, setTooltipStyle] = useState<React.CSSProperties>({});
  const tooltipRef = useRef<HTMLDivElement>(null);

  const step = tourSteps[currentStep];
  const isFirstStep = currentStep === 0;
  const isLastStep = currentStep === tourSteps.length - 1;

  // Update spotlight position when step changes
  useEffect(() => {
    if (step.targetSelector) {
      const element = document.querySelector(step.targetSelector);
      if (element) {
        const rect = element.getBoundingClientRect();
        const padding = 8;
        setSpotlightRect({
          top: rect.top - padding,
          left: rect.left - padding,
          width: rect.width + padding * 2,
          height: rect.height + padding * 2,
        });

        // Calculate tooltip position
        const tooltipWidth = 360;
        const tooltipHeight = 200;
        const gap = 16;

        let top = 0;
        let left = 0;

        switch (step.tooltipPosition) {
          case 'top':
            top = rect.top - tooltipHeight - gap;
            left = rect.left + rect.width / 2 - tooltipWidth / 2;
            break;
          case 'bottom':
            top = rect.bottom + gap;
            left = rect.left + rect.width / 2 - tooltipWidth / 2;
            break;
          case 'left':
            top = rect.top + rect.height / 2 - tooltipHeight / 2;
            left = rect.left - tooltipWidth - gap;
            break;
          case 'right':
            top = rect.top + rect.height / 2 - tooltipHeight / 2;
            left = rect.right + gap;
            break;
        }

        // Keep tooltip within viewport
        const viewportWidth = window.innerWidth;
        const viewportHeight = window.innerHeight;

        if (left < 16) left = 16;
        if (left + tooltipWidth > viewportWidth - 16) left = viewportWidth - tooltipWidth - 16;
        if (top < 16) top = 16;
        if (top + tooltipHeight > viewportHeight - 16) top = viewportHeight - tooltipHeight - 16;

        setTooltipStyle({ top, left, width: tooltipWidth });
      } else {
        setSpotlightRect(null);
        setTooltipStyle({});
      }
    } else {
      setSpotlightRect(null);
      setTooltipStyle({});
    }
  }, [currentStep, step]);

  const handleNext = useCallback(() => {
    if (isLastStep) {
      setIsVisible(false);
      setTimeout(onComplete, 300);
    } else {
      setCurrentStep(prev => prev + 1);
    }
  }, [isLastStep, onComplete]);

  const handlePrev = useCallback(() => {
    if (!isFirstStep) {
      setCurrentStep(prev => prev - 1);
    }
  }, [isFirstStep]);

  const handleSkip = useCallback(() => {
    setIsVisible(false);
    setTimeout(onSkip, 300);
  }, [onSkip]);

  // Handle keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        handleSkip();
      } else if (e.key === 'ArrowRight' || e.key === 'Enter') {
        handleNext();
      } else if (e.key === 'ArrowLeft') {
        handlePrev();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleNext, handlePrev, handleSkip]);

  const isCentered = step.tooltipPosition === 'center' || !spotlightRect;

  return (
    <div
      className={`fixed inset-0 z-[100] transition-opacity duration-300 ${
        isVisible ? 'opacity-100' : 'opacity-0 pointer-events-none'
      }`}
    >
      {/* SVG Mask for spotlight effect */}
      <svg className="absolute inset-0 w-full h-full pointer-events-none">
        <defs>
          <mask id="spotlight-mask">
            <rect x="0" y="0" width="100%" height="100%" fill="white" />
            {spotlightRect && (
              <rect
                x={spotlightRect.left}
                y={spotlightRect.top}
                width={spotlightRect.width}
                height={spotlightRect.height}
                rx="8"
                fill="black"
              />
            )}
          </mask>
        </defs>
        <rect
          x="0"
          y="0"
          width="100%"
          height="100%"
          fill="rgba(0, 0, 0, 0.75)"
          mask="url(#spotlight-mask)"
        />
      </svg>

      {/* Spotlight border */}
      {spotlightRect && (
        <div
          className="absolute border-2 border-mint rounded-lg pointer-events-none animate-pulse"
          style={{
            top: spotlightRect.top,
            left: spotlightRect.left,
            width: spotlightRect.width,
            height: spotlightRect.height,
          }}
        />
      )}

      {/* Tour Card */}
      <div
        ref={tooltipRef}
        className={`absolute p-5 bg-navy-800 border border-navy-600 rounded-xl shadow-2xl transition-all duration-300 ${
          isCentered ? 'top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[400px]' : ''
        }`}
        style={isCentered ? {} : tooltipStyle}
      >
        {/* Header */}
        <div className="flex items-start gap-3 mb-3">
          <div className="w-10 h-10 rounded-xl bg-mint/20 flex items-center justify-center text-mint flex-shrink-0">
            {step.icon}
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="text-lg font-display font-semibold text-slate-100">
              {step.title}
            </h3>
          </div>
          <button
            onClick={handleSkip}
            className="p-1.5 text-slate-500 hover:text-slate-300 hover:bg-navy-700 rounded-lg transition-colors"
            title="ツアーをスキップ"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Description */}
        <p className="text-slate-400 text-sm leading-relaxed mb-4">
          {step.description}
        </p>

        {/* Footer */}
        <div className="flex items-center justify-between">
          {/* Progress dots */}
          <div className="flex items-center gap-1">
            {tourSteps.map((_, index) => (
              <div
                key={index}
                className={`w-1.5 h-1.5 rounded-full transition-colors ${
                  index === currentStep
                    ? 'bg-mint'
                    : index < currentStep
                    ? 'bg-mint/50'
                    : 'bg-navy-600'
                }`}
              />
            ))}
          </div>

          {/* Navigation buttons */}
          <div className="flex items-center gap-2">
            {!isFirstStep && (
              <button
                onClick={handlePrev}
                className="flex items-center gap-1 px-2 py-1 text-slate-400 hover:text-slate-200 hover:bg-navy-700 rounded transition-colors text-sm"
                title="前のステップへ戻る"
              >
                <ChevronLeft className="w-4 h-4" />
                <span>戻る</span>
              </button>
            )}
            <button
              onClick={handleNext}
              className="flex items-center gap-1 px-3 py-1.5 bg-mint hover:bg-mint/90 text-navy-900 rounded-lg font-medium transition-colors text-sm"
              title={isLastStep ? 'ツアーを完了してアプリを使い始める' : '次のステップへ進む'}
            >
              <span>{isLastStep ? '始める' : '次へ'}</span>
              {!isLastStep && <ChevronRight className="w-4 h-4" />}
            </button>
          </div>
        </div>

        {/* Step counter */}
        <div className="mt-3 text-center text-xs text-slate-500">
          ステップ {currentStep + 1} / {tourSteps.length}
        </div>
      </div>
    </div>
  );
}
