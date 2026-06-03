import React, { useEffect } from 'react';
import { RefreshCw, Check, AlertTriangle } from 'lucide-react';
import { Language } from '../types';
import { translations } from '../translations';
import { motion } from 'motion/react';

interface LoadingModalProps {
  currentLang: Language;
  /** 1 = received, 2 = extracting + matching, 3 = done */
  loadingStep: number;
  error?: string | null;
  onComplete: () => void;
  onClose: () => void;
}

type StepStatus = 'pending' | 'running' | 'done';

export default function LoadingModal({ currentLang, loadingStep, error, onComplete, onClose }: LoadingModalProps) {
  const t = translations[currentLang];

  const steps: { label: string; status: StepStatus }[] = [
    { label: t.loadingStep1, status: loadingStep > 1 ? 'done' : 'running' },
    { label: currentLang === 'IT' ? 'Estrazione AI e matching catalogo' : 'KI-Extraktion und Katalog-Matching', status: loadingStep > 2 ? 'done' : loadingStep === 2 ? 'running' : 'pending' },
    { label: t.loadingStep4, status: loadingStep >= 3 ? 'done' : 'pending' },
  ];

  useEffect(() => {
    if (loadingStep >= 3 && !error) {
      const timer = setTimeout(onComplete, 600);
      return () => clearTimeout(timer);
    }
  }, [loadingStep, error, onComplete]);

  return (
    <div className="fixed inset-0 z-50 bg-ink-900/45 flex items-center justify-center p-4 backdrop-blur-[2px]">
      <motion.div
        initial={{ scale: 0.97, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.2, ease: [0.22, 0.61, 0.36, 1] }}
        className="bg-surface rounded-2xl p-10 max-w-[460px] w-full shadow-xl flex flex-col items-center"
      >
        {error ? (
          <>
            <div className="w-16 h-16 rounded-full bg-danger-soft text-danger flex items-center justify-center mb-5">
              <AlertTriangle size={32} strokeWidth={2.25} />
            </div>
            <h3 className="fp-h1 text-[22px] text-ink-900 text-center mb-2">
              {currentLang === 'IT' ? 'Qualcosa è andato storto' : 'Etwas ist schiefgelaufen'}
            </h3>
            <p className="text-sm text-ink-600 text-center mb-7 leading-relaxed">{error}</p>
            <button
              onClick={onClose}
              className="px-6 py-3 bg-brand-500 hover:bg-brand-600 text-white rounded-full text-sm font-bold transition-colors fp-focus"
            >
              {currentLang === 'IT' ? 'Chiudi e riprova' : 'Schließen und erneut versuchen'}
            </button>
          </>
        ) : (
          <>
            <div className="text-brand-500 mb-5 animate-spin" style={{ animationDuration: '1100ms' }}>
              <RefreshCw size={48} strokeWidth={2.25} />
            </div>
            <h3 className="fp-h1 text-[22px] text-ink-900 text-center mb-1">{t.loadingTitle}</h3>
            <p className="fp-overline text-ink-400 text-center mb-7">{t.loadingSubtitle}</p>

            <div className="w-full h-px bg-ink-150 mb-6" />

            <div className="w-full space-y-3.5">
              {steps.map((s, i) => (
                <div key={i} className="flex items-center justify-between text-sm">
                  <span
                    className={`font-semibold transition-colors ${
                      s.status === 'pending' ? 'text-ink-400' : s.status === 'running' ? 'text-brand-600' : 'text-ink-800'
                    }`}
                  >
                    {i + 1}. {s.label}
                  </span>
                  {s.status === 'running' && (
                    <span className="bg-brand-500 text-white text-[11px] font-bold px-2.5 py-0.5 rounded-full animate-pulse">
                      {currentLang === 'IT' ? 'IN CORSO' : 'LÄUFT'}
                    </span>
                  )}
                  {s.status === 'done' && (
                    <span className="bg-success-soft text-success text-[11px] font-bold px-1.5 py-0.5 rounded-full inline-flex items-center">
                      <Check size={13} strokeWidth={3} />
                    </span>
                  )}
                  {s.status === 'pending' && <span className="text-ink-300 text-[11px] font-semibold">—</span>}
                </div>
              ))}
            </div>
          </>
        )}
      </motion.div>
    </div>
  );
}
