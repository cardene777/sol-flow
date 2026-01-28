'use client';

import { useState, useRef, useEffect } from 'react';
import { Globe } from 'lucide-react';
import { useLanguage, type Language } from '@/lib/i18n';

interface LanguageSwitcherProps {
  variant?: 'default' | 'landing';
}

export function LanguageSwitcher({ variant = 'default' }: LanguageSwitcherProps) {
  const { language, setLanguage } = useLanguage();
  const [showMenu, setShowMenu] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setShowMenu(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const languages: { code: Language; label: string; flag: string }[] = [
    { code: 'en', label: 'English', flag: '🇺🇸' },
    { code: 'ja', label: '日本語', flag: '🇯🇵' },
  ];

  const currentLang = languages.find(l => l.code === language);

  const handleLanguageChange = (lang: Language) => {
    setLanguage(lang);
    setShowMenu(false);
  };

  const buttonClass = variant === 'landing'
    ? 'flex items-center gap-2 px-3 py-2 text-slate-400 hover:text-slate-200 transition-colors rounded-lg hover:bg-navy-700/50 cursor-pointer [&_*]:cursor-pointer'
    : 'flex items-center gap-1.5 p-2 sm:px-3 sm:py-1.5 rounded-lg bg-navy-700 hover:bg-navy-600 text-slate-300 transition-colors cursor-pointer [&_*]:cursor-pointer';

  return (
    <div ref={menuRef} className="relative" style={{ zIndex: 9999 }}>
      <button
        type="button"
        onClick={() => setShowMenu(!showMenu)}
        className={buttonClass}
      >
        <Globe className="w-4 h-4" />
        <span className="text-sm hidden sm:block">{currentLang?.flag}</span>
      </button>

      {showMenu && (
        <div
          className="absolute right-0 mt-1 w-36 bg-navy-700 border border-navy-600 rounded-lg shadow-xl py-1"
          style={{ zIndex: 9999 }}
        >
          {languages.map((lang) => (
            <button
              type="button"
              key={lang.code}
              onClick={() => handleLanguageChange(lang.code)}
              className={`w-full flex items-center gap-2 px-4 py-2 text-left transition-colors cursor-pointer [&_*]:cursor-pointer ${
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
