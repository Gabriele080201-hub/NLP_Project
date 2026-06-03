import React from 'react';
import { Check, ArrowRight, User, Tag, Calendar, ListChecks } from 'lucide-react';
import { Language } from '../types';
import { translations } from '../translations';
import { motion } from 'motion/react';

interface SuccessPageProps {
  currentLang: Language;
  customerCode: string;
  orderReference: string;
  date: string;
  confirmedLinesCount: number;
  totalLinesCount: number;
  onReset: () => void;
}

export default function SuccessPage({
  currentLang,
  customerCode,
  orderReference,
  date,
  confirmedLinesCount,
  totalLinesCount,
  onReset
}: SuccessPageProps) {
  const t = translations[currentLang];

  return (
    <motion.div
      id="success-page-root"
      initial={{ opacity: 0, scale: 0.98 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.2, ease: 'easeOut' }}
      className="max-w-[1400px] mx-auto px-6 py-12 flex flex-col items-center justify-center text-center space-y-8"
    >
      {/* Centered Large checkmark inside a circular container */}
      <div className="w-20 h-20 bg-[#E8F5E9] rounded-full flex items-center justify-center text-[#2E7D32] shadow-sm">
        <Check size={40} strokeWidth={3} />
      </div>

      {/* Main Title */}
      <div className="space-y-2">
        <h1 className="text-[28px] font-bold text-[#1C2B3A] tracking-tight leading-tight">
          {t.page3Title}
        </h1>
        <p className="text-sm font-medium text-[#9E9E9E] max-w-[580px] mx-auto">
          {t.page3Subtitle}
        </p>
      </div>

      {/* Summary Card */}
      <div
        id="success-summary-card"
        className="bg-white border border-[#E0E0E0] rounded-[8px] w-full max-w-[520px] shadow-sm overflow-hidden text-left"
      >
        {/* Card Header Label */}
        <div className="bg-[#F8F9FA] border-b border-[#E0E0E0] px-6 py-3">
          <span className="text-[11px] font-bold text-[#1C2B3A] tracking-wider uppercase">
            {t.summaryTransmissionTitle}
          </span>
        </div>

        {/* Card Fields */}
        <div className="p-6 space-y-4 text-xs font-medium text-[#1C2B3A]">
          {/* Customer Code */}
          <div className="flex items-center justify-between">
            <span className="text-[#9E9E9E] flex items-center space-x-1.5 font-semibold">
              <User size={13} />
              <span>{t.validationCustomerCode}</span>
            </span>
            <span className="border border-[#E0E0E0] px-2.5 py-1 rounded-[4px] font-bold bg-[#F8F9FA]">
              {customerCode || '1204'}
            </span>
          </div>

          {/* Order Reference */}
          <div className="flex items-center justify-between">
            <span className="text-[#9E9E9E] flex items-center space-x-1.5 font-semibold">
              <Tag size={13} />
              <span>{t.validationOrderRef}</span>
            </span>
            <span className="font-bold">
              {orderReference || 'FORN-2026-031'}
            </span>
          </div>

          {/* Processing Date */}
          <div className="flex items-center justify-between">
            <span className="text-[#9E9E9E] flex items-center space-x-1.5 font-semibold">
              <Calendar size={13} />
              <span>{t.date}</span>
            </span>
            <span className="font-semibold text-stone-600">
              {date}
            </span>
          </div>

          {/* Lines Transmitted */}
          <div className="flex items-center justify-between">
            <span className="text-[#9E9E9E] flex items-center space-x-1.5 font-semibold">
              <ListChecks size={13} />
              <span>{t.linesTransmitted}</span>
            </span>
            <span className="bg-[#E8F5E9] text-[#2E7D32] text-[11px] font-bold px-3 py-1 rounded-full">
              {confirmedLinesCount} / {totalLinesCount} {currentLang === 'IT' ? 'righe' : 'Zeilen'}
            </span>
          </div>
        </div>

        {/* Card Footer (Monospace, Grey) */}
        <div className="border-t border-[#E0E0E0] bg-[#F8F9FA] px-6 py-3 flex justify-between items-center text-[10px] font-mono text-[#9E9E9E]">
          <span>ID TRANSAZIONE ERP: FOPPA-{customerCode || '1204'}</span>
          <span>STATUS: SYNCED</span>
        </div>
      </div>

      {/* Reset button to start new order (green) */}
      <button
        id="btn-navigate-new-order"
        onClick={onReset}
        className="inline-flex items-center space-x-2 bg-[#388E3C] hover:bg-[#2E7D32] text-white px-6 py-3.5 rounded-[4px] text-xs font-bold uppercase tracking-wider transition-all duration-150 shadow-sm hover:shadow"
      >
        <span>{t.btnNewOrder}</span>
      </button>
    </motion.div>
  );
}
