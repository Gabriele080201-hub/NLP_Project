import React, { useState } from 'react';
import { Image as ImageIcon, Mic, FileText, ZoomIn, X } from 'lucide-react';
import { Language, OrderSource } from '../types';

interface SourceViewerProps {
  currentLang: Language;
  source: OrderSource | null;
  rawText: string;
}

const L = {
  IT: { source: 'Fonte originale', transcription: 'Trascrizione AI', photo: 'Foto ordine', audio: 'Nota vocale', text: 'Testo incollato', noTranscription: 'Nessuna trascrizione disponibile.', zoom: 'Ingrandisci' },
  DE: { source: 'Originalquelle', transcription: 'KI-Transkription', photo: 'Bestellfoto', audio: 'Sprachnachricht', text: 'Eingefügter Text', noTranscription: 'Keine Transkription verfügbar.', zoom: 'Vergrößern' },
} as const;

export default function SourceViewer({ currentLang, source, rawText }: SourceViewerProps) {
  const x = L[currentLang];
  const [zoomed, setZoomed] = useState(false);

  const kind = source?.kind ?? 'text';
  const icon = kind === 'image' ? <ImageIcon size={14} /> : kind === 'audio' ? <Mic size={14} /> : <FileText size={14} />;
  const label = kind === 'image' ? x.photo : kind === 'audio' ? x.audio : x.text;

  return (
    <div className="space-y-4">
      {/* Source card */}
      <div className="bg-surface border border-ink-200 rounded-2xl shadow-sm overflow-hidden">
        <div className="flex items-center justify-between px-4 py-3 border-b border-ink-150">
          <span className="fp-overline text-ink-600 inline-flex items-center gap-1.5">
            {icon} {x.source}
          </span>
          <span className="text-[11px] font-semibold text-ink-500 inline-flex items-center gap-1.5">
            {label}
          </span>
        </div>

        <div className="p-4">
          {source?.kind === 'image' && source.url && (
            <div className="relative group">
              <img
                src={source.url}
                alt={source.filename || 'order'}
                className="w-full max-h-[440px] object-contain rounded-lg bg-paper-2 cursor-zoom-in"
                onClick={() => setZoomed(true)}
              />
              <button
                onClick={() => setZoomed(true)}
                className="absolute top-2 right-2 inline-flex items-center gap-1 bg-ink-900/70 text-white text-[11px] font-bold px-2.5 py-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <ZoomIn size={13} /> {x.zoom}
              </button>
            </div>
          )}

          {source?.kind === 'audio' && source.url && (
            <div className="py-4 flex flex-col items-center gap-3">
              <div className="w-14 h-14 rounded-full bg-brand-50 text-brand-500 flex items-center justify-center">
                <Mic size={26} />
              </div>
              <audio controls src={source.url} className="w-full" />
            </div>
          )}

          {source?.kind === 'text' && (
            <pre className="whitespace-pre-wrap fp-mono text-[13px] leading-relaxed text-ink-700 bg-paper rounded-lg p-3 border border-ink-150 max-h-[300px] overflow-auto">
              {source.text || rawText}
            </pre>
          )}

          {source?.filename && (
            <p className="fp-mono text-[11px] text-ink-400 mt-3 truncate">{source.filename}</p>
          )}
        </div>
      </div>

      {/* AI transcription (recognized text) — for non-text sources, helps the operator compare */}
      {kind !== 'text' && (
        <div className="bg-surface border border-ink-200 rounded-2xl shadow-sm overflow-hidden">
          <div className="px-4 py-3 border-b border-ink-150">
            <span className="fp-overline text-ink-600">{x.transcription}</span>
          </div>
          <div className="p-4">
            <pre className="whitespace-pre-wrap fp-mono text-[13px] leading-relaxed text-ink-700">
              {rawText?.trim() ? rawText : <span className="text-ink-400 italic">{x.noTranscription}</span>}
            </pre>
          </div>
        </div>
      )}

      {/* Lightbox */}
      {zoomed && source?.kind === 'image' && source.url && (
        <div
          className="fixed inset-0 z-50 bg-ink-900/80 flex items-center justify-center p-6 backdrop-blur-sm"
          onClick={() => setZoomed(false)}
        >
          <button className="absolute top-5 right-5 text-white/80 hover:text-white" onClick={() => setZoomed(false)}>
            <X size={28} />
          </button>
          <img src={source.url} alt={source.filename || 'order'} className="max-w-full max-h-full object-contain rounded-lg shadow-xl" />
        </div>
      )}
    </div>
  );
}
