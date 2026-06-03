import React, { useMemo, useState } from 'react';
import {
  Check, Pencil, Trash2, X, Plus, Minus, ArrowLeft, ArrowRight,
  AlertTriangle, RotateCcw, Download, CheckCheck, FileText, Info,
} from 'lucide-react';
import { Language, OrderLine, ExtractionNote, OrderSource } from '../types';
import { translations } from '../translations';
import { motion, AnimatePresence } from 'motion/react';
import SourceViewer from './SourceViewer';

interface ReviewPageProps {
  currentLang: Language;
  onConfirmOrder: (
    summaryData: {
      customerCode: string; orderReference: string; date: string;
      confirmedCount: number; editedCount: number; rejectedCount: number; totalCount: number;
    },
    finalLines: OrderLine[]
  ) => void;
  onBackToUpload: () => void;
  metadata: { customerCode: string; orderReference: string; date: string; inputType: 'IMAGINE' | 'VOCALE' | 'TESTO'; filename: string };
  initialLines: OrderLine[];
  initialNotes: ExtractionNote[];
  logistics: { it: string; de: string };
  rawText: string;
  source: OrderSource | null;
}

const L = {
  IT: {
    title: 'Revisione ordine', lead: 'Confronta la fonte con le righe estratte. Conferma quelle giuste, correggi le incerte.',
    back: 'Indietro', confirmOrder: 'Conferma e invia', confirmSafe: 'Conferma le sicure', addLine: 'Aggiungi riga',
    filterAll: 'Tutte', filterAttention: 'Da risolvere', progress: 'risolte',
    customer: 'Cliente', ref: 'Riferimento', date: 'Data',
    confirm: 'Conferma', edit: 'Modifica', reject: 'Rifiuta', restore: 'Ripristina', save: 'Salva', cancel: 'Annulla',
    altTitle: 'Alternative dal catalogo (clicca per scegliere)', suggestions: 'Suggerimenti AI',
    fDesc: 'Descrizione prodotto', fSku: 'Codice articolo (SKU)', fQty: 'Quantità', fUnit: 'Unità',
    skuHint: 'Per ora il codice si inserisce a mano o si sceglie tra le alternative.',
    notesTitle: 'Note di estrazione', logistics: 'Logistica',
    gateLocked: 'Risolvi le righe critiche per inviare', gateOpen: 'Pronto per l’invio',
    statusConfirmed: 'Confermata', statusRejected: 'Rifiutata', statusPending: 'In attesa', statusTodo: 'Da completare',
    confHigh: 'Alta confidenza', confReview: 'Da rivedere', confRequired: 'Validazione richiesta',
    exportJson: 'Esporta JSON', exportCsv: 'Esporta CSV', noResolved: 'Nessuna riga da risolvere — tutto a posto.',
    manualLine: '(riga manuale)', allResolved: 'Tutte le righe risolte',
  },
  DE: {
    title: 'Bestellung prüfen', lead: 'Vergleiche die Quelle mit den extrahierten Zeilen. Bestätige korrekte, korrigiere unsichere.',
    back: 'Zurück', confirmOrder: 'Bestätigen & senden', confirmSafe: 'Sichere bestätigen', addLine: 'Zeile hinzufügen',
    filterAll: 'Alle', filterAttention: 'Offen', progress: 'erledigt',
    customer: 'Kunde', ref: 'Referenz', date: 'Datum',
    confirm: 'Bestätigen', edit: 'Bearbeiten', reject: 'Ablehnen', restore: 'Zurücksetzen', save: 'Speichern', cancel: 'Abbrechen',
    altTitle: 'Katalog-Alternativen (zum Wählen klicken)', suggestions: 'KI-Vorschläge',
    fDesc: 'Produktbeschreibung', fSku: 'Artikelcode (SKU)', fQty: 'Menge', fUnit: 'Einheit',
    skuHint: 'Der Code wird vorerst manuell eingegeben oder aus den Alternativen gewählt.',
    notesTitle: 'Extraktionsnotizen', logistics: 'Logistik',
    gateLocked: 'Kritische Zeilen lösen, um zu senden', gateOpen: 'Bereit zum Senden',
    statusConfirmed: 'Bestätigt', statusRejected: 'Abgelehnt', statusPending: 'Ausstehend', statusTodo: 'Offen',
    confHigh: 'Hohe Konfidenz', confReview: 'Prüfen', confRequired: 'Validierung nötig',
    exportJson: 'JSON export', exportCsv: 'CSV export', noResolved: 'Keine offenen Zeilen — alles erledigt.',
    manualLine: '(manuelle Zeile)', allResolved: 'Alle Zeilen erledigt',
  },
} as const;

const UNITS = ['kg', 'l', 'pz', 'carton', 'sack', 'bucket', 'can', 'bottle', 'brick', 'cup', 'jar', 'pack', 'canister'];

type ConfLabel = 'HIGH_CONFIDENCE' | 'REVIEW_RECOMMENDED' | 'HUMAN_VALIDATION_REQUIRED';

const confLabelOf = (line: OrderLine): ConfLabel => {
  if (line.initialConfidenceLabel === 'HIGH_CONFIDENCE' || line.initialConfidenceLabel === 'REVIEW_RECOMMENDED' || line.initialConfidenceLabel === 'HUMAN_VALIDATION_REQUIRED') {
    return line.initialConfidenceLabel;
  }
  if (line.confidence >= 0.95) return 'HIGH_CONFIDENCE';
  if (line.confidence >= 0.8) return 'REVIEW_RECOMMENDED';
  return 'HUMAN_VALIDATION_REQUIRED';
};

const isResolved = (l: OrderLine) => l.status === 'confirmed' || l.status === 'unreadable';

export default function ReviewPage({
  currentLang, onConfirmOrder, onBackToUpload, metadata,
  initialLines, initialNotes, logistics, rawText, source,
}: ReviewPageProps) {
  const t = translations[currentLang];
  const x = L[currentLang];

  const [lines, setLines] = useState<OrderLine[]>(initialLines);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [filter, setFilter] = useState<'all' | 'attention'>('all');

  // edit form
  const [eDesc, setEDesc] = useState('');
  const [eSku, setESku] = useState('');
  const [eQty, setEQty] = useState('');
  const [eUnit, setEUnit] = useState('');

  const counts = useMemo(() => {
    const confirmed = lines.filter((l) => l.status === 'confirmed').length;
    const rejected = lines.filter((l) => l.status === 'unreadable').length;
    const edited = lines.filter((l) => l.modified).length;
    const resolved = lines.filter(isResolved).length;
    const attention = lines.length - resolved;
    const unresolvedCritical = lines.filter((l) => confLabelOf(l) === 'HUMAN_VALIDATION_REQUIRED' && !isResolved(l)).length;
    return { confirmed, rejected, edited, resolved, attention, unresolvedCritical };
  }, [lines]);

  const canConfirmOrder = lines.length > 0 && counts.unresolvedCritical === 0;

  const update = (id: number, patch: Partial<OrderLine>) =>
    setLines((prev) => prev.map((l) => (l.id === id ? { ...l, ...patch } : l)));

  const confirmRow = (id: number) => update(id, { status: 'confirmed' });
  const rejectRow = (id: number) => update(id, { status: 'unreadable' });
  const restoreRow = (id: number) => {
    const orig = initialLines.find((l) => l.id === id);
    if (orig) update(id, { ...orig });
    else update(id, { status: 'to_complete', modified: false });
  };

  const selectAlternative = (id: number, altSku: string) => {
    const code = altSku.split(' – ')[0];
    const desc = altSku.split(' – ').slice(1).join(' – ');
    update(id, { matchedSku: altSku, itDescription: desc || altSku, deDescription: desc || altSku, status: 'confirmed', modified: code !== undefined });
  };

  const openEdit = (l: OrderLine) => {
    setEditingId(l.id);
    setEDesc(currentLang === 'IT' ? l.itDescription : l.deDescription);
    setESku(l.matchedSku || '');
    setEQty(l.qty === '–' ? '' : l.qty);
    setEUnit(l.unit === '–' ? '' : l.unit);
  };

  const saveEdit = (id: number) => {
    update(id, {
      itDescription: eDesc, deDescription: eDesc,
      matchedSku: eSku, qty: eQty.trim() === '' ? '–' : eQty.trim(),
      unit: eUnit.trim() === '' ? '–' : eUnit.trim(),
      status: 'confirmed', modified: true,
    });
    setEditingId(null);
  };

  const confirmSafe = () => {
    setLines((prev) => prev.map((l) => (!isResolved(l) && confLabelOf(l) !== 'HUMAN_VALIDATION_REQUIRED' ? { ...l, status: 'confirmed' } : l)));
  };

  const addLine = () => {
    const nextId = (lines.reduce((m, l) => Math.max(m, l.id), 0) || 0) + 1;
    const newLine: OrderLine = {
      id: nextId, originalText: x.manualLine, itDescription: '', deDescription: '',
      qty: '–', unit: '–', lang: currentLang === 'IT' ? 'IT' : 'DE', confidence: 0,
      status: 'to_complete', matchedSku: '', initialMatchedSku: '', alternativeSkus: [], modified: true,
    };
    setLines((prev) => [...prev, newLine]);
    openEdit(newLine);
  };

  const adjustQty = (delta: number) => {
    const n = parseFloat(eQty.replace(',', '.'));
    const base = isNaN(n) ? 0 : n;
    const next = Math.max(0, Math.round((base + delta) * 100) / 100);
    setEQty(String(next));
  };

  // ---- export (secondary) ----
  const jsonOutput = () => ({
    customer_code: metadata.customerCode || null,
    order_reference: metadata.orderReference || null,
    date: metadata.date || null,
    total_items: lines.length,
    order_items: lines.map((l) => ({
      original_text: l.originalText,
      product_description: currentLang === 'IT' ? l.itDescription : l.deDescription,
      matched_sku: l.matchedSku || null,
      qty: l.qty === '–' ? null : l.qty,
      unit: l.unit === '–' ? null : l.unit,
      confidence: l.confidence,
      status: l.status,
      modified: !!l.modified,
    })),
  });
  const download = (name: string, href: string) => {
    const a = document.createElement('a');
    a.setAttribute('href', href);
    a.setAttribute('download', name);
    document.body.appendChild(a); a.click(); a.remove();
  };
  const exportJson = () => download(`foppa_${metadata.orderReference || 'order'}.json`,
    'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(jsonOutput(), null, 2)));
  const exportCsv = () => {
    let csv = 'data:text/csv;charset=utf-8,﻿#,Original,Product,SKU,Qty,Unit,Status,Confidence\n';
    lines.forEach((l, i) => {
      const desc = (currentLang === 'IT' ? l.itDescription : l.deDescription).replace(/"/g, '""');
      csv += `"${i + 1}","${l.originalText.replace(/"/g, '""')}","${desc}","${(l.matchedSku || '').replace(/"/g, '""')}","${l.qty}","${l.unit}","${l.status}","${l.confidence}"\n`;
    });
    download(`foppa_${metadata.orderReference || 'order'}.csv`, encodeURI(csv));
  };

  const submit = () => onConfirmOrder({
    customerCode: metadata.customerCode, orderReference: metadata.orderReference, date: metadata.date,
    confirmedCount: counts.confirmed, editedCount: counts.edited, rejectedCount: counts.rejected, totalCount: lines.length,
  }, lines);

  const visibleLines = filter === 'attention' ? lines.filter((l) => !isResolved(l)) : lines;

  // ---- small presentational helpers ----
  const confPill = (l: OrderLine) => {
    const lab = confLabelOf(l);
    const pct = Math.round(l.confidence * 100);
    const map = {
      HIGH_CONFIDENCE: ['bg-success-soft', 'text-success', x.confHigh],
      REVIEW_RECOMMENDED: ['bg-warning-soft', 'text-warning', x.confReview],
      HUMAN_VALIDATION_REQUIRED: ['bg-danger-soft', 'text-danger', x.confRequired],
    }[lab];
    return (
      <span className={`inline-flex items-center gap-1 ${map[0]} ${map[1]} text-[10px] font-bold px-2 py-0.5 rounded-full`}>
        {lab === 'HIGH_CONFIDENCE' ? <Check size={11} strokeWidth={3} /> : <AlertTriangle size={10} strokeWidth={2.5} />}
        {map[2]}{l.confidence > 0 ? ` · ${pct}%` : ''}
      </span>
    );
  };
  const statusPill = (l: OrderLine) => {
    const map: Record<string, [string, string, string]> = {
      confirmed: ['bg-success-soft', 'text-success', x.statusConfirmed],
      unreadable: ['bg-ink-100', 'text-ink-500', x.statusRejected],
      pending: ['bg-warning-soft', 'text-warning', x.statusPending],
      to_complete: ['bg-ink-100', 'text-ink-600', x.statusTodo],
    };
    const m = map[l.status] || map.to_complete;
    return <span className={`inline-flex items-center gap-1.5 ${m[0]} ${m[1]} text-[11px] font-bold px-2.5 py-0.5 rounded-full`}>
      <span className="w-1.5 h-1.5 rounded-full bg-current opacity-70" /> {m[2]}
    </span>;
  };
  const accentByConf = (l: OrderLine) => {
    if (l.status === 'unreadable') return 'border-l-ink-300';
    const lab = confLabelOf(l);
    return lab === 'HIGH_CONFIDENCE' ? 'border-l-success' : lab === 'REVIEW_RECOMMENDED' ? 'border-l-warning' : 'border-l-danger';
  };

  return (
    <div className="pb-20">
      {/* Sticky workspace header */}
      <div className="sticky top-[68px] z-30 bg-paper/90 backdrop-blur-md border-b border-ink-200">
        <div className="max-w-[1320px] mx-auto px-6 py-3 flex items-center gap-4">
          <button onClick={onBackToUpload} className="inline-flex items-center gap-1.5 text-sm font-bold text-ink-600 hover:text-ink-900 transition-colors fp-focus rounded-full px-2 py-1">
            <ArrowLeft size={16} /> <span className="hidden sm:inline">{x.back}</span>
          </button>
          <div className="hidden md:flex items-center gap-2 text-[12px]">
            <span className="fp-mono font-bold text-ink-800 bg-surface border border-ink-200 rounded-full px-2.5 py-1">{x.customer}: {metadata.customerCode || '—'}</span>
            {metadata.orderReference && <span className="fp-mono text-ink-600 bg-surface border border-ink-200 rounded-full px-2.5 py-1">{metadata.orderReference}</span>}
            <span className="text-ink-500 bg-surface border border-ink-200 rounded-full px-2.5 py-1">{metadata.date}</span>
          </div>
          <div className="flex-1" />
          {/* progress */}
          <div className="hidden sm:flex items-center gap-2 text-[12px] font-semibold text-ink-600">
            <div className="w-28 h-1.5 rounded-full bg-ink-150 overflow-hidden">
              <div className="h-full bg-brand-500 transition-all duration-300" style={{ width: `${lines.length ? (counts.resolved / lines.length) * 100 : 0}%` }} />
            </div>
            <span>{counts.resolved}/{lines.length} {x.progress}</span>
          </div>
          <button
            onClick={submit}
            disabled={!canConfirmOrder}
            title={canConfirmOrder ? x.gateOpen : x.gateLocked}
            className={`inline-flex items-center gap-2 px-5 py-2.5 rounded-full text-sm font-bold transition-colors fp-focus ${
              canConfirmOrder ? 'bg-brand-500 hover:bg-brand-600 text-white shadow-sm' : 'bg-ink-100 text-ink-400 cursor-not-allowed'
            }`}
          >
            {x.confirmOrder} <ArrowRight size={16} />
          </button>
        </div>
      </div>

      <div className="max-w-[1320px] mx-auto px-6 pt-8">
        <h1 className="fp-h1 text-[30px] text-ink-900 mb-1">{x.title}</h1>
        <p className="text-ink-600 text-[15px] mb-6 max-w-[70ch]">{x.lead}</p>

        <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,420px)_1fr] gap-6 items-start">
          {/* LEFT: source (sticky) */}
          <div className="lg:sticky lg:top-[140px] space-y-4">
            <SourceViewer currentLang={currentLang} source={source} rawText={rawText} />

            {/* Notes / logistics (compact) */}
            {(initialNotes.length > 0 || logistics.it || logistics.de) && (
              <div className="bg-surface border border-ink-200 rounded-2xl shadow-sm p-4 space-y-3">
                <span className="fp-overline text-ink-600 inline-flex items-center gap-1.5"><Info size={13} /> {x.notesTitle}</span>
                {initialNotes.map((n, i) => (
                  <div key={i} className={`rounded-lg p-3 text-[12.5px] ${n.uncertain ? 'bg-warning-soft' : 'bg-paper'}`}>
                    <p className="fp-mono text-ink-400 italic mb-0.5">"{n.original}"</p>
                    <p className="text-ink-700 font-semibold">{currentLang === 'IT' ? n.extracted.it : n.extracted.de}</p>
                  </div>
                ))}
                <p className="text-[12px] text-ink-600"><span className="font-bold">{x.logistics}:</span> {currentLang === 'IT' ? logistics.it : logistics.de}</p>
              </div>
            )}
          </div>

          {/* RIGHT: lines */}
          <div>
            {/* toolbar */}
            <div className="flex flex-wrap items-center gap-3 mb-4">
              <div className="inline-flex p-1 rounded-full bg-paper-2 border border-ink-200">
                {(['all', 'attention'] as const).map((f) => (
                  <button
                    key={f}
                    onClick={() => setFilter(f)}
                    className={`px-3.5 py-1.5 rounded-full text-[13px] font-bold transition-colors ${filter === f ? 'bg-surface text-brand-600 shadow-sm' : 'text-ink-500 hover:text-ink-700'}`}
                  >
                    {f === 'all' ? `${x.filterAll} · ${lines.length}` : `${x.filterAttention} · ${counts.attention}`}
                  </button>
                ))}
              </div>
              <div className="flex-1" />
              {counts.attention > 0 && (
                <button onClick={confirmSafe} className="inline-flex items-center gap-1.5 text-[13px] font-bold text-brand-600 hover:text-brand-700 border border-ink-200 hover:border-brand-300 bg-surface rounded-full px-3.5 py-1.5 transition-colors">
                  <CheckCheck size={15} /> {x.confirmSafe}
                </button>
              )}
              <button onClick={addLine} className="inline-flex items-center gap-1.5 text-[13px] font-bold text-ink-700 hover:text-ink-900 border border-ink-200 hover:border-ink-300 bg-surface rounded-full px-3.5 py-1.5 transition-colors">
                <Plus size={15} /> {x.addLine}
              </button>
            </div>

            {/* lines list */}
            <div className="space-y-3">
              {visibleLines.length === 0 && (
                <div className="bg-surface border border-ink-200 rounded-2xl p-10 text-center text-ink-500">
                  <CheckCheck size={28} className="mx-auto mb-2 text-success" /> {x.noResolved}
                </div>
              )}

              {visibleLines.map((l) => {
                const editing = editingId === l.id;
                const desc = currentLang === 'IT' ? l.itDescription : l.deDescription;
                return (
                  <div key={l.id} className={`bg-surface border border-ink-200 border-l-[3px] ${accentByConf(l)} rounded-xl shadow-sm overflow-hidden`}>
                    <div className="p-4">
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="text-[11px] font-bold text-ink-400">#{l.id}</span>
                            {statusPill(l)}
                            {confPill(l)}
                            {l.modified && <span className="text-[9px] font-extrabold uppercase tracking-wide text-brand-600 bg-brand-50 border border-brand-100 px-1.5 py-0.5 rounded">{currentLang === 'IT' ? 'Modificata' : 'Geändert'}</span>}
                          </div>
                          <p className={`fp-mono text-[12.5px] ${l.status === 'unreadable' ? 'line-through text-ink-400' : 'text-ink-500'} truncate`} title={l.originalText}>
                            "{l.originalText}"
                          </p>
                        </div>
                        {/* row actions */}
                        <div className="flex items-center gap-1 flex-none">
                          {l.status !== 'confirmed' && (
                            <button onClick={() => confirmRow(l.id)} title={x.confirm} className="w-8 h-8 inline-flex items-center justify-center rounded-full text-ink-500 hover:text-success hover:bg-success-soft transition-colors">
                              <Check size={16} strokeWidth={2.5} />
                            </button>
                          )}
                          <button onClick={() => openEdit(l)} title={x.edit} className="w-8 h-8 inline-flex items-center justify-center rounded-full text-ink-500 hover:text-brand-600 hover:bg-brand-50 transition-colors">
                            <Pencil size={15} />
                          </button>
                          {l.status !== 'unreadable' && (
                            <button onClick={() => rejectRow(l.id)} title={x.reject} className="w-8 h-8 inline-flex items-center justify-center rounded-full text-ink-500 hover:text-danger hover:bg-danger-soft transition-colors">
                              <Trash2 size={15} />
                            </button>
                          )}
                          {(l.status === 'confirmed' || l.status === 'unreadable' || l.modified) && (
                            <button onClick={() => restoreRow(l.id)} title={x.restore} className="w-8 h-8 inline-flex items-center justify-center rounded-full text-ink-400 hover:text-ink-700 hover:bg-ink-100 transition-colors">
                              <RotateCcw size={14} />
                            </button>
                          )}
                        </div>
                      </div>

                      {/* product line */}
                      <div className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-1.5">
                        <span className="text-[14px] font-bold text-ink-900">{desc || <span className="text-ink-400 italic font-medium">{currentLang === 'IT' ? 'da assegnare' : 'zuzuordnen'}</span>}</span>
                        <span className="fp-mono text-[11px] font-bold text-ink-700 bg-paper-2 border border-ink-200 rounded px-1.5 py-0.5">{(l.matchedSku || '—').split(' – ')[0]}</span>
                        <span className="text-[13px] text-ink-600">
                          <span className="font-bold text-ink-800">{l.qty}</span> <span className="fp-mono text-ink-500">{l.unit}</span>
                        </span>
                        <span className="text-[10px] font-bold text-ink-400 border border-ink-200 rounded px-1 py-0.5">{l.lang}</span>
                      </div>

                      {/* alternatives */}
                      {!editing && l.status !== 'confirmed' && l.alternativeSkus && l.alternativeSkus.length > 0 && (
                        <div className="mt-3 pt-3 border-t border-dashed border-ink-200">
                          <p className="fp-overline text-ink-400 mb-1.5">{x.altTitle}</p>
                          <div className="flex flex-wrap gap-1.5">
                            {l.alternativeSkus.map((alt) => (
                              <button key={alt} onClick={() => selectAlternative(l.id, alt)} title={alt}
                                className="max-w-full truncate text-left text-[11.5px] font-semibold text-ink-700 bg-paper hover:bg-brand-50 hover:text-brand-700 border border-ink-200 hover:border-brand-300 rounded-lg px-2.5 py-1 transition-colors fp-mono">
                                {alt}
                              </button>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>

                    {/* edit panel */}
                    <AnimatePresence initial={false}>
                      {editing && (
                        <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.15 }} className="overflow-hidden">
                          <div className="border-t border-ink-200 bg-paper p-4 space-y-3">
                            <div className="grid grid-cols-1 sm:grid-cols-12 gap-3">
                              <div className="sm:col-span-7">
                                <label className="fp-overline text-ink-600 block mb-1">{x.fDesc}</label>
                                <input value={eDesc} onChange={(e) => setEDesc(e.target.value)} className="w-full bg-surface border border-ink-200 rounded-lg px-3 py-2 text-sm font-semibold text-ink-800 focus:outline-none focus:border-brand-400 fp-focus" />
                              </div>
                              <div className="sm:col-span-3">
                                <label className="fp-overline text-ink-600 block mb-1">{x.fQty}</label>
                                <div className="flex items-center bg-surface border border-ink-200 rounded-lg">
                                  <button onClick={() => adjustQty(-1)} className="w-9 h-9 inline-flex items-center justify-center text-brand-500 hover:bg-brand-50 rounded-l-lg"><Minus size={14} /></button>
                                  <input value={eQty} onChange={(e) => setEQty(e.target.value)} inputMode="decimal" className="w-full text-center text-sm font-bold fp-mono text-ink-800 focus:outline-none bg-transparent" />
                                  <button onClick={() => adjustQty(1)} className="w-9 h-9 inline-flex items-center justify-center text-brand-500 hover:bg-brand-50 rounded-r-lg"><Plus size={14} /></button>
                                </div>
                              </div>
                              <div className="sm:col-span-2">
                                <label className="fp-overline text-ink-600 block mb-1">{x.fUnit}</label>
                                <input value={eUnit} onChange={(e) => setEUnit(e.target.value)} list="unit-options" className="w-full bg-surface border border-ink-200 rounded-lg px-3 py-2 text-sm fp-mono text-ink-800 focus:outline-none focus:border-brand-400 fp-focus" />
                                <datalist id="unit-options">{UNITS.map((u) => <option key={u} value={u} />)}</datalist>
                              </div>
                            </div>
                            <div>
                              <label className="fp-overline text-ink-600 block mb-1">{x.fSku}</label>
                              <input value={eSku} onChange={(e) => setESku(e.target.value)} placeholder="ZUC20 – Zucker fein 20kg" className="w-full bg-surface border border-ink-200 rounded-lg px-3 py-2 text-[13px] fp-mono font-bold text-ink-800 focus:outline-none focus:border-brand-400 fp-focus" />
                              <p className="text-[11px] text-ink-400 mt-1">{x.skuHint}</p>
                              {l.alternativeSkus && l.alternativeSkus.length > 0 && (
                                <div className="flex flex-wrap gap-1.5 mt-2">
                                  {l.alternativeSkus.map((alt) => (
                                    <button key={alt} onClick={() => { setESku(alt); setEDesc(alt.split(' – ').slice(1).join(' – ') || eDesc); }}
                                      className={`text-[11px] font-bold rounded px-2 py-1 border transition-colors fp-mono ${eSku === alt ? 'bg-brand-500 text-white border-brand-500' : 'bg-surface text-ink-700 border-ink-200 hover:bg-paper-2'}`}>
                                      {alt.split(' – ')[0]}
                                    </button>
                                  ))}
                                </div>
                              )}
                            </div>
                            <div className="flex justify-end gap-2 pt-1">
                              <button onClick={() => setEditingId(null)} className="px-4 py-2 border border-ink-200 hover:bg-paper-2 text-ink-700 bg-surface rounded-full text-[13px] font-bold transition-colors">{x.cancel}</button>
                              <button onClick={() => saveEdit(l.id)} className="px-4 py-2 bg-brand-500 hover:bg-brand-600 text-white rounded-full text-[13px] font-bold transition-colors fp-focus">{x.save}</button>
                            </div>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                );
              })}
            </div>

            {/* secondary actions */}
            <div className="flex items-center gap-2 mt-6 pt-5 border-t border-ink-200">
              <span className="text-[12px] text-ink-400 mr-auto inline-flex items-center gap-1.5"><FileText size={13} /> {lines.length} {currentLang === 'IT' ? 'righe' : 'Zeilen'}</span>
              <button onClick={exportJson} className="inline-flex items-center gap-1.5 text-[12.5px] font-semibold text-ink-600 hover:text-ink-900 border border-ink-200 rounded-full px-3 py-1.5 transition-colors"><Download size={14} /> {x.exportJson}</button>
              <button onClick={exportCsv} className="inline-flex items-center gap-1.5 text-[12.5px] font-semibold text-ink-600 hover:text-ink-900 border border-ink-200 rounded-full px-3 py-1.5 transition-colors"><Download size={14} /> {x.exportCsv}</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
