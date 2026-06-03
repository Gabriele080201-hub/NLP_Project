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
      className="bg-[#F8F9FA] border-t border-[#E0E0E0] py-3.5 px-4 text-center mt-auto"
    >
      <div className="max-w-[1400px] mx-auto flex flex-col items-center justify-center space-y-1 text-[12px] text-[#9E9E9E] font-medium leading-relaxed">
        <p>© 2026 FOPPA S.r.l. - TASTE SUPPORTER. All Rights Reserved.</p>
        <p>
          {isIt
            ? 'Sudtirol / Alto Adige Office Automation Tools Hub - ITALIANO ACTIVE'
            : 'Sudtirol / Alto Adige Office Automation Tools Hub - DEUTSCH ACTIVE'}
        </p>
      </div>
    </footer>
  );
}
