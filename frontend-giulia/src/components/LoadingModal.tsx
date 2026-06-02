import React, { useEffect, useState } from 'react';
import { RefreshCw } from 'lucide-react';
import { Language } from '../types';
import { translations } from '../translations';
import { motion } from 'motion/react';

interface LoadingModalProps {
  currentLang: Language;
  onComplete: () => void;
}

type StepStatus = 'pending' | 'running' | 'done';

export default function LoadingModal({ currentLang, onComplete }: LoadingModalProps) {
  const t = translations[currentLang];
  
  // Status of the four steps
  const [step1, setStep1] = useState<StepStatus>('running');
  const [step2, setStep2] = useState<StepStatus>('pending');
  const [step3, setStep3] = useState<StepStatus>('pending');
  const [step4, setStep4] = useState<StepStatus>('pending');

  useEffect(() => {
    // Step 1: starts running immediately. At 500ms, Step 1 is done, Step 2 becomes running
    const timer1 = setTimeout(() => {
      setStep1('done');
      setStep2('running');
    }, 500);

    // Step 2: running at 500ms, done at 2000ms, Step 3 becomes running
    const timer2 = setTimeout(() => {
      setStep2('done');
      setStep3('running');
    }, 2000);

    // Step 3: running at 2000ms, done at 3500ms, Step 4 becomes running
    const timer3 = setTimeout(() => {
      setStep3('done');
      setStep4('running');
    }, 3500);

    // Step 4: running at 3500ms, done at 5000ms
    const timer4 = setTimeout(() => {
      setStep4('done');
    }, 5000);

    // Transition to Page 2 at 5800ms
    const timer5 = setTimeout(() => {
      onComplete();
    }, 5800);

    return () => {
      clearTimeout(timer1);
      clearTimeout(timer2);
      clearTimeout(timer3);
      clearTimeout(timer4);
      clearTimeout(timer5);
    };
  }, [onComplete]);

  const renderBadge = (status: StepStatus) => {
    if (status === 'running') {
      return (
        <span className="bg-[#1565C0] text-white text-[11px] font-bold px-2.5 py-0.5 rounded-full tracking-wider animate-pulse">
          RUNNING
        </span>
      );
    }
    if (status === 'done') {
      return (
        <span className="bg-[#E8F5E9] text-[#2E7D32] text-[11px] font-bold px-2.5 py-0.5 rounded-full tracking-wider">
          OK
        </span>
      );
    }
    return (
      <span className="text-[#9E9E9E] text-[11px] font-semibold">
        -
      </span>
    );
  };

  return (
    <div
      id="loading-overlay"
      className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4 backdrop-blur-[2px]"
    >
      <motion.div
        id="loading-card"
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.2, ease: 'easeOut' }}
        className="bg-white rounded-[12px] p-10 md:px-12 md:py-10 max-w-[520px] w-full shadow-2xl flex flex-col items-center"
      >
        {/* Blue spinning circular arrows icon */}
        <div className="text-[#1565C0] mb-5 animate-spin duration-1000">
          <RefreshCw size={56} strokeWidth={2.5} />
        </div>

        {/* Title */}
        <h3 className="text-[22px] font-bold text-[#1C2B3A] text-center mb-1 leading-tight">
          {t.loadingTitle}
        </h3>

        {/* Subtitle */}
        <p className="text-[11px] text-[#9E9E9E] font-bold tracking-widest text-center uppercase mb-6">
          {t.loadingSubtitle}
        </p>

        {/* Divider */}
        <div className="w-full h-[1px] bg-[#E0E0E0] mb-6" />

        {/* Steps */}
        <div className="w-full space-y-4">
          {/* Step 1 */}
          <div className="flex items-center justify-between text-sm">
            <span
              className={`font-semibold transition-colors duration-150 ${
                step1 === 'pending'
                  ? 'text-[#9E9E9E]'
                  : step1 === 'running'
                  ? 'text-[#1565C0] font-bold'
                  : 'text-[#1C2B3A]'
              }`}
            >
              1. {t.loadingStep1}
            </span>
            {renderBadge(step1)}
          </div>

          {/* Step 2 */}
          <div className="flex items-center justify-between text-sm">
            <span
              className={`font-semibold transition-colors duration-150 ${
                step2 === 'pending'
                  ? 'text-[#9E9E9E]'
                  : step2 === 'running'
                  ? 'text-[#1565C0] font-bold'
                  : 'text-[#1C2B3A]'
              }`}
            >
              2. {t.loadingStep2}
            </span>
            {renderBadge(step2)}
          </div>

          {/* Step 3 */}
          <div className="flex items-center justify-between text-sm">
            <span
              className={`font-semibold transition-colors duration-150 ${
                step3 === 'pending'
                  ? 'text-[#9E9E9E]'
                  : step3 === 'running'
                  ? 'text-[#1565C0] font-bold'
                  : 'text-[#1C2B3A]'
              }`}
            >
              3. {t.loadingStep3}
            </span>
            {renderBadge(step3)}
          </div>

          {/* Step 4 */}
          <div className="flex items-center justify-between text-sm">
            <span
              className={`font-semibold transition-colors duration-150 ${
                step4 === 'pending'
                  ? 'text-[#9E9E9E]'
                  : step4 === 'running'
                  ? 'text-[#1565C0] font-bold'
                  : 'text-[#1C2B3A]'
              }`}
            >
              4. {t.loadingStep4}
            </span>
            {renderBadge(step4)}
          </div>
        </div>
      </motion.div>
    </div>
  );
}
