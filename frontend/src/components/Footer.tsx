import React from 'react';
import { Language } from '../types';

interface FooterProps {
  currentLang: Language;
}

export default function Footer({ currentLang }: FooterProps) {
  const isIt = currentLang === 'IT';

  return (
    <footer
      id="foppa-footer"
      className="border-t border-ink-200 py-4 px-6 text-center mt-auto bg-paper"
    >
      <div className="max-w-[1320px] mx-auto flex flex-col sm:flex-row items-center justify-center gap-x-2 gap-y-0.5 text-[12px] text-ink-500">
        <span className="font-semibold text-ink-600">© 2026 Foppa S.r.l.</span>
        <span className="hidden sm:inline text-ink-300">·</span>
        <span className="fp-overline text-accent-500">Taste Supporter</span>
        <span className="hidden sm:inline text-ink-300">·</span>
        <span>{isIt ? 'Alto Adige · Südtirol' : 'Südtirol · Alto Adige'}</span>
      </div>
    </footer>
  );
}
