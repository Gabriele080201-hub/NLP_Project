import React, { useRef, useState } from 'react';
import { FileText, Music, Sparkles, Calendar, Tag, User, UploadCloud } from 'lucide-react';
import { Language } from '../types';
import { translations } from '../translations';
import { motion } from 'motion/react';

interface UploadPageProps {
  currentLang: Language;
  onSubmit: (data: {
    customerCode: string;
    orderReference: string;
    date: string;
    inputType: 'IMAGINE' | 'VOCALE' | 'TESTO';
    filename: string;
  }) => void;
}

export default function UploadPage({ currentLang, onSubmit }: UploadPageProps) {
  const t = translations[currentLang];

  // Forms statuses
  const [imageFile, setImageFile] = useState<{ name: string; sizeStr: string } | null>(null);
  const [audioFile, setAudioFile] = useState<{ name: string; sizeStr: string } | null>(null);
  const [textVal, setTextVal] = useState('');

  // Customer Info state
  const [customerCode, setCustomerCode] = useState('');
  const [orderReference, setOrderReference] = useState('');
  
  // Today date formatted as YYYY-MM-DD
  const todayStr = new Date().toISOString().substring(0, 10);
  const [dateVal, setDateVal] = useState(todayStr);

  const fileInputRefImg = useRef<HTMLInputElement>(null);
  const fileInputRefAud = useRef<HTMLInputElement>(null);

  // Handle Image simulation select
  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0];
      setImageFile({
        name: file.name,
        sizeStr: `${Math.round(file.size / 1024)} KB`
      });
      // Auto-fill customer code and reference for helpfulness, matching the mock data
      setCustomerCode('1204');
      setOrderReference('FORN-2026-031');
    }
  };

  const triggerImageSimulate = () => {
    setImageFile({
      name: 'B0491_0001.jpg',
      sizeStr: '7 KB'
    });
    setCustomerCode('1204');
    setOrderReference('FORN-2026-031');
  };

  const handleAudioSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0];
      setAudioFile({
        name: file.name,
        sizeStr: `${Math.round(file.size / 1024)} KB`
      });
      setCustomerCode('1204');
      setOrderReference('FORN-2026-031');
    }
  };

  const triggerAudioSimulate = () => {
    setAudioFile({
      name: 'voice_message_031.mp3',
      sizeStr: '220 KB'
    });
    setCustomerCode('1204');
    setOrderReference('FORN-2026-031');
  };

  const handleRemoveImage = () => {
    setImageFile(null);
    if (fileInputRefImg.current) fileInputRefImg.current.value = '';
    if (!audioFile && !textVal) {
      setCustomerCode('');
      setOrderReference('');
    }
  };

  const handleRemoveAudio = () => {
    setAudioFile(null);
    if (fileInputRefAud.current) fileInputRefAud.current.value = '';
    if (!imageFile && !textVal) {
      setCustomerCode('');
      setOrderReference('');
    }
  };

  const handleTextChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const val = e.target.value;
    setTextVal(val);
    if (val.trim() && !customerCode) {
      setCustomerCode('1204');
      setOrderReference('FORN-2026-031');
    } else if (!val.trim() && !imageFile && !audioFile) {
      setCustomerCode('');
      setOrderReference('');
    }
  };

  const isFormValid = imageFile || audioFile || textVal.trim();

  const handleFormSubmit = () => {
    if (!isFormValid) return;

    // Detect Input Type priorities (Image -> Audio -> Text)
    let finalInputType: 'IMAGINE' | 'VOCALE' | 'TESTO' = 'TESTO';
    let finalName = 'text_paste.txt';

    if (imageFile) {
      finalInputType = 'IMAGINE';
      finalName = imageFile.name;
    } else if (audioFile) {
      finalInputType = 'VOCALE';
      finalName = audioFile.name;
    }

    onSubmit({
      customerCode: customerCode || '1204',
      orderReference: orderReference || 'FORN-2026-031',
      date: dateVal,
      inputType: finalInputType,
      filename: finalName
    });
  };

  return (
    <motion.div
      id="upload-page-root"
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.15, ease: 'easeOut' }}
      className="max-w-[1400px] mx-auto px-6 py-8"
    >
      {/* Page Title */}
      <h2 className="text-[28px] font-bold text-[#1C2B3A] mb-8 leading-tight">
        {t.page1Title}
      </h2>

      {/* Grid of Three Input Zones */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        
        {/* Zone 1: Image Upload */}
        <div id="zone-image-upload" className="bg-white border border-[#E0E0E0] rounded-[8px] p-6 shadow-sm flex flex-col justify-between min-h-[420px]">
          <div>
            <div className="flex items-center justify-between mb-4">
              <span className="text-[11px] font-bold text-[#1565C0] tracking-widest uppercase">
                {t.zone1Label}
              </span>
              <span className="bg-[#FFC107] text-slate-900 text-[10px] font-bold px-2 py-0.5 rounded tracking-wide">
                {t.zone1Badge}
              </span>
            </div>
            <h4 className="text-[15px] font-bold text-[#1C2B3A] mb-1 leading-snug">
              {t.zone1Helper}
            </h4>
          </div>

          {!imageFile ? (
            <div
              onClick={() => fileInputRefImg.current?.click()}
              onDragOver={(e) => {
                e.preventDefault();
                e.stopPropagation();
              }}
              onDrop={(e) => {
                e.preventDefault();
                if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
                  const file = e.dataTransfer.files[0];
                  setImageFile({ name: file.name, sizeStr: `${Math.round(file.size / 1024)} KB` });
                  setCustomerCode('1204');
                  setOrderReference('FORN-2026-031');
                }
              }}
              className="border-2 border-dashed border-[#B0BEC5] hover:border-[#1565C0] rounded-[6px] p-6 text-center cursor-pointer transition-all duration-150 py-12 flex flex-col items-center justify-center space-y-4 my-4"
            >
              <input
                type="file"
                ref={fileInputRefImg}
                accept="image/*"
                onChange={handleLanguageChange => handleImageSelect(fileInputChangeEvent => handleImageSelect(fileInputChangeEvent))}
                className="hidden"
              />
              <div className="text-[#9E9E9E] p-3 bg-[#F8F9FA] rounded-full">
                <UploadCloud size={32} />
              </div>
              <div>
                <p className="text-[#1C2B3A] font-semibold text-sm">
                  {t.dropAreaText}
                </p>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    triggerImageSimulate();
                  }}
                  className="mt-3 text-xs text-[#1565C0] font-bold hover:underline bg-[#1565C0]/5 px-3 py-1.5 rounded"
                >
                  {currentLang === 'IT' ? 'Carica file d\'esempio B0491_0001.jpg' : 'Musterdatei B0491_0001.jpg laden'}
                </button>
              </div>
            </div>
          ) : (
            <div className="border border-[#E0E0E0] rounded-[6px] p-4 bg-[#F8F9FA] my-4 flex flex-col items-center justify-center space-y-4">
              {/* Image paper thumbnail matching the design layout */}
              <div className="bg-[#CCCCCC] rounded p-4 max-w-[200px] w-full shadow-inner border border-stone-300 text-center font-mono text-[11px] leading-tight text-[#1C2B3A] select-none rotate-[-1deg]">
                <p className="font-bold border-b border-stone-400 pb-1 mb-1.5 text-stone-700 uppercase tracking-widest text-[9px]">
                  FOPPA INT.
                </p>
                <div className="text-left space-y-1">
                  <p>Hallo bestellung:</p>
                  <p className="font-bold">Schinken</p>
                  <p className="font-bold">Salami</p>
                  <p>Vanile, marmelade, leere briosch,</p>
                  <p className="font-bold">Streichwurst</p>
                </div>
              </div>
              <div className="text-center w-full">
                <p className="font-mono text-xs font-bold text-[#1C2B3A] truncate max-w-[230px] mx-auto">
                  {imageFile.name}
                </p>
                <p className="text-[11px] text-[#9E9E9E] font-medium mt-0.5">
                  {imageFile.sizeStr}
                </p>
                <button
                  onClick={handleRemoveImage}
                  className="mt-3 text-xs font-bold text-[#C62828] bg-red-50 hover:bg-red-100 px-3 py-1.5 rounded transition-all duration-150"
                >
                  {currentLang === 'IT' ? 'Rimuovi' : 'Entfernen'}
                </button>
              </div>
            </div>
          )}

          <p className="text-[11px] text-[#9E9E9E] font-medium italic mt-2">
            {t.zone1Subnote}
          </p>
        </div>

        {/* Zone 2: Audio Upload */}
        <div id="zone-audio-upload" className="bg-white border border-[#E0E0E0] rounded-[8px] p-6 shadow-sm flex flex-col justify-between min-h-[420px]">
          <div>
            <div className="flex items-center justify-between mb-4">
              <span className="text-[11px] font-bold text-[#1565C0] tracking-widest uppercase">
                {t.zone2Label}
              </span>
            </div>
            <h4 className="text-[15px] font-bold text-[#1C2B3A] mb-1 leading-snug">
              {t.zone2Helper}
            </h4>
          </div>

          {!audioFile ? (
            <div
              onClick={() => fileInputRefAud.current?.click()}
              onDragOver={(e) => {
                e.preventDefault();
                e.stopPropagation();
              }}
              onDrop={(e) => {
                e.preventDefault();
                if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
                  const file = e.dataTransfer.files[0];
                  setAudioFile({ name: file.name, sizeStr: `${Math.round(file.size / 1024)} KB` });
                  setCustomerCode('1204');
                  setOrderReference('FORN-2026-031');
                }
              }}
              className="border-2 border-dashed border-[#B0BEC5] hover:border-[#1565C0] rounded-[6px] p-6 text-center cursor-pointer transition-all duration-150 py-12 flex flex-col items-center justify-center space-y-4 my-4"
            >
              <input
                type="file"
                ref={fileInputRefAud}
                accept="audio/*"
                onChange={handleAudioSelect}
                className="hidden"
              />
              <div className="text-[#9E9E9E] p-3 bg-[#F8F9FA] rounded-full">
                <Music size={32} />
              </div>
              <div>
                <p className="text-[#1C2B3A] font-semibold text-sm">
                  {t.dropAreaText}
                </p>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    triggerAudioSimulate();
                  }}
                  className="mt-3 text-xs text-[#1565C0] font-bold hover:underline bg-[#1565C0]/5 px-3 py-1.5 rounded"
                >
                  {currentLang === 'IT' ? 'Carica nota vocale d\'esempio' : 'Muster-Sprachnachricht laden'}
                </button>
              </div>
            </div>
          ) : (
            <div className="border border-[#E0E0E0] rounded-[6px] p-4 bg-[#F8F9FA] my-4 flex flex-col items-center justify-center space-y-4">
              {/* Speaker icon representing audio */}
              <div className="text-[#1565C0] p-4 bg-[#1565C0]/10 rounded-full animate-pulse">
                <Music size={36} />
              </div>
              {/* Live styled HTML5 audio controller */}
              <audio controls className="w-full h-8 mt-1">
                <source src="mock" />
              </audio>
              <div className="text-center w-full">
                <p className="font-mono text-xs font-bold text-[#1C2B3A] truncate max-w-[230px] mx-auto">
                  {audioFile.name}
                </p>
                <p className="text-[11px] text-[#9E9E9E] font-medium mt-0.5">
                  {audioFile.sizeStr}
                </p>
                <button
                  onClick={handleRemoveAudio}
                  className="mt-3 text-xs font-bold text-[#C62828] bg-red-50 hover:bg-red-100 px-3 py-1.5 rounded transition-all duration-150"
                >
                  {currentLang === 'IT' ? 'Rimuovi' : 'Entfernen'}
                </button>
              </div>
            </div>
          )}

          {/* Dialect message box with grey background and no emoji */}
          <div className="bg-[#F8F9FA] border border-[#E0E0E0] p-3 rounded-[6px] text-[11px] text-[#1C2B3A] font-medium leading-relaxed mt-2">
            {t.zone2AudioInfo}
          </div>
        </div>

        {/* Zone 3: Text Paste */}
        <div id="zone-text-paste" className="bg-white border border-[#E0E0E0] rounded-[8px] p-6 shadow-sm flex flex-col justify-between min-h-[420px]">
          <div>
            <div className="flex items-center justify-between mb-4">
              <span className="text-[11px] font-bold text-[#1565C0] tracking-widest uppercase">
                {t.zone3Label}
              </span>
            </div>
            <h4 className="text-[15px] font-bold text-[#1C2B3A] mb-1 leading-snug">
              {t.zone3Description}
            </h4>
          </div>

          <div className="relative flex-grow my-4 flex flex-col">
            <textarea
              id="textarea-whatsapp-text"
              value={textVal}
              onChange={handleTextChange}
              placeholder={t.zone3Placeholder}
              className="w-full flex-grow min-h-[180px] p-3 border border-[#E0E0E0] rounded-[6px] text-xs font-mono text-[#1C2B3A] focus:outline-none focus:border-[#1565C0] resize-y bg-[#F8F9FA] leading-relaxed"
            />
            {/* Live character counter */}
            <span className="absolute bottom-2.5 right-2.5 bg-white/90 text-[10px] text-[#9E9E9E] font-bold px-1.5 py-0.5 rounded shadow-sm border border-[#E0E0E0] font-mono select-none">
              {textVal.length} {currentLang === 'IT' ? 'caratteri' : 'Zeichen'}
            </span>
          </div>

          <p className="text-[11px] text-[#9E9E9E] font-medium italic mt-2">
            &nbsp;
          </p>
        </div>

      </div>

      {/* Customer Info Row (Grey Card) */}
      <div id="customer-info-row" className="bg-[#F8F9FA] border border-[#E0E0E0] rounded-[8px] p-4 mb-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Customer Code */}
          <div>
            <label className="flex items-center space-x-2 text-[11px] font-bold text-[#1C2B3A] tracking-wider uppercase mb-1.5">
              <User size={13} className="text-[#9E9E9E]" />
              <span>{t.customerCode}</span>
            </label>
            <input
              id="input-customer-code"
              type="text"
              value={customerCode}
              onChange={(e) => setCustomerCode(e.target.value)}
              placeholder="e.g. 1204"
              className="w-full bg-white border border-[#E0E0E0] rounded-[6px] px-3 py-2 text-xs font-medium focus:outline-none focus:border-[#1565C0] text-[#1C2B3A]"
            />
          </div>

          {/* Order Reference */}
          <div>
            <label className="flex items-center space-x-2 text-[11px] font-bold text-[#1C2B3A] tracking-wider uppercase mb-1.5">
              <Tag size={13} className="text-[#9E9E9E]" />
              <span>{t.orderReference}</span>
            </label>
            <input
              id="input-order-ref"
              type="text"
              value={orderReference}
              onChange={(e) => setOrderReference(e.target.value)}
              placeholder="e.g. REF-403"
              className="w-full bg-white border border-[#E0E0E0] rounded-[6px] px-3 py-2 text-xs font-medium focus:outline-none focus:border-[#1565C0] text-[#1C2B3A]"
            />
          </div>

          {/* Date Picker (Auto-populated to today but editable) */}
          <div>
            <label className="flex items-center space-x-2 text-[11px] font-bold text-[#1C2B3A] tracking-wider uppercase mb-1.5">
              <Calendar size={13} className="text-[#9E9E9E]" />
              <span>{t.date}</span>
            </label>
            <input
              id="input-date"
              type="date"
              value={dateVal}
              onChange={(e) => setDateVal(e.target.value)}
              className="w-full bg-white border border-[#E0E0E0] rounded-[6px] px-3 py-2 text-xs font-medium focus:outline-none focus:border-[#1565C0] text-[#1C2B3A]"
            />
          </div>
        </div>
      </div>

      {/* Submit Button (Right Aligned) */}
      <div className="flex justify-end">
        <button
          id="btn-submit-extraction"
          onClick={handleFormSubmit}
          disabled={!isFormValid}
          className={`px-6 py-3 text-xs font-bold uppercase rounded-[4px] tracking-wider shadow-sm transition-all duration-150 ${
            isFormValid
              ? 'bg-[#1565C0] text-white hover:bg-[#0D47A1] cursor-pointer'
              : 'bg-[#E0E0E0] text-[#9E9E9E] cursor-not-allowed'
          }`}
        >
          {t.submitButton}
        </button>
      </div>
    </motion.div>
  );
}
