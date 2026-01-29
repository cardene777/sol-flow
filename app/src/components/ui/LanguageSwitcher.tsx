'use client';

import { useState } from 'react';
import { Globe } from 'lucide-react';
import { useLanguage, type Language } from '@/lib/i18n';

interface LanguageSwitcherProps {
  variant?: 'default' | 'landing';
}

export function LanguageSwitcher({ variant = 'default' }: LanguageSwitcherProps) {
  const { language, setLanguage } = useLanguage();
  const [showMenu, setShowMenu] = useState(false);

  const languages: { code: Language; label: string; flag: string }[] = [
    { code: 'en', label: 'English', flag: '🇺🇸' },
    { code: 'ja', label: '日本語', flag: '🇯🇵' },
  ];

  const currentLang = languages.find(l => l.code === language);

  const handleLanguageChange = (lang: Language) => {
    setLanguage(lang);
    setShowMenu(false);
  };

  const isLanding = variant === 'landing';

  // z-index: landing page needs z-50 to be above hero content, app needs z-40 to be below modals (z-50)
  const zIndexClass = isLanding ? 'z-50' : 'z-40';

  return (
    <div className={`relative ${zIndexClass}`}>
      <button
        type="button"
        onClick={() => setShowMenu(!showMenu)}
        className={isLanding
          ? 'flex items-center gap-2 px-3 py-2 text-slate-400 hover:text-slate-200 transition-colors rounded-lg hover:bg-navy-700/50 cursor-pointer'
          : 'flex items-center gap-1.5 p-2 sm:px-3 sm:py-1.5 rounded-lg bg-navy-700 hover:bg-navy-600 text-slate-300 transition-colors cursor-pointer'
        }
      >
        <Globe className="w-4 h-4" />
        <span className="text-sm hidden sm:block">{currentLang?.flag}</span>
      </button>

      {showMenu && (
        <div className={`absolute right-0 mt-1 w-36 bg-navy-700 border border-navy-600 rounded-lg shadow-xl py-1 ${isLanding ? 'z-[51]' : 'z-[41]'}`}>
          {languages.map((lang) => (
            <button
              type="button"
              key={lang.code}
              onClick={() => handleLanguageChange(lang.code)}
              className={`w-full flex items-center gap-2 px-4 py-2 text-left transition-colors cursor-pointer ${
                language === lang.code
                  ? 'bg-mint/20 text-mint'
                  : 'text-slate-300 hover:bg-navy-600'
              }`}
            >
              <span>{lang.flag}</span>
              <span className="text-sm">{lang.label}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
