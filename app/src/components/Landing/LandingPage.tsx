'use client';

import Link from 'next/link';
import Image from 'next/image';
import { Zap, Upload, GitBranch, Code2, Layers, Search, ArrowRight, ChevronRight, ExternalLink, FileText, PenTool, Download } from 'lucide-react';
import { LanguageSwitcher } from '@/components/ui/LanguageSwitcher';
import { useLanguage } from '@/lib/i18n';
import { REPO_URL } from '@/constants';

interface LandingPageProps {
  onGetStarted?: () => void;
}

export function LandingPage({ onGetStarted }: LandingPageProps) {
  const { language, t } = useLanguage();

  return (
    <div className="min-h-screen bg-navy-900 text-slate-100">
      {/* Hero Section */}
      <header className="relative">
        {/* Background gradient */}
        <div className="absolute inset-0 bg-gradient-to-br from-mint/10 via-transparent to-lavender/10 pointer-events-none" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(0,212,170,0.15),transparent_50%)] pointer-events-none" />

        {/* Navigation */}
        <nav className="relative z-50 flex items-center justify-between px-6 py-4 max-w-7xl mx-auto">
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 rounded-xl overflow-hidden">
              <Image
                src="/logo.png"
                alt="Sol-Flow"
                width={40}
                height={40}
                className="w-full h-full object-cover"
              />
            </div>
            <span className="font-display font-bold text-xl bg-gradient-to-r from-mint to-white bg-clip-text text-transparent">Sol-Flow</span>
          </div>
          <div className="flex items-center gap-4">
            <LanguageSwitcher variant="landing" />
            <a
              href={REPO_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 text-slate-400 hover:text-slate-200 transition-colors cursor-pointer [&_*]:cursor-pointer"
            >
              <span className="text-sm">GitHub</span>
              <ExternalLink className="w-4 h-4" />
            </a>
            <Link
              href="/app"
              className="px-4 py-2 bg-mint/20 hover:bg-mint/30 text-mint rounded-lg transition-colors font-medium cursor-pointer [&_*]:cursor-pointer"
            >
              {t.landing.start}
            </Link>
          </div>
        </nav>

        {/* Hero Content */}
        <div className="relative z-10 max-w-7xl mx-auto px-6 py-20 md:py-32">
          <div className="max-w-4xl">
            {language === 'ja' ? (
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-display font-bold leading-tight mb-6">
                Solidityコントラクトを<span className="text-mint">可視化</span>
                <br />
                して理解を深める
              </h1>
            ) : (
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-display font-bold leading-tight mb-6">
                <span className="text-mint">{t.landing.heroTitleHighlight}</span> Solidity Contracts
                <br />
                {t.landing.heroTitleSuffix}
              </h1>
            )}
            <p className="text-lg md:text-xl text-slate-400 mb-8 leading-relaxed">
              {t.landing.heroDescription}
            </p>
            <div className="flex flex-col sm:flex-row gap-4">
              <Link
                href="/app"
                className="flex items-center justify-center gap-2 px-6 py-3 bg-mint hover:bg-mint/90 text-navy-900 rounded-lg transition-colors font-semibold text-lg cursor-pointer [&_*]:cursor-pointer"
              >
                {t.landing.getStarted}
                <ArrowRight className="w-5 h-5" />
              </Link>
              <a
                href="#features"
                className="flex items-center justify-center gap-2 px-6 py-3 bg-navy-700 hover:bg-navy-600 text-slate-200 rounded-lg transition-colors font-medium cursor-pointer [&_*]:cursor-pointer"
              >
                {t.landing.viewFeatures}
              </a>
            </div>
          </div>
        </div>
      </header>

      {/* Features Section */}
      <section id="features" className="py-20 bg-navy-800/50">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-display font-bold mb-4">{t.landing.features}</h2>
            <p className="text-slate-400 text-lg max-w-2xl mx-auto">
              {t.landing.featuresDescription}
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {/* Feature 1 */}
            <div className="bg-navy-700/50 border border-navy-600 rounded-xl p-6 hover:border-mint/30 transition-colors">
              <div className="w-12 h-12 rounded-lg bg-mint/20 flex items-center justify-center mb-4">
                <GitBranch className="w-6 h-6 text-mint" />
              </div>
              <h3 className="text-xl font-semibold mb-2">{t.landing.feature1Title}</h3>
              <p className="text-slate-400">
                {t.landing.feature1Description}
              </p>
            </div>

            {/* Feature 2 */}
            <div className="bg-navy-700/50 border border-navy-600 rounded-xl p-6 hover:border-lavender/30 transition-colors">
              <div className="w-12 h-12 rounded-lg bg-lavender/20 flex items-center justify-center mb-4">
                <Code2 className="w-6 h-6 text-lavender" />
              </div>
              <h3 className="text-xl font-semibold mb-2">{t.landing.feature2Title}</h3>
              <p className="text-slate-400">
                {t.landing.feature2Description}
              </p>
            </div>

            {/* Feature 3 */}
            <div className="bg-navy-700/50 border border-navy-600 rounded-xl p-6 hover:border-amber/30 transition-colors">
              <div className="w-12 h-12 rounded-lg bg-amber/20 flex items-center justify-center mb-4">
                <Layers className="w-6 h-6 text-amber" />
              </div>
              <h3 className="text-xl font-semibold mb-2">{t.landing.feature3Title}</h3>
              <p className="text-slate-400">
                {t.landing.feature3Description}
              </p>
            </div>

            {/* Feature 4 */}
            <div className="bg-navy-700/50 border border-navy-600 rounded-xl p-6 hover:border-blue-400/30 transition-colors">
              <div className="w-12 h-12 rounded-lg bg-blue-400/20 flex items-center justify-center mb-4">
                <Search className="w-6 h-6 text-blue-400" />
              </div>
              <h3 className="text-xl font-semibold mb-2">{t.landing.feature4Title}</h3>
              <p className="text-slate-400">
                {t.landing.feature4Description}
              </p>
            </div>

            {/* Feature 5 */}
            <div className="bg-navy-700/50 border border-navy-600 rounded-xl p-6 hover:border-coral/30 transition-colors">
              <div className="w-12 h-12 rounded-lg bg-coral/20 flex items-center justify-center mb-4">
                <Upload className="w-6 h-6 text-coral" />
              </div>
              <h3 className="text-xl font-semibold mb-2">{t.landing.feature5Title}</h3>
              <p className="text-slate-400">
                {t.landing.feature5Description}
              </p>
            </div>

            {/* Feature 6 */}
            <div className="bg-navy-700/50 border border-navy-600 rounded-xl p-6 hover:border-indigo-400/30 transition-colors">
              <div className="w-12 h-12 rounded-lg bg-indigo-400/20 flex items-center justify-center mb-4">
                <Zap className="w-6 h-6 text-indigo-400" />
              </div>
              <h3 className="text-xl font-semibold mb-2">{t.landing.feature6Title}</h3>
              <p className="text-slate-400">
                {t.landing.feature6Description}
              </p>
            </div>

            {/* Feature 7 */}
            <div className="bg-navy-700/50 border border-navy-600 rounded-xl p-6 hover:border-emerald-400/30 transition-colors">
              <div className="w-12 h-12 rounded-lg bg-emerald-400/20 flex items-center justify-center mb-4">
                <FileText className="w-6 h-6 text-emerald-400" />
              </div>
              <h3 className="text-xl font-semibold mb-2">{t.landing.feature7Title}</h3>
              <p className="text-slate-400">
                {t.landing.feature7Description}
              </p>
            </div>

            {/* Feature 8 */}
            <div className="bg-navy-700/50 border border-navy-600 rounded-xl p-6 hover:border-cyan-400/30 transition-colors">
              <div className="w-12 h-12 rounded-lg bg-cyan-400/20 flex items-center justify-center mb-4">
                <PenTool className="w-6 h-6 text-cyan-400" />
              </div>
              <h3 className="text-xl font-semibold mb-2">{t.landing.feature8Title}</h3>
              <p className="text-slate-400">
                {t.landing.feature8Description}
              </p>
            </div>

            {/* Feature 9 */}
            <div className="bg-navy-700/50 border border-navy-600 rounded-xl p-6 hover:border-rose-400/30 transition-colors">
              <div className="w-12 h-12 rounded-lg bg-rose-400/20 flex items-center justify-center mb-4">
                <Download className="w-6 h-6 text-rose-400" />
              </div>
              <h3 className="text-xl font-semibold mb-2">{t.landing.feature9Title}</h3>
              <p className="text-slate-400">
                {t.landing.feature9Description}
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* How to Use Section */}
      <section className="py-20">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-display font-bold mb-4">{t.landing.howToUse}</h2>
            <p className="text-slate-400 text-lg max-w-2xl mx-auto">
              {t.landing.howToUseDescription}
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8 items-stretch">
            {/* Step 1 */}
            <div className="relative h-full">
              <div className="absolute -top-4 -left-4 w-12 h-12 rounded-full bg-mint/20 flex items-center justify-center text-mint font-bold text-xl z-10">
                1
              </div>
              <div className="bg-navy-800 border border-navy-600 rounded-xl p-6 pt-10 h-full flex flex-col">
                <h3 className="text-xl font-semibold mb-3">{t.landing.step1Title}</h3>
                <p className="text-slate-400 mb-4 flex-grow">
                  {t.landing.step1Description}
                </p>
                <div className="bg-navy-900 rounded-lg p-4 text-sm font-mono text-slate-300 mt-auto">
                  <span className="text-mint">src/</span>
                  <br />
                  ├── MyToken.sol
                  <br />
                  ├── Governance.sol
                  <br />
                  └── Treasury.sol
                </div>
              </div>
            </div>

            {/* Step 2 */}
            <div className="relative h-full">
              <div className="absolute -top-4 -left-4 w-12 h-12 rounded-full bg-lavender/20 flex items-center justify-center text-lavender font-bold text-xl z-10">
                2
              </div>
              <div className="bg-navy-800 border border-navy-600 rounded-xl p-6 pt-10 h-full flex flex-col">
                <h3 className="text-xl font-semibold mb-3">{t.landing.step2Title}</h3>
                <p className="text-slate-400 mb-4 flex-grow">
                  {t.landing.step2Description}
                </p>
                <ul className="space-y-2 text-sm text-slate-300 mt-auto">
                  <li className="flex items-center gap-2">
                    <ChevronRight className="w-4 h-4 text-mint" />
                    {t.landing.step2Item1}
                  </li>
                  <li className="flex items-center gap-2">
                    <ChevronRight className="w-4 h-4 text-mint" />
                    {t.landing.step2Item2}
                  </li>
                  <li className="flex items-center gap-2">
                    <ChevronRight className="w-4 h-4 text-mint" />
                    {t.landing.step2Item3}
                  </li>
                </ul>
              </div>
            </div>

            {/* Step 3 */}
            <div className="relative h-full">
              <div className="absolute -top-4 -left-4 w-12 h-12 rounded-full bg-amber/20 flex items-center justify-center text-amber font-bold text-xl z-10">
                3
              </div>
              <div className="bg-navy-800 border border-navy-600 rounded-xl p-6 pt-10 h-full flex flex-col">
                <h3 className="text-xl font-semibold mb-3">{t.landing.step3Title}</h3>
                <p className="text-slate-400 mb-4 flex-grow">
                  {t.landing.step3Description}
                </p>
                <ul className="space-y-2 text-sm text-slate-300 mt-auto">
                  <li className="flex items-center gap-2">
                    <span className="text-mint">○</span>
                    external view/pure
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="text-coral">●</span>
                    external write
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="text-lavender">◇</span>
                    internal
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Supported Libraries Section */}
      <section className="py-20 bg-navy-800/50">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-display font-bold mb-4">{t.landing.supportedLibraries}</h2>
            <p className="text-slate-400 text-lg">
              {t.landing.supportedLibrariesDescription}
            </p>
          </div>

          <div className="flex flex-wrap justify-center gap-4">
            {[
              { name: 'OpenZeppelin', color: 'text-blue-400 bg-blue-400/20' },
              { name: 'OpenZeppelin Upgradeable', color: 'text-indigo-400 bg-indigo-400/20' },
              { name: 'Solady', color: 'text-pink-400 bg-pink-400/20' },
              { name: 'Avalanche Teleporter', color: 'text-red-400 bg-red-400/20' },
              { name: 'Avalanche ICTT', color: 'text-orange-400 bg-orange-400/20' },
              { name: 'Avalanche Validator Manager', color: 'text-amber-400 bg-amber-400/20' },
            ].map((lib) => (
              <span
                key={lib.name}
                className={`px-4 py-2 rounded-full text-sm font-medium ${lib.color}`}
              >
                {lib.name}
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20">
        <div className="max-w-3xl mx-auto px-6 text-center">
          <h2 className="text-3xl md:text-4xl font-display font-bold mb-6">
            {t.landing.ctaTitle}
          </h2>
          <p className="text-slate-400 text-lg mb-8">
            {t.landing.ctaDescription}
          </p>
          <Link
            href="/app"
            className="inline-flex items-center gap-2 px-8 py-4 bg-mint hover:bg-mint/90 text-navy-900 rounded-xl transition-colors font-semibold text-lg cursor-pointer [&_*]:cursor-pointer"
          >
            {t.landing.start}
            <ArrowRight className="w-5 h-5" />
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 border-t border-navy-700">
        <div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded overflow-hidden">
              <Image
                src="/logo.png"
                alt="Sol-Flow"
                width={24}
                height={24}
                className="w-full h-full object-cover"
              />
            </div>
            <span className="font-display font-semibold bg-gradient-to-r from-mint to-white bg-clip-text text-transparent">Sol-Flow</span>
          </div>
          <p className="text-slate-500 text-sm">
            {t.landing.footer}
          </p>
          <a
            href={REPO_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="text-slate-400 hover:text-slate-200 transition-colors text-sm cursor-pointer [&_*]:cursor-pointer"
          >
            GitHub
          </a>
        </div>
      </footer>
    </div>
  );
}
