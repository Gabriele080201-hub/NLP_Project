import React, { useRef, useState } from 'react';
import { Image as ImageIcon, Mic, Type, UploadCloud, X, ArrowRight, User, Tag, Calendar } from 'lucide-react';
import { Language } from '../types';
import { translations } from '../translations';
import { motion } from 'motion/react';

type Method = 'image' | 'audio' | 'text';

interface UploadPageProps {
  currentLang: Language;
  onSubmit: (data: {
    customerCode: string;
    orderReference: string;
    date: string;
    inputType: 'IMAGINE' | 'VOCALE' | 'TESTO';
    filename: string;
    photoFile?: File | null;
    audioFile?: File | null;
    textPaste?: string;
  }) => void;
}

const L = {
  IT: {
    lead: 'Carica un ordine cliente — foto, nota vocale o testo. Lo trascriviamo e lo abbiniamo al catalogo, tu lo validi.',
    tabImage: 'Foto', tabAudio: 'Audio', tabText: 'Testo',
    dropImage: 'Trascina una foto o clicca per sceglierla',
    dropAudio: 'Trascina una nota vocale o clicca per sceglierla',
    formatsImage: 'JPG, PNG, HEIC · foto WhatsApp o note scritte a mano',
    formatsAudio: 'MP3, M4A, OGG, WAV · messaggi vocali',
    textPlaceholder: "Incolla qui il messaggio WhatsApp del cliente…",
    loadSample: 'Usa un messaggio di esempio',
    remove: 'Rimuovi',
    chars: 'caratteri',
    custHelper: 'Deve combaciare col codice dello storico cliente (es. B0491). Si compila da solo dal nome file, se presente.',
    refOptional: 'opzionale',
    submit: 'Estrai ordine',
  },
  DE: {
    lead: 'Lade eine Kundenbestellung hoch — Foto, Sprachnachricht oder Text. Wir transkribieren und matchen sie, du validierst.',
    tabImage: 'Foto', tabAudio: 'Audio', tabText: 'Text',
    dropImage: 'Foto hierher ziehen oder klicken zum Auswählen',
    dropAudio: 'Sprachnachricht hierher ziehen oder klicken',
    formatsImage: 'JPG, PNG, HEIC · WhatsApp-Foto oder handschriftliche Notiz',
    formatsAudio: 'MP3, M4A, OGG, WAV · Sprachnachrichten',
    textPlaceholder: 'WhatsApp-Nachricht des Kunden hier einfügen…',
    loadSample: 'Beispielnachricht verwenden',
    remove: 'Entfernen',
    chars: 'Zeichen',
    custHelper: 'Muss zum Code der Kundenhistorie passen (z. B. B0491). Wird ggf. aus dem Dateinamen übernommen.',
    refOptional: 'optional',
    submit: 'Bestellung extrahieren',
  },
} as const;

const SAMPLE_TEXT = `Hallo, bitte für morgen liefern:
5 schweinskaiserteile ohne deckl
2 naturjoghurt brimi
latte intero 6 litri
pane tipo 00 forse 3 sacchi
Apfelsaft 12x1L
danke`;

const fmtSize = (bytes: number) => (bytes < 1024 * 1024 ? `${Math.round(bytes / 1024)} KB` : `${(bytes / 1024 / 1024).toFixed(1)} MB`);

export default function UploadPage({ currentLang, onSubmit }: UploadPageProps) {
  const t = translations[currentLang];
  const x = L[currentLang];

  const [method, setMethod] = useState<Method>('image');
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [photoUrl, setPhotoUrl] = useState<string | null>(null);
  const [audioFile, setAudioFile] = useState<File | null>(null);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [textVal, setTextVal] = useState('');
  const [dragOver, setDragOver] = useState(false);

  const [customerCode, setCustomerCode] = useState('');
  const [orderReference, setOrderReference] = useState('');
  const todayStr = new Date().toISOString().substring(0, 10);
  const [dateVal, setDateVal] = useState(todayStr);

  const imgInputRef = useRef<HTMLInputElement>(null);
  const audInputRef = useRef<HTMLInputElement>(null);

  const extractCustomerCodeFromFilename = (name: string): string => {
    const match = name.match(/^([A-Za-z]\d{4})/);
    return match ? match[1].toUpperCase() : '';
  };

  const acceptImage = (file: File) => {
    if (photoUrl) URL.revokeObjectURL(photoUrl);
    setPhotoFile(file);
    setPhotoUrl(URL.createObjectURL(file));
    const code = extractCustomerCodeFromFilename(file.name);
    if (code) setCustomerCode(code);
  };
  const acceptAudio = (file: File) => {
    if (audioUrl) URL.revokeObjectURL(audioUrl);
    setAudioFile(file);
    setAudioUrl(URL.createObjectURL(file));
    const code = extractCustomerCodeFromFilename(file.name);
    if (code) setCustomerCode(code);
  };
  const removeImage = () => {
    if (photoUrl) URL.revokeObjectURL(photoUrl);
    setPhotoFile(null);
    setPhotoUrl(null);
    if (imgInputRef.current) imgInputRef.current.value = '';
  };
  const removeAudio = () => {
    if (audioUrl) URL.revokeObjectURL(audioUrl);
    setAudioFile(null);
    setAudioUrl(null);
    if (audInputRef.current) audInputRef.current.value = '';
  };

  const isFormValid = method === 'image' ? !!photoFile : method === 'audio' ? !!audioFile : !!textVal.trim();

  const handleSubmit = () => {
    if (!isFormValid) return;
    if (method === 'image') {
      onSubmit({ customerCode, orderReference, date: dateVal, inputType: 'IMAGINE', filename: photoFile!.name, photoFile });
    } else if (method === 'audio') {
      onSubmit({ customerCode, orderReference, date: dateVal, inputType: 'VOCALE', filename: audioFile!.name, audioFile });
    } else {
      onSubmit({ customerCode, orderReference, date: dateVal, inputType: 'TESTO', filename: 'text_paste.txt', textPaste: textVal });
    }
  };

  const tabs: { id: Method; label: string; icon: React.ReactNode }[] = [
    { id: 'image', label: x.tabImage, icon: <ImageIcon size={16} /> },
    { id: 'audio', label: x.tabAudio, icon: <Mic size={16} /> },
    { id: 'text', label: x.tabText, icon: <Type size={16} /> },
  ];

  const dropZoneCls = `border-2 border-dashed rounded-xl p-10 text-center cursor-pointer transition-colors flex flex-col items-center justify-center gap-4 ${
    dragOver ? 'border-brand-400 bg-brand-50' : 'border-ink-200 hover:border-brand-300 bg-paper'
  }`;

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.18, ease: [0.22, 0.61, 0.36, 1] }}
      className="max-w-[920px] mx-auto px-6 py-10"
    >
      <h1 className="fp-h1 text-[34px] text-ink-900 mb-2">{t.page1Title}</h1>
      <p className="text-ink-600 text-[15px] leading-relaxed mb-8 max-w-[64ch]">{x.lead}</p>

      <div className="bg-surface border border-ink-200 rounded-2xl shadow-sm p-6 sm:p-7">
        {/* Method selector */}
        <div className="inline-flex p-1 rounded-full bg-paper-2 border border-ink-200 mb-6">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setMethod(tab.id)}
              aria-pressed={method === tab.id}
              className={`inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-bold transition-colors fp-focus ${
                method === tab.id ? 'bg-surface text-brand-600 shadow-sm' : 'text-ink-500 hover:text-ink-700'
              }`}
            >
              {tab.icon}
              {tab.label}
            </button>
          ))}
        </div>

        {/* Active zone */}
        {method === 'image' && (
          <div>
            {!photoFile ? (
              <div
                onClick={() => imgInputRef.current?.click()}
                onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
                onDragLeave={() => setDragOver(false)}
                onDrop={(e) => { e.preventDefault(); setDragOver(false); const f = e.dataTransfer.files?.[0]; if (f) acceptImage(f); }}
                className={dropZoneCls}
              >
                <input ref={imgInputRef} type="file" accept="image/*" className="hidden" onChange={(e) => { const f = e.target.files?.[0]; if (f) acceptImage(f); }} />
                <div className="w-14 h-14 rounded-full bg-brand-50 text-brand-500 flex items-center justify-center">
                  <UploadCloud size={26} />
                </div>
                <div>
                  <p className="text-ink-800 font-semibold">{x.dropImage}</p>
                  <p className="text-ink-500 text-[13px] mt-1">{x.formatsImage}</p>
                </div>
              </div>
            ) : (
              <div className="rounded-xl border border-ink-200 bg-paper p-4 flex flex-col items-center gap-4">
                <img src={photoUrl!} alt={photoFile.name} className="max-h-[340px] w-auto rounded-lg shadow-sm object-contain" />
                <div className="flex items-center justify-between w-full">
                  <div className="min-w-0">
                    <p className="fp-mono text-[13px] font-bold text-ink-800 truncate">{photoFile.name}</p>
                    <p className="text-[12px] text-ink-500">{fmtSize(photoFile.size)}</p>
                  </div>
                  <button onClick={removeImage} className="inline-flex items-center gap-1.5 text-[13px] font-bold text-danger bg-danger-soft hover:bg-accent-100 px-3 py-1.5 rounded-full transition-colors">
                    <X size={14} /> {x.remove}
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {method === 'audio' && (
          <div>
            {!audioFile ? (
              <div
                onClick={() => audInputRef.current?.click()}
                onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
                onDragLeave={() => setDragOver(false)}
                onDrop={(e) => { e.preventDefault(); setDragOver(false); const f = e.dataTransfer.files?.[0]; if (f) acceptAudio(f); }}
                className={dropZoneCls}
              >
                <input ref={audInputRef} type="file" accept="audio/*" className="hidden" onChange={(e) => { const f = e.target.files?.[0]; if (f) acceptAudio(f); }} />
                <div className="w-14 h-14 rounded-full bg-brand-50 text-brand-500 flex items-center justify-center">
                  <Mic size={26} />
                </div>
                <div>
                  <p className="text-ink-800 font-semibold">{x.dropAudio}</p>
                  <p className="text-ink-500 text-[13px] mt-1">{x.formatsAudio}</p>
                </div>
              </div>
            ) : (
              <div className="rounded-xl border border-ink-200 bg-paper p-5 flex flex-col items-center gap-4">
                <div className="w-14 h-14 rounded-full bg-brand-50 text-brand-500 flex items-center justify-center">
                  <Mic size={26} />
                </div>
                <audio controls src={audioUrl!} className="w-full max-w-[420px]" />
                <div className="flex items-center justify-between w-full max-w-[420px]">
                  <div className="min-w-0">
                    <p className="fp-mono text-[13px] font-bold text-ink-800 truncate">{audioFile.name}</p>
                    <p className="text-[12px] text-ink-500">{fmtSize(audioFile.size)}</p>
                  </div>
                  <button onClick={removeAudio} className="inline-flex items-center gap-1.5 text-[13px] font-bold text-danger bg-danger-soft hover:bg-accent-100 px-3 py-1.5 rounded-full transition-colors">
                    <X size={14} /> {x.remove}
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {method === 'text' && (
          <div>
            <div className="relative">
              <textarea
                value={textVal}
                onChange={(e) => setTextVal(e.target.value)}
                placeholder={x.textPlaceholder}
                className="w-full min-h-[220px] p-4 border border-ink-200 rounded-xl text-[14px] fp-mono text-ink-800 bg-paper focus:outline-none focus:border-brand-400 fp-focus resize-y leading-relaxed"
              />
              <span className="absolute bottom-3 right-3 bg-surface/90 text-[11px] text-ink-400 font-bold px-2 py-0.5 rounded-full border border-ink-200">
                {textVal.length} {x.chars}
              </span>
            </div>
            <button
              onClick={() => setTextVal(SAMPLE_TEXT)}
              className="mt-3 text-[13px] font-bold text-brand-600 hover:text-brand-700 transition-colors"
            >
              {x.loadSample}
            </button>
          </div>
        )}
      </div>

      {/* Order context */}
      <div className="bg-surface border border-ink-200 rounded-2xl shadow-sm p-6 mt-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          <div className="md:col-span-1">
            <label className="flex items-center gap-1.5 fp-overline text-ink-600 mb-1.5">
              <User size={13} className="text-ink-400" /> {t.customerCode}
            </label>
            <input
              type="text"
              value={customerCode}
              onChange={(e) => setCustomerCode(e.target.value)}
              placeholder="B0491"
              className="w-full bg-paper border border-ink-200 rounded-lg px-3 py-2.5 text-sm font-semibold fp-mono text-ink-800 focus:outline-none focus:border-brand-400 fp-focus"
            />
            <p className="mt-1.5 text-[11px] text-ink-500 leading-snug">{x.custHelper}</p>
          </div>
          <div>
            <label className="flex items-center gap-1.5 fp-overline text-ink-600 mb-1.5">
              <Tag size={13} className="text-ink-400" /> {t.orderReference}
              <span className="text-ink-400 font-medium normal-case tracking-normal lowercase">· {x.refOptional}</span>
            </label>
            <input
              type="text"
              value={orderReference}
              onChange={(e) => setOrderReference(e.target.value)}
              placeholder="REF-403"
              className="w-full bg-paper border border-ink-200 rounded-lg px-3 py-2.5 text-sm font-semibold fp-mono text-ink-800 focus:outline-none focus:border-brand-400 fp-focus"
            />
          </div>
          <div>
            <label className="flex items-center gap-1.5 fp-overline text-ink-600 mb-1.5">
              <Calendar size={13} className="text-ink-400" /> {t.date}
            </label>
            <input
              type="date"
              value={dateVal}
              onChange={(e) => setDateVal(e.target.value)}
              className="w-full bg-paper border border-ink-200 rounded-lg px-3 py-2.5 text-sm font-semibold text-ink-800 focus:outline-none focus:border-brand-400 fp-focus"
            />
          </div>
        </div>
      </div>

      <div className="flex justify-end mt-6">
        <button
          onClick={handleSubmit}
          disabled={!isFormValid}
          className={`inline-flex items-center gap-2 px-7 py-3.5 rounded-full text-sm font-bold transition-colors fp-focus ${
            isFormValid ? 'bg-brand-500 hover:bg-brand-600 text-white shadow-sm' : 'bg-ink-100 text-ink-400 cursor-not-allowed'
          }`}
        >
          {x.submit}
          <ArrowRight size={16} />
        </button>
      </div>
    </motion.div>
  );
}
