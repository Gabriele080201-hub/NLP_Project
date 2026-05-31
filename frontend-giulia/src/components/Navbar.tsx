import React from 'react';
import FoppaLogo from './FoppaLogo';
import { Language } from '../types';
import { translations } from '../translations';

interface NavbarProps {
  currentLang: Language;
  onLanguageChange: (lang: Language) => void;
}

export default function Navbar({ currentLang, onLanguageChange }: NavbarProps) {
  const t = translations[currentLang];

  return (
    <nav
      id="foppa-navbar"
      className="bg-[#1565C0] text-white h-[70px] px-6 flex items-center justify-between shadow-md"
    >
      {/* Left side: Logo & Subtitles */}
      <div className="flex items-center space-x-4">
        {/* White rectangular container holding the logo */}
        <div
          id="foppa-logo-container"
          className="bg-white px-3 py-1 rounded-[4px] h-[50px] flex items-center justify-center shadow-sm"
        >
          <FoppaLogo />
        </div>

        {/* Vertical divider */}
        <div className="w-[1px] bg-white/40 h-[36px]" />

        {/* Stacked Titles */}
        <div className="flex flex-col justify-center">
          <span className="text-[18px] font-bold leading-tight tracking-tight">
            {t.appTitle}
          </span>
          <span className="text-[13px] text-white/80 font-medium leading-none">
            {t.appSubtitle}
          </span>
        </div>
      </div>

      {/* Right side: Language Toggle */}
      <div className="flex items-center space-x-2">
        <button
          id="btn-lang-de"
          onClick={() => onLanguageChange('DE')}
          className={`px-3 py-1.5 text-xs font-bold roundedTransition transition-all duration-150 rounded ${
            currentLang === 'DE'
              ? 'bg-white text-[#1565C0]'
              : 'bg-transparent text-white border border-white hover:bg-white/10'
          }`}
        >
          DE
        </button>
        <button
          id="btn-lang-it"
          onClick={() => onLanguageChange('IT')}
          className={`px-3 py-1.5 text-xs font-bold roundedTransition transition-all duration-150 rounded ${
            currentLang === 'IT'
              ? 'bg-white text-[#1565C0]'
              : 'bg-transparent text-white border border-white hover:bg-white/10'
          }`}
        >
          IT
        </button>
      </div>
    </nav>
  );
}
