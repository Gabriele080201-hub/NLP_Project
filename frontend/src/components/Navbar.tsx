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
      className="sticky top-0 z-40 h-[68px] px-6 flex items-center justify-between border-b border-ink-200 bg-surface/85 backdrop-blur-md"
    >
      {/* Left: logo + app title */}
      <div className="flex items-center gap-4">
        <FoppaLogo variant="blue" layout="horizontal" size={34} />
        <div className="hidden sm:block w-px h-8 bg-ink-200" />
        <div className="hidden sm:flex flex-col leading-tight">
          <span className="text-[15px] font-bold text-ink-900 tracking-tight">
            {t.appTitle}
          </span>
          <span className="text-[12px] text-ink-500 font-medium">
            {t.appSubtitle}
          </span>
        </div>
      </div>

      {/* Right: language toggle (segmented pill) */}
      <div
        className="flex items-center p-0.5 rounded-full border border-ink-200 bg-surface"
        role="group"
        aria-label="Language"
      >
        {(['DE', 'IT'] as const).map((lang) => (
          <button
            key={lang}
            id={`btn-lang-${lang.toLowerCase()}`}
            onClick={() => onLanguageChange(lang)}
            aria-pressed={currentLang === lang}
            className={`px-3.5 py-1.5 text-xs font-bold rounded-full transition-colors duration-150 fp-focus ${
              currentLang === lang
                ? 'bg-brand-500 text-white shadow-sm'
                : 'text-ink-500 hover:text-brand-600'
            }`}
          >
            {lang}
          </button>
        ))}
      </div>
    </nav>
  );
}
