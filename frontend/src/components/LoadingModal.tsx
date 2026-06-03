import React, { useEffect, useState } from 'react';
import { RefreshCw } from 'lucide-react';
import { Language } from '../types';
import { translations } from '../translations';
import { motion } from 'motion/react';

interface LoadingModalProps {
  currentLang: Language;
  loadingStep: number;
  onComplete: () => void;
}

type StepStatus = 'pending' | 'running' | 'done';

export default function LoadingModal({ currentLang, loadingStep, onComplete }: LoadingModalProps) {
  const t = translations[currentLang];
  
  // Status of the four steps computed dynamically from loadingStep
  const step1 = loadingStep >= 1 ? (loadingStep === 1 ? 'running' : 'done') : 'pending';
  const step2 = loadingStep >= 2 ? (loadingStep === 2 ? 'running' : 'done') : 'pending';
  const step3 = loadingStep >= 3 ? (loadingStep === 3 ? 'running' : 'done') : 'pending';
  const step4 = loadingStep >= 4 ? (loadingStep === 4 ? 'running' : 'done') : 'pending';

  useEffect(() => {
    if (loadingStep === 4) {
      const timer = setTimeout(() => {
        onComplete();
      }, 800);
      return () => clearTimeout(timer);
    }
  }, [loadingStep, onComplete]);

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
