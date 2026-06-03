import React from 'react';
import { Check, User, Tag, Calendar, ListChecks, Pencil, Trash2, Sparkles, RotateCcw } from 'lucide-react';
import { Language } from '../types';
import { motion } from 'motion/react';

interface SuccessPageProps {
  currentLang: Language;
  customerCode: string;
  orderReference: string;
  date: string;
  confirmedLinesCount: number;
  editedLinesCount: number;
  rejectedLinesCount: number;
  totalLinesCount: number;
  onReset: () => void;
}

const L = {
  IT: {
    title: 'Ordine confermato', subtitle: 'Le righe validate sono pronte per il gestionale e le tue correzioni sono state registrate per migliorare il matching.',
    summary: 'Riepilogo', customer: 'Cliente', ref: 'Riferimento', date: 'Data',
    confirmed: 'Confermate', edited: 'Corrette', rejected: 'Rifiutate', total: 'Totale righe',
    feedback: 'Feedback registrato per l’apprendimento del modello', newOrder: 'Nuovo ordine',
  },
  DE: {
    title: 'Bestellung bestätigt', subtitle: 'Die validierten Zeilen sind bereit fürs ERP und deine Korrekturen wurden zur Verbesserung des Matchings erfasst.',
    summary: 'Übersicht', customer: 'Kunde', ref: 'Referenz', date: 'Datum',
    confirmed: 'Bestätigt', edited: 'Korrigiert', rejected: 'Abgelehnt', total: 'Zeilen gesamt',
    feedback: 'Feedback für das Modelltraining erfasst', newOrder: 'Neue Bestellung',
  },
} as const;

export default function SuccessPage({
  currentLang, customerCode, orderReference, date,
  confirmedLinesCount, editedLinesCount, rejectedLinesCount, totalLinesCount, onReset,
}: SuccessPageProps) {
  const x = L[currentLang];

  const stat = (icon: React.ReactNode, label: string, value: number, tone: string) => (
    <div className="bg-paper border border-ink-150 rounded-xl p-4 text-center">
      <div className={`inline-flex items-center justify-center w-7 h-7 rounded-full mb-1.5 ${tone}`}>{icon}</div>
      <div className="text-2xl font-extrabold text-ink-900 leading-none">{value}</div>
      <div className="text-[11px] font-semibold text-ink-500 mt-1">{label}</div>
    </div>
  );

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.2, ease: [0.22, 0.61, 0.36, 1] }}
      className="max-w-[640px] mx-auto px-6 py-14 flex flex-col items-center text-center"
    >
      <div className="w-20 h-20 bg-success-soft rounded-full flex items-center justify-center text-success shadow-sm mb-6">
        <Check size={42} strokeWidth={3} />
      </div>

      <h1 className="fp-h1 text-[32px] text-ink-900 mb-2">{x.title}</h1>
      <p className="text-ink-600 text-[15px] leading-relaxed max-w-[52ch] mb-8">{x.subtitle}</p>

      <div className="bg-surface border border-ink-200 rounded-2xl shadow-sm w-full overflow-hidden text-left">
        <div className="bg-paper border-b border-ink-150 px-6 py-3">
          <span className="fp-overline text-ink-600">{x.summary}</span>
        </div>

        <div className="p-6 space-y-3 text-[13px]">
          <div className="flex items-center justify-between">
            <span className="text-ink-500 inline-flex items-center gap-1.5 font-semibold"><User size={14} /> {x.customer}</span>
            <span className="fp-mono font-bold text-ink-800 bg-paper border border-ink-200 px-2.5 py-1 rounded-lg">{customerCode || '—'}</span>
          </div>
          {orderReference && (
            <div className="flex items-center justify-between">
              <span className="text-ink-500 inline-flex items-center gap-1.5 font-semibold"><Tag size={14} /> {x.ref}</span>
              <span className="fp-mono font-bold text-ink-800">{orderReference}</span>
            </div>
          )}
          <div className="flex items-center justify-between">
            <span className="text-ink-500 inline-flex items-center gap-1.5 font-semibold"><Calendar size={14} /> {x.date}</span>
            <span className="font-semibold text-ink-700">{date}</span>
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 px-6 pb-6">
          {stat(<ListChecks size={15} />, x.total, totalLinesCount, 'bg-ink-100 text-ink-600')}
          {stat(<Check size={15} strokeWidth={3} />, x.confirmed, confirmedLinesCount, 'bg-success-soft text-success')}
          {stat(<Pencil size={14} />, x.edited, editedLinesCount, 'bg-brand-50 text-brand-600')}
          {stat(<Trash2 size={14} />, x.rejected, rejectedLinesCount, 'bg-ink-100 text-ink-500')}
        </div>

        <div className="border-t border-ink-150 bg-paper px-6 py-3 flex items-center gap-2 text-[12px] text-ink-500">
          <Sparkles size={14} className="text-saffron-500" />
          <span>{x.feedback}</span>
        </div>
      </div>

      <button
        onClick={onReset}
        className="mt-8 inline-flex items-center gap-2 bg-brand-500 hover:bg-brand-600 text-white px-6 py-3.5 rounded-full text-sm font-bold transition-colors shadow-sm fp-focus"
      >
        <RotateCcw size={16} /> {x.newOrder}
      </button>
    </motion.div>
  );
}
