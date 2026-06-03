import React, { useState, useEffect, useRef } from 'react';
import { 
  Check, 
  X, 
  Edit, 
  Trash2, 
  AlertTriangle, 
  ChevronDown, 
  ChevronUp, 
  Upload, 
  Mic, 
  FileText, 
  Calendar, 
  Download, 
  RotateCcw, 
  Plus, 
  CheckCircle2,
  AlertCircle,
  Play,
  Pause,
  ArrowRight
} from 'lucide-react';
import { Language, OrderLine, OrderMetadata } from './types';
import { TRANSLATIONS } from './translations';
import { 
  getInitialMockOrder, 
  MOCK_ORDER_LINES, 
  MOCK_LOGISTICS_NOTES, 
  MOCK_GENERAL_COMMENT, 
  MOCK_AI_SUGGESTIONS 
} from './mockData';

export default function App() {
  // Global App States
  const [lang, setLang] = useState<Language>('ITA');
  const [currentPage, setCurrentPage] = useState<number>(1); // 1: Upload, 2: Review, 3: Success
  
  // Page 1: Upload input states
  const [uploadedPhoto, setUploadedPhoto] = useState<{ name: string; size: string; preview: string } | null>(null);
  const [uploadedAudio, setUploadedAudio] = useState<{ name: string; duration: string } | null>(null);
  const [textPaste, setTextPaste] = useState<string>('');
  const [realPhotoFile, setRealPhotoFile] = useState<File | null>(null);
  const [realAudioFile, setRealAudioFile] = useState<File | null>(null);
  
  // Customer Info Row (Optional)
  const [customerCode, setCustomerCode] = useState<string>('');
  const [orderReference, setOrderReference] = useState<string>('');
  const [orderDate, setOrderDate] = useState<string>(() => {
    const today = new Date();
    return today.toISOString().split('T')[0]; // YYYY-MM-DD
  });
  
  // Loading Overlay State
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [loadingStep, setLoadingStep] = useState<number>(0);
  
  // Page 2: Table & Review States
  const [orderLines, setOrderLines] = useState<OrderLine[]>([]);
  const [logisticsNotes, setLogisticsNotes] = useState(MOCK_LOGISTICS_NOTES);
  const [generalComment, setGeneralComment] = useState(MOCK_GENERAL_COMMENT);
  const [expandedAlternativesRow, setExpandedAlternativesRow] = useState<number | null>(null);
  const [editingRowId, setEditingRowId] = useState<number | null>(null);
  
  // Audio playback state on Page 1 (Simulated widget)
  const [isAudioPlaying, setIsAudioPlaying] = useState<boolean>(false);
  
  // Collapsible panels states on Page 2
  const [isNotesExpanded, setIsNotesExpanded] = useState<boolean>(true);
  const [isPreviewExpanded, setIsPreviewExpanded] = useState<boolean>(true);

  // Form edit states (for inline modify panel)
  const [editFormDesc, setEditFormDesc] = useState<string>('');
  const [editFormSku, setEditFormSku] = useState<string>('');
  const [editFormQty, setEditFormQty] = useState<string>('');
  const [editFormUnit, setEditFormUnit] = useState<string>('');
  const [editFormLang, setEditFormLang] = useState<'ITA' | 'DE' | 'Misto'>('ITA');

  // Input File Refs
  const photoInputRef = useRef<HTMLInputElement>(null);
  const audioInputRef = useRef<HTMLInputElement>(null);

  // Helper macro for translation keys
  const t = (key: keyof typeof TRANSLATIONS) => {
    return TRANSLATIONS[key]?.[lang] || key;
  };

  // Safe JSON representation state
  const [outputJson, setOutputJson] = useState<string>('');

  // Auto update JSON preview when anything changes in Page 2
  useEffect(() => {
    if (currentPage === 2) {
      const activeLines = orderLines.map(line => ({
        original_text: line.originalText,
        possible_product_description: line.productDescription[lang],
        matched_sku: line.matchedSku,
        matched_sku_label: line.matchedSkuLabel ? line.matchedSkuLabel[lang] : null,
        quantity: line.quantity,
        unit: line.unit === '—' ? '' : line.unit,
        language_detected: line.languageDetected,
        uncertain: line.uncertain,
        uncertainty_reason: line.uncertaintyReason ? line.uncertaintyReason[lang] : '',
        notes: line.notes ? line.notes[lang] : '',
        status: line.status
      }));
      
      const payload = {
        customer_code: customerCode || "C-2026",
        order_reference: orderReference || "N/D",
        date: orderDate,
        order_lines: activeLines,
        logistics_notes: logisticsNotes.map(n => ({
          original_text: n.text,
          interpreted: n.interpretation[lang],
          uncertain: n.uncertain
        })),
        general_comment: generalComment[lang]
      };
      
      setOutputJson(JSON.stringify(payload, null, 2));
    }
  }, [orderLines, customerCode, orderReference, orderDate, logisticsNotes, generalComment, lang, currentPage]);

  // Page 1 Drag and drop handlers
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handlePhotoDrop = (e: React.DragEvent) => {
    e.preventDefault();
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const file = e.dataTransfer.files[0];
      setUploadedPhoto({
        name: file.name,
        size: (file.size / 1024).toFixed(1) + " KB",
        preview: URL.createObjectURL(file)
      });
      setRealPhotoFile(file);
      detectMetadataFromFilename(file.name);
    }
  };

  const handleAudioDrop = (e: React.DragEvent) => {
    e.preventDefault();
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const file = e.dataTransfer.files[0];
      setUploadedAudio({
        name: file.name,
        duration: "0:42"
      });
      setRealAudioFile(file);
    }
  };

  const selectPhotoFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setUploadedPhoto({
        name: file.name,
        size: (file.size / 1024).toFixed(1) + " KB",
        preview: URL.createObjectURL(file)
      });
      setRealPhotoFile(file);
      detectMetadataFromFilename(file.name);
    }
  };

  const selectAudioFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setUploadedAudio({
        name: file.name,
        duration: "0:42"
      });
      setRealAudioFile(file);
    }
  };

  const removePhoto = (e: React.MouseEvent) => {
    e.stopPropagation();
    setUploadedPhoto(null);
  };

  const removeAudio = (e: React.MouseEvent) => {
    e.stopPropagation();
    setUploadedAudio(null);
  };

  const detectMetadataFromFilename = (name: string) => {
    // Check if filename has pattern of C-XXX etc
    const matchCustomer = name.match(/C-?\d+/i);
    const matchOrd = name.match(/ORD-?\d+/i);
    if (matchCustomer) {
      setCustomerCode(matchCustomer[0].toUpperCase());
    } else {
      setCustomerCode("C-2026");
    }
    if (matchOrd) {
      setOrderReference(matchOrd[0].toUpperCase());
    } else {
      setOrderReference("N/D");
    }
  };

  // Submit flow: call real backend API, fall back to mock if unavailable
  const handleStartExtraction = async () => {
    setIsLoading(true);
    setLoadingStep(1);

    // Advance loading steps visually while API runs
    const step2 = setTimeout(() => setLoadingStep(2), 1500);
    const step3 = setTimeout(() => setLoadingStep(3), 3000);
    const step4 = setTimeout(() => setLoadingStep(4), 4500);

    try {
      const formData = new FormData();
      formData.append('customer_code', customerCode || 'CUST-DEMO');
      if (realPhotoFile) formData.append('file', realPhotoFile);
      else if (realAudioFile) formData.append('file', realAudioFile);
      else if (textPaste.trim()) formData.append('text', textPaste.trim());

      const response = await fetch('http://127.0.0.1:8000/api/extract', {
        method: 'POST',
        body: formData,
      });

      clearTimeout(step2); clearTimeout(step3); clearTimeout(step4);

      if (response.ok) {
        const data = await response.json();
        const matched = data.matched;
        if (Array.isArray(matched) && matched.length > 0) {
          const lines: OrderLine[] = matched.map((item: any, index: number) => ({
            id: index + 1,
            originalText: item.original_text ?? `Item ${index + 1}`,
            description: item.description_it ?? item.product_name ?? '',
            sku: item.sku ?? '',
            qty: item.qty != null ? String(item.qty) : '–',
            unit: item.unit ?? 'pz',
            confidence: item.confidence ?? 0.9,
            status: (item.confidence ?? 0.9) >= 0.85 ? 'confirmed' as const : 'pending' as const,
            matchedSku: item.sku ?? '',
            alternatives: item.alternatives ?? [],
          }));
          setOrderLines(lines);
        } else {
          setOrderLines(JSON.parse(JSON.stringify(MOCK_ORDER_LINES)));
        }
      } else {
        setOrderLines(JSON.parse(JSON.stringify(MOCK_ORDER_LINES)));
      }
    } catch {
      clearTimeout(step2); clearTimeout(step3); clearTimeout(step4);
      console.warn('Backend non raggiungibile, uso dati mock');
      setOrderLines(JSON.parse(JSON.stringify(MOCK_ORDER_LINES)));
    }

    setIsLoading(false);
    setCurrentPage(2);
    window.scrollTo({ top: 0, behavior: 'instant' });
  };

  // Silent fire-and-forget feedback post trigger
  const triggerFeedbackPost = (row: OrderLine, action: string, modifiedSku?: string) => {
    const payload = {
      original_text: row.originalText,
      suggested_sku: row.matchedSku,
      selected_sku: modifiedSku || row.matchedSku,
      customer_code: customerCode || "C-2026",
      action: action // "confirmed" | "modified" | "rejected" | "sku_changed"
    };
    
    // Log in console
    console.log("FEEDBACK CAPTURE (Silent Fire-and-Forget):", payload);

    // Real fire & forget endpoint mockup
    fetch('/api/feedback', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    }).catch(() => {
      // Fail silently to never interrupt user
    });
  };

  // Row Interactions
  const handleConfirmRow = (id: number) => {
    setOrderLines(prev => prev.map(line => {
      if (line.id === id) {
        const updated = { ...line, status: 'confirmed' as const };
        triggerFeedbackPost(updated, 'confirmed');
        return updated;
      }
      return line;
    }));
  };

  const handleRejectRow = (id: number) => {
    setOrderLines(prev => prev.map(line => {
      if (line.id === id) {
        const updated = { ...line, status: 'rejected' as const };
        triggerFeedbackPost(updated, 'rejected');
        return updated;
      }
      return line;
    }));
  };

  const handleSelectAlternativeSku = (rowId: number, alternativeSku: string, alternativeLabel: { ITA: string; DE: string }) => {
    setOrderLines(prev => prev.map(line => {
      if (line.id === rowId) {
        const updated: OrderLine = {
          ...line,
          matchedSku: alternativeSku,
          matchedSkuLabel: alternativeLabel,
          // Re-evaluate if this resolves the uncertainty
          status: 'confirmed' as const
        };
        triggerFeedbackPost(updated, 'sku_changed', alternativeSku);
        return updated;
      }
      return line;
    }));
    setExpandedAlternativesRow(null);
  };

  // Inline edit panel interactions
  const handleOpenEditPanel = (line: OrderLine) => {
    setEditingRowId(line.id);
    setEditFormDesc(line.productDescription[lang]);
    setEditFormSku(line.matchedSku || '');
    setEditFormQty(line.quantity !== null ? String(line.quantity) : '');
    setEditFormUnit(line.unit === '—' ? '' : line.unit);
    setEditFormLang(line.languageDetected);
  };

  const handleSaveInlineEdit = () => {
    if (editingRowId === null) return;
    
    setOrderLines(prev => prev.map(line => {
      if (line.id === editingRowId) {
        const updatedDescription = { ...line.productDescription, [lang]: editFormDesc };
        const parsedQty = editFormQty.trim() === '' ? null : Number(editFormQty);
        
        let labelObj = line.matchedSkuLabel;
        if (editFormSku !== line.matchedSku) {
          // Changed SKU, find original label or make standard
          labelObj = {
            ITA: editFormSku ? `${editFormSku} – ${editFormDesc}` : '',
            DE: editFormSku ? `${editFormSku} – ${editFormDesc}` : ''
          };
        }

        const updated: OrderLine = {
          ...line,
          productDescription: updatedDescription,
          matchedSku: editFormSku || null,
          matchedSkuLabel: labelObj,
          quantity: parsedQty,
          unit: editFormUnit.trim() === '' ? '—' : editFormUnit,
          languageDetected: editFormLang,
          uncertain: false, // Edited means manually resolved
          status: 'confirmed' as const // Turn resolved/confirmed on edit save
        };

        triggerFeedbackPost(updated, 'modified', editFormSku);
        return updated;
      }
      return line;
    }));

    setEditingRowId(null);
  };

  // Bulk actions
  const handleConfirmAll = () => {
    setOrderLines(prev => prev.map(line => {
      if (line.status !== 'confirmed' && line.status !== 'rejected') {
        const updated = { ...line, status: 'confirmed' as const };
        triggerFeedbackPost(updated, 'confirmed');
        return updated;
      }
      return line;
    }));
  };

  const handleResetAll = () => {
    setOrderLines(JSON.parse(JSON.stringify(MOCK_ORDER_LINES)));
  };

  const handleAddRow = () => {
    const nextId = orderLines.length > 0 ? Math.max(...orderLines.map(l => l.id)) + 1 : 1;
    const newRow: OrderLine = {
      id: nextId,
      originalText: "Nuova riga d'ordine inserita manualmente",
      productDescription: {
        ITA: "Nuovo prodotto",
        DE: "Neues Produkt"
      },
      matchedSku: "",
      matchedSkuLabel: null,
      quantity: 1,
      unit: "—",
      languageDetected: lang === 'ITA' ? 'ITA' : 'DE',
      confidenceScore: 1.0,
      confidenceLabel: {
        ITA: "Alta affidabilità",
        DE: "Hohe Zuverlässigkeit"
      },
      status: "confirmed" as const,
      uncertain: false,
      alternatives: []
    };
    setOrderLines(prev => [...prev, newRow]);
  };

  // Statistics calculation
  const totalRowsCount = orderLines.length;
  const confirmedRowsCount = orderLines.filter(line => line.status === 'confirmed').length;
  const modifiedRowsCount = orderLines.filter(line => line.status === 'confirmed' && line.uncertain === false && line.id === editingRowId).length; // simple toggle
  const rejectedRowsCount = orderLines.filter(line => line.status === 'rejected').length;
  
  // "Da risolvere" counts how many rows have a validation-required status or have not been touched and have score < 0.75
  const daRisolvereCount = orderLines.filter(line => 
    line.status !== 'confirmed' && 
    line.status !== 'rejected' && 
    line.confidenceScore < 0.75
  ).length;

  const exportDisabled = daRisolvereCount > 0;

  // File exporter helpers
  const handleExportJSON = () => {
    if (exportDisabled) return;
    const blob = new Blob([outputJson], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `FOPPA-Intake-Order-${customerCode || 'C2026'}.json`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const handleExportCSV = () => {
    if (exportDisabled) return;
    let csvContent = "data:text/csv;charset=utf-8,";
    csvContent += "#;OriginalText;ProductDescription;SKU;Qty;Unit;Language;Status\r\n";
    
    orderLines.forEach(line => {
      csvContent += `${line.id};"${line.originalText}";"${line.productDescription[lang]}";"${line.matchedSku || ''}";${line.quantity || ''};"${line.unit}";"${line.languageDetected}";"${line.status}"\r\n`;
    });
    
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `FOPPA-Intake-Order-${customerCode || 'C2026'}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleFinalConfirmOrder = () => {
    if (exportDisabled) return;
    setCurrentPage(3);
    window.scrollTo({ top: 0, behavior: 'instant' });
  };

  return (
    <div className="min-h-screen bg-[#F8F9FA] text-[#1C2B3A] font-sans antialiased pb-24" id="app-root">
      
      {/* HEADER / NAVBAR (Identical on all pages) */}
      <nav className="w-full bg-white border-b border-gray-200 py-3 px-6 shadow-sm sticky top-0 z-50 flex justify-between items-center" id="navbar">
        {/* Left Side: Logo & Subtitles */}
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 select-none" id="foppa-logo">
            <div className="flex flex-col items-center">
              {/* Stylized Egg Cup Design matching Foppa brand */}
              <div className="relative w-8 h-8 flex items-center justify-center -mb-0.5">
                <svg className="w-7 h-7 text-[#1565C0]" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 2C9.5 2 7.5 4.5 7.5 7.5c0 2.5 1.7 4 4.5 4s4.5-1.5 4.5-4C16.5 4.5 14.5 2 12 2Z" />
                  <path d="M9.5 13.5a1.5 1.5 0 0 1 1-1.4V14H8a2 2 0 0 0-2 2v1h12v-1a2 2 0 0 0-2-2h-2.5v-1.9a1.5 1.5 0 0 1 1 1.4c0 .8-.5 1.5-1.2 1.5H9c-.7 0-1.2-1.2-1.2-1.5Z" />
                </svg>
              </div>
              <span className="text-[#1565C0] font-sans font-black text-2xl tracking-tighter leading-none" style={{ fontFamily: '"Georgia", serif', fontStyle: 'italic' }}>
                foppa
              </span>
              <span className="text-[#C62828] text-[7px] font-sans font-bold tracking-[0.25em] leading-normal uppercase">
                Taste Supporter
              </span>
            </div>
          </div>

          <div className="h-10 w-px bg-gray-300" />

          <div className="flex flex-col">
            <h1 className="text-base font-bold text-[#1C2B3A] tracking-tight leading-none uppercase">
              {t('appTitle')}
            </h1>
            <span className="text-xs text-gray-500 font-medium mt-1">
              {t('appSubtitle')}
            </span>
          </div>
        </div>

        {/* Right Side: Language switcher pill */}
        <div className="flex items-center gap-4">
          <div className="border border-gray-300 rounded-lg p-0.5 flex bg-gray-100 shadow-inner" id="language-switcher">
            <button 
              onClick={() => setLang('DE')}
              className={`px-3 py-1 text-xs font-bold rounded-md transition-all duration-150 ${lang === 'DE' ? 'bg-[#1C2B3A] text-white shadow-sm' : 'text-gray-500 hover:text-[#1C2B3A]'}`}
            >
              DE
            </button>
            <button 
              onClick={() => setLang('ITA')}
              className={`px-3 py-1 text-xs font-bold rounded-md transition-all duration-150 ${lang === 'ITA' ? 'bg-[#1C2B3A] text-white shadow-sm' : 'text-gray-500 hover:text-[#1C2B3A]'}`}
            >
              ITA
            </button>
          </div>
        </div>
      </nav>

      {/* RENDER PAGES */}
      <main className="max-w-7xl mx-auto px-6 mt-10">

        {/* ==================== PAGE 1: UPLOAD & INPUT ==================== */}
        {currentPage === 1 && (
          <div className="space-y-8 animate-fade-in" id="page-1-container">
            
            {/* Title section */}
            <div className="border-b border-gray-200 pb-5">
              <h2 className="text-2xl font-bold tracking-tight text-[#1C2B3A]">
                {t('page1Title')}
              </h2>
              <p className="text-sm text-gray-500 mt-1">
                {t('page1Subtitle')}
              </p>
            </div>

            {/* Side-by-side cards (stacked on mobile) */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">

              {/* ZONE 1 CARD: Photo files */}
              <div className="bg-white border border-[#E0E0E0] rounded-xl p-5 shadow-sm hover:shadow-md transition-all duration-200 flex flex-col justify-between" id="zone-1-card">
                <div>
                  <div className="flex items-center gap-2 mb-3">
                    <FileText className="w-5 h-5 text-[#2C4A6E]" />
                    <h3 className="font-bold text-sm text-[#1C2B3A] uppercase tracking-wider">{t('zone1Label')}</h3>
                  </div>
                  <p className="text-xs text-gray-500 mb-4 font-normal">{t('zone1Helper')}</p>
                  
                  {/* Drop / Select zone */}
                  <div 
                    onClick={() => photoInputRef.current?.click()}
                    onDragOver={handleDragOver}
                    onDrop={handlePhotoDrop}
                    className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center cursor-pointer hover:bg-gray-50 transition-colors relative flex flex-col items-center justify-center min-h-[160px]"
                  >
                    <input 
                      type="file" 
                      ref={photoInputRef}
                      onChange={selectPhotoFile}
                      accept="image/*"
                      className="hidden" 
                    />
                    
                    {!uploadedPhoto ? (
                      <>
                        <div className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center text-gray-500 mb-3 border border-gray-200">
                          <Upload className="w-5 h-5 text-gray-400" />
                        </div>
                        <span className="text-xs font-bold text-gray-700">{t('dropAreaTextPhoto')}</span>
                        <span className="text-[10px] text-gray-400 mt-1 font-mono">{t('formatsPhotoLabel')}</span>
                      </>
                    ) : (
                      <div className="w-full flex flex-col items-center">
                        {/* CSS Styled realistic Notepad Paper thumb to avoid fake image file */}
                        <div className="w-24 h-28 border border-gray-300 shadow-sm rounded-sm overflow-hidden text-[5px] leading-[7px] text-left p-2 font-mono text-gray-600 relative bg-white notebook-page">
                          <div className="absolute top-0 right-0 left-0 h-1.5 bg-[#C62828] opacity-80" />
                          <p className="mt-1 font-bold">SPESA ORDINE:</p>
                          <p>- 5 kaiserteile</p>
                          <p>- 2 jg brimi</p>
                          <p>- latte 6 ltr</p>
                          <p>- pane 00 forse 3</p>
                          <p>- speck</p>
                          <p>- Apfelsaft 12x1L</p>
                          <p className="text-red-500">[unlesbar]</p>
                        </div>
                        <span className="text-[10px] font-mono text-[#101010] mt-3 truncate max-w-full font-bold">
                          {uploadedPhoto.name}
                        </span>
                        <button 
                          onClick={removePhoto} 
                          className="text-xs text-[#C62828] hover:underline mt-1 font-medium"
                        >
                          Rimuovi
                        </button>
                      </div>
                    )}
                  </div>
                </div>

                {/* Sub note warning */}
                <div className="mt-5 bg-gray-50 rounded-lg p-3 border border-gray-150">
                  <p className="text-[10px] leading-relaxed text-gray-500 italic">
                    {t('zone1SubNote')}
                  </p>
                </div>
              </div>


              {/* ZONE 2 CARD: Audio file upload */}
              <div className="bg-white border border-[#E0E0E0] rounded-xl p-5 shadow-sm hover:shadow-md transition-all duration-200 flex flex-col justify-between" id="zone-2-card">
                <div>
                  <div className="flex items-center gap-2 mb-3">
                    <Mic className="w-5 h-5 text-[#2C4A6E]" />
                    <h3 className="font-bold text-sm text-[#1C2B3A] uppercase tracking-wider">{t('zone2Label')}</h3>
                  </div>
                  <p className="text-xs text-gray-500 mb-4 font-normal">{t('zone2Helper')}</p>
                  
                  {/* Drop / Select zone */}
                  <div 
                    onClick={() => audioInputRef.current?.click()}
                    onDragOver={handleDragOver}
                    onDrop={handleAudioDrop}
                    className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center cursor-pointer hover:bg-gray-50 transition-colors relative flex flex-col items-center justify-center min-h-[160px]"
                  >
                    <input 
                      type="file" 
                      ref={audioInputRef}
                      onChange={selectAudioFile}
                      accept="audio/*"
                      className="hidden" 
                    />
                    
                    {!uploadedAudio ? (
                      <>
                        <div className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center text-gray-500 mb-3 border border-gray-200">
                          <Mic className="w-5 h-5 text-gray-400" />
                        </div>
                        <span className="text-xs font-bold text-gray-700">{t('dropAreaTextAudio')}</span>
                        <span className="text-[10px] text-gray-400 mt-1 font-mono">{t('formatsAudioLabel')}</span>
                      </>
                    ) : (
                      <div className="w-full flex flex-col items-center">
                        <div className="bg-gray-50 border border-gray-200 px-4 py-2.5 rounded-lg flex items-center gap-3 w-full shadow-inner">
                          <button 
                            type="button"
                            onClick={(e) => { e.stopPropagation(); setIsAudioPlaying(!isAudioPlaying); }} 
                            className="w-8 h-8 rounded-full bg-[#1C2B3A] text-white flex items-center justify-center hover:bg-opacity-90 active:scale-95"
                          >
                            {isAudioPlaying ? <Pause className="w-3.5 h-3.5 fill-white" /> : <Play className="w-3.5 h-3.5 fill-white" />}
                          </button>
                          <div className="flex-1">
                            <div className="text-[10px] font-mono text-gray-600 truncate font-bold">{uploadedAudio.name}</div>
                            {/* Animated fake sound wave bars */}
                            <div className="flex gap-0.5 items-end h-3 mt-1.5 overflow-hidden">
                              {[1, 4, 2, 5, 3, 6, 2, 4, 3, 7, 2, 5, 3, 1].map((h, i) => (
                                <div 
                                  key={i} 
                                  className="w-[2px] bg-[#1565C0] rounded-sm transition-all duration-300"
                                  style={{ height: isAudioPlaying ? `${h * 15}%` : '20%', animation: isAudioPlaying ? `bounce 1s ease-in-out infinite alternate ${i * 50}ms` : 'none' }}
                                />
                              ))}
                            </div>
                          </div>
                          <span className="text-[10px] text-gray-450 font-mono font-bold">{uploadedAudio.duration}</span>
                        </div>
                        <span className="text-[10px] font-mono text-gray-500 mt-2">
                          AUDIO-2026-05-27-10-14-37.m4a
                        </span>
                        <button 
                          onClick={removeAudio} 
                          className="text-xs text-[#C62828] hover:underline mt-1 font-medium"
                        >
                          Rimuovi
                        </button>
                      </div>
                    )}
                  </div>
                </div>

                {/* Dialect note warning */}
                <div className="mt-5 bg-gray-50 rounded-lg p-3 border border-gray-150">
                  <p className="text-[10px] leading-relaxed text-[#1C2B3A] italic font-medium">
                    {t('zone2DialectNote')}
                  </p>
                </div>
              </div>


              {/* ZONE 3 CARD: Plain text paste */}
              <div className="bg-white border border-[#E0E0E0] rounded-xl p-5 shadow-sm hover:shadow-md transition-all duration-200 flex flex-col justify-between" id="zone-3-card">
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <Edit className="w-5 h-5 text-[#2C4A6E]" />
                      <h3 className="font-bold text-sm text-[#1C2B3A] uppercase tracking-wider">{t('zone3Label')}</h3>
                    </div>
                    {/* Character limit/counter status */}
                    <span className="bg-gray-100 text-[10px] font-bold text-gray-500 border border-gray-200 px-1.5 py-0.5 rounded-md font-mono">
                      {textPaste.length} car.
                    </span>
                  </div>
                  <p className="text-xs text-gray-500 mb-4 font-normal">
                    Invia messaggio WhatsApp del cliente...
                  </p>
                  
                  {/* Large text area */}
                  <div className="relative">
                    <textarea 
                      value={textPaste}
                      onChange={(e) => setTextPaste(e.target.value)}
                      placeholder={t('zone3Placeholder')}
                      rows={6}
                      className="w-full text-xs font-mono bg-white p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-[#2C4A6E] placeholder-gray-400 outline-none resize-none inline-block leading-relaxed"
                    />
                  </div>
                </div>

                {/* Dialect note warning */}
                <div className="mt-5 bg-gray-50 rounded-lg p-3 border border-gray-150">
                  <p className="text-[10px] leading-relaxed text-gray-500 italic">
                    {t('zone3Note')}
                  </p>
                </div>
              </div>

            </div>


            {/* CUSTOMER INFO ROW (Optional elements) */}
            <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm" id="optional-customer-form">
              <span className="text-[10px] font-sans font-bold tracking-wider text-gray-400 block mb-4">
                {t('optionalSectionTitle')}
              </span>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                
                {/* Field 1: Customer Code */}
                <div className="flex flex-col gap-1.5">
                  <label className="text-[11px] font-bold text-[#1C2B3A] tracking-wide uppercase">
                    {t('customerCodeLabel')}
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-2.5 text-xs text-gray-400 font-bold font-mono">C -</span>
                    <input 
                      type="text"
                      className="w-full text-xs font-mono border border-gray-300 rounded-lg py-2.5 pl-8 pr-3 bg-white focus:outline-none focus:border-[#2C4A6E] tracking-wider" 
                      placeholder="79102"
                      value={customerCode.replace(/^C-?/i, '')}
                      onChange={(e) => setCustomerCode('C-' + e.target.value)}
                    />
                  </div>
                </div>

                {/* Field 2: Order Reference */}
                <div className="flex flex-col gap-1.5">
                  <label className="text-[11px] font-bold text-[#1C2B3A] tracking-wide uppercase">
                    {t('orderReferenceLabel')}
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-2.5 text-xs text-gray-400 font-bold font-mono">REF -</span>
                    <input 
                      type="text"
                      className="w-full text-xs font-mono border border-gray-300 rounded-lg py-2.5 pl-11 pr-3 bg-white focus:outline-none focus:border-[#2C4A6E] tracking-wider" 
                      placeholder="99528"
                      value={orderReference.replace(/^REF-?/i, '')}
                      onChange={(e) => setOrderReference('REF-' + e.target.value)}
                    />
                  </div>
                </div>

                {/* Field 3: Date */}
                <div className="flex flex-col gap-1.5">
                  <label className="text-[11px] font-bold text-[#1C2B3A] tracking-wide uppercase">
                    {t('dateLabel')}
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-3 text-gray-400">
                      <Calendar className="w-3.5 h-3.5" />
                    </span>
                    <input 
                      type="date"
                      className="w-full text-xs font-mono border border-gray-300 rounded-lg py-2 pl-9 pr-3 bg-white focus:outline-none focus:border-[#2C4A6E]" 
                      value={orderDate}
                      onChange={(e) => setOrderDate(e.target.value)}
                    />
                  </div>
                </div>

              </div>
            </div>

            {/* MAIN ACTION TRIGGER SUBMIT */}
            <div className="flex justify-center pt-4">
              <button 
                onClick={handleStartExtraction}
                className="bg-[#1C2B3A] text-white font-bold py-3.5 px-10 rounded-lg shadow-md hover:bg-opacity-95 text-xs tracking-widest transition-all duration-200 cursor-pointer active:scale-95 flex items-center gap-2 uppercase font-mono"
              >
                <span>{t('submitButtonText')}</span>
                <ArrowRight className="w-4 h-4 text-white" />
              </button>
            </div>

          </div>
        )}


        {/* ==================== LOADING OVERLAY ==================== */}
        {isLoading && (
          <div className="fixed inset-0 bg-white bg-opacity-98 backdrop-blur-sm z-[999] flex flex-col justify-center items-center p-6 animate-fade-in" id="loading-overlay">
            
            <div className="max-w-md w-full text-center space-y-12">
              
              {/* Spinning Logo / Icon */}
              <div className="relative flex justify-center items-center">
                <div className="w-16 h-16 rounded-full border-4 border-gray-100 border-t-[#1C2B3A] animate-spin" />
              </div>

              {/* Title Header */}
              <div className="space-y-2">
                <h2 className="text-xl font-bold text-[#1C2B3A]">
                  {lang === 'ITA' ? "Estrazione in corso del file..." : "Bestellung wird extrahiert..."}
                </h2>
                <p className="text-xs text-gray-500 leading-relaxed">
                  {lang === 'ITA' 
                    ? "Analisi avanzata tramite l'API di Gemini. Attendere la formattazione dei dati delle righe." 
                    : "Fortgeschrittene Analyse über die Gemini-API. Bitte warten Sie, während die Zeilendaten formatiert werden."}
                </p>
              </div>

              <div className="h-px bg-gray-200 w-full" />

              {/* Loading Steps Sequence */}
              <div className="space-y-6 text-left pl-8 w-fit mx-auto">
                
                {/* Step 1: File ricevuto */}
                <div className="flex items-start gap-4">
                  <div className="mt-0.5">
                    {loadingStep >= 1 ? (
                      <div className="w-5 h-5 rounded-full bg-[#2E7D32] flex items-center justify-center text-white">
                        <Check className="w-3 h-3 stroke-[3px]" />
                      </div>
                    ) : (
                      <div className="w-5 h-5 rounded-full border-2 border-gray-300 flex items-center justify-center text-xs text-gray-400 font-bold font-mono">1</div>
                    )}
                  </div>
                  <div>
                    <h3 className={`text-xs font-bold ${loadingStep >= 1 ? 'text-[#1C2B3A]' : 'text-gray-400'}`}>
                      {t('fileReceived')}
                    </h3>
                    <p className={`text-[10px] mt-0.5 ${loadingStep >= 1 ? 'text-gray-500' : 'text-gray-400'}`}>
                      {t('fileReceivedSub')}
                    </p>
                  </div>
                </div>

                {/* Step 2: Estrazione AI */}
                <div className="flex items-start gap-4">
                  <div className="mt-0.5">
                    {loadingStep >= 2 ? (
                      <div className="w-5 h-5 rounded-full bg-[#2E7D32] flex items-center justify-center text-white">
                        <Check className="w-3 h-3 stroke-[3px]" />
                      </div>
                    ) : (
                      <div className="w-5 h-5 rounded-full border-2 border-gray-300 flex items-center justify-center text-xs text-gray-400 font-bold font-mono">2</div>
                    )}
                  </div>
                  <div>
                    <h3 className={`text-xs font-bold ${loadingStep >= 2 ? 'text-[#1C2B3A]' : 'text-gray-400'}`}>
                      {t('aiExtractionInProgress')}
                    </h3>
                    <p className={`text-[10px] mt-0.5 ${loadingStep >= 2 ? 'text-gray-500' : 'text-gray-400'}`}>
                      {t('aiExtractionInProgressSub')}
                    </p>
                  </div>
                </div>

                {/* Step 3: Strutturazione note */}
                <div className="flex items-start gap-4">
                  <div className="mt-0.5">
                    {loadingStep >= 3 ? (
                      <div className="w-5 h-5 rounded-full bg-[#2E7D32] flex items-center justify-center text-white">
                        <Check className="w-3 h-3 stroke-[3px]" />
                      </div>
                    ) : (
                      <div className="w-5 h-5 rounded-full border-2 border-gray-300 flex items-center justify-center text-xs text-gray-400 font-bold font-mono">3</div>
                    )}
                  </div>
                  <div>
                    <h3 className={`text-xs font-bold ${loadingStep >= 3 ? 'text-[#1C2B3A]' : 'text-gray-400'}`}>
                      {t('structuringNotes')}
                    </h3>
                    <p className={`text-[10px] mt-0.5 ${loadingStep >= 3 ? 'text-gray-500' : 'text-gray-400'}`}>
                      {t('structuringNotesSub')}
                    </p>
                  </div>
                </div>

                {/* Step 4: Pronto per revisione */}
                <div className="flex items-start gap-4">
                  <div className="mt-0.5">
                    {loadingStep >= 4 ? (
                      <div className="w-5 h-5 rounded-full bg-[#2E7D32] flex items-center justify-center text-white animate-pulse">
                        <Check className="w-3 h-3 stroke-[3px]" />
                      </div>
                    ) : (
                      <div className="w-5 h-5 rounded-full border-2 border-gray-300 flex items-center justify-center text-xs text-gray-400 font-bold font-mono">4</div>
                    )}
                  </div>
                  <div>
                    <h3 className={`text-xs font-bold ${loadingStep >= 4 ? 'text-[#1C2B3A]' : 'text-gray-400'}`}>
                      {t('readyForReview')}
                    </h3>
                    <p className={`text-[10px] mt-0.5 ${loadingStep >= 4 ? 'text-gray-500' : 'text-gray-400'}`}>
                      {t('readyForReviewSub')}
                    </p>
                  </div>
                </div>

              </div>

            </div>

          </div>
        )}


        {/* ==================== PAGE 2: REVISIONE UMANA ==================== */}
        {currentPage === 2 && (
          <div className="space-y-6 pb-20 animate-fade-in" id="page-2-container">
            
            {/* Top Toolbar bar */}
            <div className="flex justify-between items-center" id="page-2-toolbar">
              <button 
                onClick={() => setCurrentPage(1)}
                className="bg-white border border-gray-300 hover:bg-gray-50 text-[11px] font-bold uppercase tracking-wider px-4 py-2 rounded-lg flex items-center gap-2 cursor-pointer shadow-sm text-gray-600 transition-colors font-mono"
              >
                <RotateCcw className="w-3.5 h-3.5 text-gray-500" />
                <span>{t('newUploadBtn')}</span>
              </button>

              <div className="text-xs text-gray-500 font-mono font-medium">
                {t('operatorLabel')}: <span className="font-bold text-[#1C2B3A]">acampagnoli02</span>
              </div>
            </div>

            {/* 1. PIPELINE Stepper BANNER */}
            <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm" id="pipeline-banner-container">
              <span className="text-[10px] font-sans font-bold tracking-wider text-gray-400 block mb-4 uppercase">
                PIPELINE DI ELABORAZIONE:
              </span>
              
              <div className="flex items-center justify-between gap-2 overflow-x-auto py-2">
                
                {/* Stepper Node 1 */}
                <div className="flex items-center gap-2 flex-1 min-w-[140px]">
                  <div className="w-8 h-8 rounded-full bg-[#E8F5E9] border border-[#2E7D32] flex items-center justify-center text-[#2E7D32] shrink-0">
                    <Check className="w-4 h-4 stroke-[2.5]" />
                  </div>
                  <div className="flex flex-col">
                    <span className="text-[11px] font-bold text-[#1C2B3A] line-clamp-1">{t('pipelineStep1')}</span>
                    <span className="text-[9px] text-[#2E7D32] font-mono leading-none">File ricevuto</span>
                  </div>
                </div>

                <div className="text-gray-300 text-xs shrink-0 px-1">→</div>

                {/* Stepper Node 2 */}
                <div className="flex items-center gap-2 flex-1 min-w-[150px]">
                  <div className="w-8 h-8 rounded-full bg-[#E8F5E9] border border-[#2E7D32] flex items-center justify-center text-[#2E7D32] shrink-0">
                    <Check className="w-4 h-4 stroke-[2.5]" />
                  </div>
                  <div className="flex flex-col">
                    <span className="text-[11px] font-bold text-[#1C2B3A] line-clamp-1">{t('pipelineStep2')}</span>
                    <span className="text-[9px] text-[#2E7D32] font-mono leading-none">Modello Gemini attivo</span>
                  </div>
                </div>

                <div className="text-gray-300 text-xs shrink-0 px-1">→</div>

                {/* Stepper Node 3 */}
                <div className="flex items-center gap-2 flex-1 min-w-[150px] border border-cyan-300 bg-[#E0F7FA] rounded-lg p-2 shadow-sm shrink-0">
                  <div className="w-8 h-8 rounded-full bg-[#00838F] text-white flex items-center justify-center shrink-0 shadow-inner">
                    <Edit className="w-4 h-4" />
                  </div>
                  <div className="flex flex-col">
                    <span className="text-[11px] font-bold text-[#00838F] line-clamp-1">{t('pipelineStep3')}</span>
                    <span className="text-[9px] text-[#00838F] font-semibold font-mono leading-none">Verifica della riga</span>
                  </div>
                </div>

                <div className="text-gray-300 text-xs shrink-0 px-1">→</div>

                {/* Stepper Node 4 */}
                <div className="flex items-center gap-2 flex-1 min-w-[140px] shrink-0">
                  <div className="w-8 h-8 rounded-full border border-gray-200 text-gray-305 flex items-center justify-center shrink-0 bg-gray-50 text-gray-400">
                    <FileText className="w-4 h-4" />
                  </div>
                  <div className="flex flex-col">
                    <span className="text-[11px] font-bold text-gray-400 line-clamp-1">{t('pipelineStep4')}</span>
                    <span className="text-[9px] text-gray-400 font-mono leading-none">Strutturazione pronta</span>
                  </div>
                </div>

              </div>
            </div>

            {/* 2. Scheda Convalida / Validierungsblatt (full width) */}
            <div className="bg-white border border-[#E0E0E0] rounded-xl p-5 shadow-sm" id="validation-sheet">
              <span className="text-[10px] font-sans font-bold tracking-wider text-gray-400 block mb-4 uppercase">
                {t('sectionValidationCard')}
              </span>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-y-4 gap-x-6">
                <div>
                  <span className="text-[10px] font-bold text-gray-400 tracking-wider block uppercase">{t('customerCodeLabel')}</span>
                  <span className="text-xs font-bold text-[#1C2B3A] font-mono mt-0.5 inline-block">{customerCode || "C-2026"}</span>
                </div>
                <div>
                  <span className="text-[10px] font-bold text-gray-400 tracking-wider block uppercase">{t('orderReferenceLabel')}</span>
                  <span className="text-xs font-bold text-[#1C2B3A] font-mono mt-0.5 inline-block">{orderReference || "N/D"}</span>
                </div>
                <div>
                  <span className="text-[10px] font-bold text-gray-400 tracking-wider block uppercase">{t('dateLabel')}</span>
                  <span className="text-xs font-bold text-[#1C2B3A] font-mono mt-0.5 inline-block">{orderDate}</span>
                </div>
                <div>
                  <span className="text-[10px] font-bold text-gray-400 tracking-wider block uppercase">TIPO DI CANALE</span>
                  <span className="text-xs font-bold text-[#2C4A6E] font-sans mt-0.5 inline-block">
                    {uploadedPhoto ? "Foto WhatsApp" : uploadedAudio ? "Messaggio vocale" : "Testo WhatsApp"}
                  </span>
                </div>
                
                <div className="border-t border-gray-100 pt-3 mt-1 col-span-2 md:col-span-1">
                  <span className="text-[10px] font-bold text-gray-400 tracking-wider block uppercase">FILE SORGENTE DI ORIGINE</span>
                  <span className="text-xs font-semibold text-[#1C2B3A] font-mono mt-0.5 inline-block truncate max-w-full">
                    {uploadedPhoto?.name || uploadedAudio?.name || "verbatim_paste.txt"}
                  </span>
                </div>
                <div className="border-t border-gray-100 pt-3 mt-1">
                  <span className="text-[10px] font-bold text-gray-400 tracking-wider block uppercase">LINGUA RILEVATA</span>
                  <span className="text-xs font-bold text-[#1C2B3A] mt-0.5 inline-block">
                    {lang === 'ITA' ? "Italiano / Tedesco (Misto)" : "Italienisch / Deutsch (Gemischt)"}
                  </span>
                </div>
                <div className="border-t border-gray-100 pt-3 mt-1 col-span-2">
                  <span className="text-[10px] font-bold text-gray-400 tracking-wider block uppercase">RIGHE TOTALI</span>
                  <span className="text-xs font-bold text-[#1C2B3A] mt-0.5 inline-block">
                    {totalRowsCount} <span className="text-xs font-mono font-medium text-gray-500">
                      ({daRisolvereCount > 0 ? `${daRisolvereCount} incerte, in arancione` : "tutte verificate!"})
                    </span>
                  </span>
                </div>
              </div>
            </div>

            {/* 3. Ordine rilevato / Erkannte Bestellung (full width document style) */}
            <div className="bg-white border border-[#E0E0E0] rounded-xl p-6 shadow-sm relative overflow-hidden" id="raw-ocr-card">
              <div className="flex justify-between items-center mb-4 pb-2 border-b border-gray-100">
                <div className="flex items-center gap-2">
                  <FileText className="w-5 h-5 text-gray-400" />
                  <span className="text-[10px] font-sans font-bold tracking-wider text-gray-400 uppercase">
                    {t('sectionDetectedOrder')}
                  </span>
                </div>
                {/* Badget representing source document preview */}
                <div className="flex items-center gap-1 bg-gray-50 border border-gray-200 px-2 py-0.5 rounded text-[10px] font-mono font-semibold text-gray-600">
                  {uploadedPhoto ? <CheckCircle2 className="w-3 h-3 text-green-600" /> : <CheckCircle2 className="w-3 h-3 text-blue-600" />}
                  <span>{uploadedPhoto ? "FOTO OCR" : uploadedAudio ? "AUDIO DIALETTO TRANSCRIPT" : "TESTO CORPO ORIGINALE"}</span>
                </div>
              </div>

              {/* White clean doc styled area resembling Word page */}
              <div className="bg-[#FFFFFF] border border-[#E0E0E0] rounded-lg p-6 shadow-inner font-mono text-xs text-gray-800 space-y-2 leading-relaxed tracking-wider">
                <div className="text-[10px] font-mono font-bold text-gray-400 border-b border-gray-150 pb-1 mb-3 uppercase tracking-widest">
                  FLUSSO OCR RILEVATO DA SORGENTE
                </div>
                
                <div className="space-y-1 text-[#101010] font-medium">
                  <div>1. 5 schweinskaiserteile ohne deckl</div>
                  <div>2. 2 naturjoghurt brimi</div>
                  <div>3. latte intero 6 litri</div>
                  <div>4. pane tipo 00 forse 3 sacchi</div>
                  <div className="text-[#F57C00] font-semibold">5. speck alto adige affettato <span className="bg-[#FFF3E0] px-1 rounded border border-[#FFE0B2] text-[10px]">(! manca quantità / Menge fehlt)</span></div>
                  <div>6. Apfelsaft 12x1L Fa. Juval</div>
                  <div className="border border-[#FFCDD2] bg-[#FFEBEE] p-1.5 rounded text-[#C62828] font-bold flex items-center justify-between">
                    <span>7. [unlesbar / illegibile] Vinschgerlen (?) (Ricostruzione probabile)</span>
                    <span className="text-[9px] uppercase font-bold tracking-wider px-1 bg-white border border-[#EF9A9A] rounded">Basso Score (0.40)</span>
                  </div>
                </div>
              </div>
            </div>

            {/* 4. Righe ordine rilevate / Erkannte Bestellzeilen Table */}
            <div className="bg-white border border-[#1C2B3A] rounded-xl shadow-md overflow-hidden" id="order-lines-table-card">
              
              {/* Header inside the table component card */}
              <div className="bg-[#F8F9FA] border-b border-gray-200 px-6 py-4 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <h3 className="font-bold text-sm tracking-wide text-[#1C2B3A] uppercase">
                  {t('sectionOrderLines')}
                </h3>

                {/* Bulk Actions Bar above the table */}
                <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
                  <button 
                    onClick={handleConfirmAll}
                    className="bg-[#2E7D32] text-white hover:bg-[#1B5E20] text-[10px] font-mono font-bold uppercase py-1.5 px-3 rounded-lg shadow-sm cursor-pointer transition-colors"
                  >
                    {t('bulkConfirmAll')}
                  </button>
                  <button 
                    onClick={handleAddRow}
                    className="bg-white border border-gray-300 hover:bg-gray-50 text-[10px] font-mono font-bold text-[#1C2B3A] py-1.5 px-3 rounded-lg flex items-center gap-1 cursor-pointer shadow-sm transition-colors"
                  >
                    <Plus className="w-3 h-3" />
                    <span>Aggiungi riga</span>
                  </button>
                  <button 
                    onClick={handleExportJSON}
                    disabled={exportDisabled}
                    className={`text-[10px] font-mono font-bold py-1.5 px-3 rounded-lg flex items-center gap-1 shadow-sm transition-colors transition-all ${exportDisabled ? 'bg-gray-100 border border-gray-200 text-gray-400 cursor-not-allowed' : 'bg-white border border-gray-300 hover:bg-gray-50 text-[#1C2B3A] cursor-pointer'}`}
                  >
                    <Download className="w-3 h-3" />
                    <span>{t('bulkExportJSON')}</span>
                  </button>
                  <button 
                    onClick={handleExportCSV}
                    disabled={exportDisabled}
                    className={`text-[10px] font-mono font-bold py-1.5 px-3 rounded-lg flex items-center gap-1 shadow-sm transition-colors transition-all ${exportDisabled ? 'bg-gray-100 border border-gray-200 text-gray-400 cursor-not-allowed' : 'bg-white border border-gray-300 hover:bg-gray-50 text-[#1C2B3A] cursor-pointer'}`}
                  >
                    <Download className="w-3 h-3" />
                    <span>{t('bulkExportCSV')}</span>
                  </button>
                  <button 
                    onClick={handleResetAll}
                    className="border border-gray-300 bg-white hover:bg-red-50 hover:text-red-700 hover:border-red-300 text-gray-600 text-[10px] font-mono font-bold py-1.5 px-2.5 rounded-lg transition-colors cursor-pointer"
                  >
                    {t('bulkReset')}
                  </button>
                </div>
              </div>

              {/* Show Warning if export is disabled */}
              {exportDisabled && (
                <div className="bg-[#FFE0B2] border-b border-[#FFE0B2] text-[#B78103] text-xs font-semibold px-6 py-2 flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 text-[#F57C00] shrink-0" />
                  <span>{t('exportBlockedNotice')}</span>
                </div>
              )}

              {/* Table Container responsive wrapper */}
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse table-auto">
                  <thead className="bg-[#F8F9FA] border-b border-gray-200 font-mono text-[9px] text-gray-500 tracking-wider">
                    <tr>
                      <th className="px-4 py-3 text-center">#</th>
                      <th className="px-4 py-3">{t('colOriginalText')}</th>
                      <th className="px-4 py-3">{t('colProductDesc')}</th>
                      <th className="px-4 py-3">{t('colSKU')}</th>
                      <th className="px-3 py-3 text-center">{t('colQuantity')}</th>
                      <th className="px-3 py-3 text-center">{t('colUnit')}</th>
                      <th className="px-3 py-3 text-center">{t('colLanguage')}</th>
                      <th className="px-3 py-3 text-center">{t('colStatus')}</th>
                      <th className="px-3 py-3 text-center">{t('colConfidenceLabel')}</th>
                      <th className="px-4 py-3 text-right">{t('colActions')}</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200 text-xs font-sans">
                    {orderLines.map((line, index) => {
                      const isUncertain = line.uncertain && line.status !== 'confirmed' && line.status !== 'rejected';
                      // Select border color based on score
                      let borderLeftClass = "border-l-4 border-l-[#2E7D32]"; // green
                      if (line.confidenceScore < 0.75) {
                        borderLeftClass = "border-l-4 border-l-[#C62828]"; // red
                      } else if (line.confidenceScore < 0.90) {
                        borderLeftClass = "border-l-4 border-l-[#F57C00]"; // amber
                      }

                      // Check if rejected
                      const isRejected = line.status === 'rejected';

                      return (
                        <React.Fragment key={line.id}>
                          <tr className={`hover:bg-gray-50 transition-colors ${borderLeftClass} ${isRejected ? 'opacity-60 bg-gray-50/50' : ''}`}>
                            
                            {/* 1. Row index number */}
                            <td className="px-4 py-3.5 text-center font-mono font-bold text-gray-400">
                              {index + 1}
                            </td>

                            {/* 2. Original text verbatim */}
                            <td className={`px-4 py-3.5 font-mono text-[11px] font-semibold text-[#1C2B3A] italic leading-tight ${isRejected ? 'line-through text-gray-400' : ''}`}>
                              {line.originalText}
                            </td>

                            {/* 3. Product Description (AI-cleaned) */}
                            <td className="px-4 py-3.5">
                              <div className="flex flex-col">
                                {line.matchedSku === null && line.status === 'unreadable' ? (
                                  <span className="text-[#C62828] font-bold italic leading-tight">
                                    {line.productDescription[lang]}
                                  </span>
                                ) : (
                                  <span className={`font-bold text-[#1C2B3A] leading-tight ${isRejected ? 'line-through text-gray-400' : ''}`}>
                                    {line.productDescription[lang]}
                                  </span>
                                )}
                                
                                {/* Warnings inline */}
                                {isUncertain && line.uncertaintyReason && (
                                  <span className="text-[10px] text-[#F57C00] font-sans font-semibold mt-1 flex items-start gap-1">
                                    <AlertTriangle className="w-3.5 h-3.5 text-[#F57C00] shrink-0 mt-0.5" />
                                    <span>{line.uncertaintyReason[lang]}</span>
                                  </span>
                                )}
                                {isUncertain && line.id === 7 && (
                                  <span className="text-[10px] text-[#C62828] font-sans font-semibold mt-1 flex items-start gap-1">
                                    <AlertCircle className="w-3.5 h-3.5 text-[#C62828] shrink-0 mt-0.5" />
                                    <span>{line.uncertaintyReason?.[lang]}</span>
                                  </span>
                                )}
                              </div>
                            </td>

                            {/* 4. Articolo abbinato (SKU Code + label) */}
                            <td className="px-4 py-3.5">
                              {line.matchedSku ? (
                                <div className="flex flex-col gap-1.5">
                                  <div className="flex items-center gap-1.5">
                                    <span className="bg-gray-100 border border-gray-300 text-[10px] font-mono font-bold text-[#1C2B3A] px-1.5 py-0.5 rounded shadow-sm">
                                      {line.matchedSku}
                                    </span>
                                    <span className="text-[11px] text-gray-600 font-medium truncate max-w-[150px]">
                                      {line.matchedSkuLabel ? line.matchedSkuLabel[lang].replace(/^[A-Z0-9]+ – /i, '') : ''}
                                    </span>
                                  </div>
                                  
                                  {/* Mostrar alternatives inline link */}
                                  {line.alternatives.length > 0 && (
                                    <button 
                                      onClick={() => setExpandedAlternativesRow(expandedAlternativesRow === line.id ? null : line.id)}
                                      className="text-[10px] text-[#1565C0] font-medium hover:underline flex items-center gap-0.5 text-left bg-transparent border-0 cursor-pointer p-0"
                                    >
                                      <span>{lang === 'ITA' ? "Mostra alternative" : "Alternativen anzeigen"}</span>
                                      <ChevronDown className={`w-3 h-3 transition-transform ${expandedAlternativesRow === line.id ? 'rotate-180' : ''}`} />
                                    </button>
                                  )}
                                </div>
                              ) : (
                                <span className="text-gray-400 font-bold">—</span>
                              )}
                            </td>

                            {/* 5. Quantity editable inline */}
                            <td className="px-3 py-3.5 text-center font-mono font-bold">
                              {line.quantity !== null ? (
                                <span className="bg-gray-50 border border-gray-250 px-2 py-1 rounded text-xs select-all text-[#101010]">
                                  {line.quantity}
                                </span>
                              ) : (
                                <span className="bg-[#FFEBEE] border border-[#FFCDD2] text-[#C62828] font-bold text-[10px] px-1.5 py-0.5 rounded shadow-sm">
                                  ?!
                                </span>
                              )}
                            </td>

                            {/* 6. Unit */}
                            <td className="px-3 py-3.5 text-center font-mono font-semibold text-gray-500">
                              {line.unit}
                            </td>

                            {/* 7. Language detected */}
                            <td className="px-3 py-3.5 text-center">
                              <span className="text-[10px] font-mono font-bold text-gray-500 border border-gray-200 px-1.5 py-0.5 rounded bg-gray-50 uppercase">
                                {line.languageDetected}
                              </span>
                            </td>

                            {/* 8. Status color circle dot */}
                            <td className="px-3 py-3.5 text-center">
                              <div className="flex items-center justify-center gap-1.5">
                                {/* Dot */}
                                <div className={`w-2.5 h-2.5 rounded-full ${
                                  line.status === 'confirmed' ? 'bg-[#2E7D32]' :
                                  line.status === 'pending' ? 'bg-[#F57C00]' :
                                  line.status === 'tocomplete' ? 'bg-[#FFE0B2] border border-[#FFE0B2]' :
                                  line.status === 'unreadable' ? 'bg-[#C62828]' : 'bg-gray-400'
                                }`} />
                                <span className="text-[10px] font-semibold text-gray-650">
                                  {line.status === 'confirmed' ? (lang === 'ITA' ? "Completato" : "Bestätigt") :
                                   line.status === 'pending' ? (lang === 'ITA' ? "In attesa" : "Ausstehend") :
                                   line.status === 'tocomplete' ? (lang === 'ITA' ? "Da completare" : "Ausstehend") :
                                   line.status === 'unreadable' ? (lang === 'ITA' ? "Non leggibile" : "Nicht lesbar") : ""}
                                </span>
                              </div>
                            </td>

                            {/* 8b. Confidence level badge pill */}
                            <td className="px-3 py-3.5 text-center whitespace-nowrap">
                              {(() => {
                                let bgClass = "bg-green-100 text-[#1B5E20] border border-[#C8E6C9]";
                                let labelStr = lang === 'ITA' ? "Alta affidabilità" : "Hohe Zuverlässigkeit";
                                
                                if (line.confidenceScore < 0.75) {
                                  bgClass = "bg-red-100 text-[#C62828] border border-[#FFCDD2]";
                                  labelStr = lang === 'ITA' ? "Validazione umana richiesta" : "Manuelle Validierung erforderlich";
                                } else if (line.confidenceScore < 0.90) {
                                  bgClass = "bg-[#FFF3E0] text-[#E65100] border border-[#FFE0B2]";
                                  labelStr = lang === 'ITA' ? "Revisione consigliata" : "Überprüfung empfohlen";
                                }

                                return (
                                  <span className={`inline-block px-2.5 py-1 rounded-full text-[10px] font-sans font-bold uppercase tracking-wider ${bgClass}`}>
                                    {labelStr}
                                  </span>
                                );
                              })()}
                            </td>

                            {/* 9. Operations action buttons */}
                            <td className="px-4 py-3.5 text-right whitespace-nowrap">
                              <div className="flex items-center justify-end gap-1">
                                {line.status !== 'confirmed' && (
                                  <button 
                                    onClick={() => handleConfirmRow(line.id)}
                                    className="bg-white border border-[#2E7D32] text-[#2E7D32] hover:bg-[#E8F5E9] text-[10px] font-bold uppercase tracking-wider py-1 px-2.5 rounded-md cursor-pointer transition-colors font-mono"
                                  >
                                    {t('actionConfirm')}
                                  </button>
                                )}
                                <button 
                                  onClick={() => handleOpenEditPanel(line)}
                                  className="bg-white border border-[#1565C0] text-[#1565C0] hover:bg-[#E3F2FD] text-[10px] font-bold uppercase tracking-wider py-1 px-2.5 rounded-md cursor-pointer transition-colors font-mono"
                                >
                                  {t('actionEdit')}
                                </button>
                                {line.status !== 'rejected' && (
                                  <button 
                                    onClick={() => handleRejectRow(line.id)}
                                    className="bg-white border border-[#C62828] text-[#C62828] hover:bg-[#FFEBEE] text-[10px] font-bold uppercase tracking-wider py-1 px-2.5 rounded-md cursor-pointer transition-colors font-mono"
                                  >
                                    {t('actionReject')}
                                  </button>
                                )}
                              </div>
                            </td>

                          </tr>

                          {/* EXPANDED ALTERNATIVE MATCHES PANEL */}
                          {expandedAlternativesRow === line.id && line.alternatives.length > 0 && (
                            <tr>
                              <td colSpan={10} className="bg-gray-50 px-6 py-4 border-l-4 border-l-[#1565C0] border-t border-b border-gray-200">
                                <div className="space-y-2">
                                  <span className="text-[10px] font-mono font-bold text-gray-400 tracking-wider block uppercase">
                                    {t('aiSuggestionsLabel')}:
                                  </span>
                                  <div className="flex flex-wrap gap-2">
                                    {/* Default proposal selected styled highlighted */}
                                    {line.matchedSku && (
                                      <div className="bg-[#E3F2FD] border-2 border-[#1565C0] text-[#1565C0] text-[10.5px] font-bold py-1.5 px-3 rounded-lg flex items-center gap-1.5 shadow-sm font-mono cursor-default">
                                        <Check className="w-3.5 h-3.5 text-[#1565C0]" />
                                        <span>{line.matchedSkuLabel ? line.matchedSkuLabel[lang] : line.matchedSku}</span>
                                      </div>
                                    )}
                                    
                                    {/* Alternative options chips */}
                                    {line.alternatives.map(alt => (
                                      <button 
                                        key={alt.sku}
                                        onClick={() => handleSelectAlternativeSku(line.id, alt.sku, alt.label)}
                                        className="bg-white border border-gray-300 text-gray-700 hover:border-[#1565C0] hover:text-[#1565C0] text-[10.5px] font-bold py-1.5 px-3 rounded-lg transition-all shadow-sm font-mono cursor-pointer hover:bg-sky-50 active:scale-95 text-left"
                                      >
                                        <span>{alt.sku} – {alt.label[lang].replace(/^[A-Z0-9]+ – /i, '')}</span>
                                      </button>
                                    ))}
                                  </div>
                                </div>
                              </td>
                            </tr>
                          )}

                          {/* INLINE EDIT PANELS */}
                          {editingRowId === line.id && (
                            <tr>
                              <td colSpan={10} className="bg-slate-50 p-6 border-l-4 border-l-[#1565C0] border-t border-b border-gray-300">
                                <div className="bg-white border border-gray-200 rounded-lg p-5 shadow-md space-y-5">
                                  
                                  {/* Heading title */}
                                  <div className="border-b border-gray-150 pb-2 flex justify-between items-center">
                                    <span className="text-xs font-bold uppercase tracking-wider text-[#1C2B3A] flex items-center gap-1">
                                      <Edit className="w-4 h-4 text-[#1565C0]" />
                                      <span>MODIFICA MANUALE RIGA {index + 1}</span>
                                    </span>
                                    <button 
                                      onClick={() => setEditingRowId(null)} 
                                      className="text-gray-400 hover:text-gray-600"
                                    >
                                      <X className="w-4 h-4" />
                                    </button>
                                  </div>

                                  <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
                                    
                                    {/* Input: Descrizione Prodotto (AI suggestion box attached) */}
                                    <div className="md:col-span-4 flex flex-col gap-1.5">
                                      <label className="text-[10px] font-bold text-gray-500 uppercase">
                                        Descrizione Prodotto
                                      </label>
                                      <input 
                                        type="text"
                                        value={editFormDesc}
                                        onChange={(e) => setEditFormDesc(e.target.value)}
                                        className="w-full text-xs font-sans border border-gray-300 rounded p-2 focus:outline-none focus:border-[#1565C0] bg-white font-semibold"
                                      />
                                      {/* AI suggestion chips */}
                                      <div className="mt-1 bg-gray-50 border border-gray-200 rounded p-2">
                                        <div className="text-[9px] font-bold text-gray-400 uppercase mb-1 font-sans">{t('replaceLabelInsideEdit')}:</div>
                                        <div className="flex flex-wrap gap-1">
                                          {MOCK_AI_SUGGESTIONS.schweinskaiserteile.map(rec => (
                                            <button 
                                              key={rec}
                                              onClick={() => setEditFormDesc(rec)}
                                              className="bg-white hover:bg-gray-100 border border-gray-250 rounded text-[9.5px] font-medium py-0.5 px-2 font-mono text-[#1C2B3A] cursor-pointer"
                                            >
                                              {rec}
                                            </button>
                                          ))}
                                        </div>
                                      </div>
                                    </div>

                                    {/* Input: SKU Articolo (alternatives inline chips attached) */}
                                    <div className="md:col-span-3 flex flex-col gap-1.5">
                                      <label className="text-[10px] font-bold text-gray-500 uppercase">
                                        Articolo Abbinato (SKU)
                                      </label>
                                      <input 
                                        type="text"
                                        value={editFormSku}
                                        onChange={(e) => setEditFormSku(e.target.value.toUpperCase())}
                                        className="w-full text-xs font-mono border border-gray-300 rounded p-2 focus:outline-none focus:border-[#1565C0] bg-white font-bold tracking-wider"
                                      />
                                      {/* Alternatives chips */}
                                      <div className="mt-1 bg-gray-50 border border-gray-200 rounded p-2">
                                        <div className="text-[9px] font-bold text-gray-400 uppercase mb-1 font-sans">Corrispondenze alternative:</div>
                                        <div className="flex flex-wrap gap-1">
                                          {line.alternatives.map(alt => (
                                            <button 
                                              key={alt.sku}
                                              onClick={() => { setEditFormSku(alt.sku); setEditFormDesc(alt.label[lang].replace(/^[A-Z9]+ – /i, '')); }}
                                              className="bg-white hover:bg-[#E3F2FD] border border-gray-250 rounded text-[9.5px] font-bold py-0.5 px-2 font-mono text-[#1565C0] cursor-pointer"
                                            >
                                              {alt.sku}
                                            </button>
                                          ))}
                                          {line.matchedSku && line.matchedSku !== editFormSku && (
                                            <button 
                                              onClick={() => { setEditFormSku(line.matchedSku || ''); setEditFormDesc(line.productDescription[lang]); }}
                                              className="bg-white hover:bg-gray-100 border border-gray-250 rounded text-[9.5px] font-bold py-0.5 px-2 font-mono text-gray-600 cursor-pointer"
                                            >
                                              Ripristina ({line.matchedSku})
                                            </button>
                                          )}
                                        </div>
                                      </div>
                                    </div>

                                    {/* Input: Qty */}
                                    <div className="md:col-span-2 flex flex-col gap-1.5">
                                      <label className="text-[10px] font-bold text-gray-500 uppercase">
                                        Quantità
                                      </label>
                                      <input 
                                        type="number"
                                        value={editFormQty}
                                        onChange={(e) => setEditFormQty(e.target.value)}
                                        className="w-full text-xs font-mono border border-gray-300 rounded p-2 focus:outline-none focus:border-[#1565C0] bg-white font-bold text-center"
                                        placeholder="?!"
                                      />
                                      <div className="flex gap-1.5 mt-2 justify-center">
                                        {[1, 2, 3, 5, 6, 12].map(v => (
                                          <button 
                                            key={v}
                                            onClick={() => setEditFormQty(String(v))}
                                            className="bg-gray-100 border border-gray-250 text-[10px] rounded px-1.5 font-mono cursor-pointer"
                                          >
                                            {v}
                                          </button>
                                        ))}
                                      </div>
                                    </div>

                                    {/* Input: Unit */}
                                    <div className="md:col-span-1.5 flex flex-col gap-1.5">
                                      <label className="text-[10px] font-bold text-gray-500 uppercase">
                                        Unità
                                      </label>
                                      <input 
                                        type="text"
                                        value={editFormUnit}
                                        onChange={(e) => setEditFormUnit(e.target.value)}
                                        className="w-full text-xs font-sans border border-gray-300 rounded p-2 focus:outline-none focus:border-[#1565C0] bg-white text-center font-semibold"
                                        placeholder="—"
                                      />
                                      <div className="flex gap-1 mt-2 justify-center flex-wrap">
                                        {['L', 'sacchi', 'x1L'].map(u => (
                                          <button 
                                            key={u}
                                            onClick={() => setEditFormUnit(u)}
                                            className="bg-gray-100 border border-gray-250 text-[8.5px] rounded px-1 cursor-pointer font-sans"
                                          >
                                            {u}
                                          </button>
                                        ))}
                                      </div>
                                    </div>

                                    {/* Input: Language */}
                                    <div className="md:col-span-1.5 flex flex-col gap-1.5 text-center">
                                      <label className="text-[10px] font-bold text-gray-500 uppercase text-left">
                                        Lingua
                                      </label>
                                      <select 
                                        value={editFormLang}
                                        onChange={(e) => setEditFormLang(e.target.value as 'ITA' | 'DE' | 'Misto')}
                                        className="w-full text-xs font-mono border border-gray-300 rounded p-2 bg-white focus:outline-none"
                                      >
                                        <option value="ITA">ITA</option>
                                        <option value="DE">DE</option>
                                        <option value="Misto">Misto</option>
                                      </select>
                                    </div>

                                  </div>

                                  {/* Save action triggers */}
                                  <div className="border-t border-gray-100 pt-3 flex justify-end gap-2 text-xs font-bold uppercase tracking-wider">
                                    <button 
                                      onClick={() => setEditingRowId(null)}
                                      className="border border-gray-300 bg-white hover:bg-gray-50 text-gray-600 px-4 py-2 rounded font-mono cursor-pointer"
                                    >
                                      Annulla
                                    </button>
                                    <button 
                                      onClick={handleSaveInlineEdit}
                                      className="bg-[#1565C0] text-white hover:bg-[#115293] px-5 py-2 rounded font-mono shadow-sm cursor-pointer"
                                    >
                                      Salva modifiche
                                    </button>
                                  </div>

                                </div>
                              </td>
                            </tr>
                          )}

                        </React.Fragment>
                      );
                    })}
                  </tbody>
                </table>
              </div>

            </div>


            {/* 5. Note di Estrazione / Extraktionsnotizen collapsible section */}
            <div className="bg-white border border-[#E0E0E0] rounded-xl shadow-sm overflow-hidden" id="extraction-notes-card">
              <button 
                onClick={() => setIsNotesExpanded(!isNotesExpanded)}
                className="w-full px-6 py-4 flex justify-between items-center bg-[#F8F9FA] border-b border-gray-100 hover:bg-gray-50 transition-colors cursor-pointer text-left"
              >
                <div className="flex items-center gap-2">
                  <AlertTriangle className="w-5 h-5 text-gray-400" />
                  <span className="font-bold text-sm tracking-wide text-[#1C2B3A] uppercase">
                    {t('extractionNotesTitle')}
                  </span>
                </div>
                {isNotesExpanded ? <ChevronUp className="w-4 h-4 text-gray-500" /> : <ChevronDown className="w-4 h-4 text-gray-500" />}
              </button>

              {isNotesExpanded && (
                <div className="p-6 space-y-6">
                  
                  {/* Logistics Notes Interpretate */}
                  <div className="space-y-3">
                    <span className="text-[10px] font-sans font-bold tracking-wider text-gray-400 block uppercase">
                      {t('logisticsNotesSub')}
                    </span>
                    
                    <div className="space-y-2">
                      {logisticsNotes.map((note, index) => (
                        <div key={index} className="bg-gray-50 border border-gray-200 p-3.5 rounded-lg text-xs flex justify-between items-center">
                          <div className="space-y-1">
                            <span className="font-mono text-xs italic font-bold text-[#1C2B3A]">"{note.text}"</span>
                            <div className="text-gray-500 font-medium font-sans">
                              → Interpretation: {note.interpretation[lang]}
                            </div>
                          </div>
                          {note.uncertain && (
                            <span className="bg-[#FFE0B2] border border-[#FFE0B2] text-[#F57C00] font-bold text-[9px] uppercase tracking-wider py-0.5 px-2 rounded">
                              Incerto
                            </span>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Parti Non Leggibili Warnings */}
                  <div className="space-y-3 pt-2">
                    <span className="text-[10px] font-sans font-bold tracking-wider text-gray-400 block uppercase">
                      {t('unreadablePartsSub')}
                    </span>
                    
                    <div className="bg-[#FFEBEE] border border-[#FFCDD2] p-4 rounded-lg flex items-start gap-3">
                      <AlertCircle className="w-4.5 h-4.5 text-[#C62828] shrink-0 mt-0.5" />
                      <div className="space-y-1 text-xs">
                        <span className="font-mono font-bold text-[#C62828] block underline">[unlesbar / illeggibile]</span>
                        <p className="text-gray-800 font-medium">
                          {t('unreadableWarning')}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Commento Generale textarea input */}
                  <div className="space-y-3 pt-2">
                    <span className="text-[10px] font-sans font-bold tracking-wider text-gray-400 block uppercase">
                      {t('generalCommentSub')}
                    </span>
                    <textarea 
                      value={lang === 'ITA' ? generalComment.ITA : generalComment.DE}
                      onChange={(e) => setGeneralComment(prev => ({ ...prev, [lang]: e.target.value }))}
                      rows={2}
                      className="w-full text-xs border border-gray-300 rounded-lg p-3 bg-white focus:outline-none focus:border-[#2C4A6E] text-gray-800 font-semibold resize-none"
                    />
                  </div>

                </div>
              )}
            </div>


            {/* 6. Anteprima Output / Ausgabevorschau collapsible section */}
            <div className="bg-white border border-[#E0E0E0] rounded-xl shadow-sm overflow-hidden" id="json-preview-card">
              <button 
                onClick={() => setIsPreviewExpanded(!isPreviewExpanded)}
                className="w-full px-6 py-4 flex justify-between items-center bg-[#F8F9FA] border-b border-gray-100 hover:bg-gray-50 transition-colors cursor-pointer text-left"
              >
                <div className="flex items-center gap-2">
                  <FileText className="w-5 h-5 text-gray-400" />
                  <span className="font-bold text-sm tracking-wide text-[#1C2B3A] uppercase">
                    {t('sectionOutputPreview')}
                  </span>
                </div>
                {isPreviewExpanded ? <ChevronUp className="w-4 h-4 text-gray-500" /> : <ChevronDown className="w-4 h-4 text-gray-500" />}
              </button>

              {isPreviewExpanded && (
                <div className="p-6 space-y-4">
                  <div className="bg-[#0A121C] text-[#E2E8F0] border border-gray-800 rounded-lg p-5 shadow-inner relative">
                    <span className="absolute top-2 right-2 text-[9px] uppercase font-mono font-bold font-semibold tracking-wider text-gray-500 border border-gray-800 px-1.5 py-0.25 bg-[#0F1A24] rounded-md select-none">
                      json formatting output
                    </span>
                    <pre className="font-mono text-[10.5px] leading-relaxed overflow-x-auto select-all p-1 h-72">
                      {outputJson}
                    </pre>
                  </div>
                  
                  {/* JSON & CSV download manual links nested */}
                  <div className="flex justify-end gap-3 text-xs font-bold uppercase tracking-wider">
                    <button 
                      onClick={handleExportJSON}
                      disabled={exportDisabled}
                      className={`py-2 px-4 rounded border font-mono shadow-sm flex items-center gap-1.5 cursor-pointer select-none transition-all ${exportDisabled ? 'bg-gray-100 border-gray-250 text-gray-400 cursor-not-allowed shadow-none' : 'bg-white border-gray-300 hover:bg-gray-50 text-gray-700 active:scale-95'}`}
                    >
                      <Download className="w-4 h-4" />
                      <span>Scarica formato JSON</span>
                    </button>
                    <button 
                      onClick={handleExportCSV}
                      disabled={exportDisabled}
                      className={`py-2 px-4 rounded border font-mono shadow-sm flex items-center gap-1.5 cursor-pointer select-none transition-all ${exportDisabled ? 'bg-gray-100 border-gray-250 text-gray-400 cursor-not-allowed shadow-none' : 'bg-white border-gray-300 hover:bg-gray-50 text-gray-700 active:scale-95'}`}
                    >
                      <Download className="w-4 h-4" />
                      <span>Scarica formato CSV</span>
                    </button>
                  </div>
                </div>
              )}
            </div>


            {/* 7. Riepilogo Ordine / Bestellübersicht statistics card */}
            <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-md" id="summary-horizontal-card">
              <span className="text-[10px] font-sans font-bold tracking-wider text-gray-400 block mb-5 uppercase">
                {t('sectionOrderSummary')}
              </span>
              
              {/* Horizontal KPI blocks each in its own styled container cell */}
              <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                
                {/* 1. Totale */}
                <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 text-center shadow-inner flex flex-col justify-center items-center">
                  <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wide block">{t('summaryTotalLines')}</span>
                  <span className="text-2xl font-black text-[#1C2B3A] mt-1 block font-mono">{totalRowsCount}</span>
                </div>

                {/* 2. Confermate */}
                <div className="bg-[#E8F5E9] border border-[#C8E6C9] rounded-lg p-4 text-center flex flex-col justify-center items-center">
                  <span className="text-[10px] font-bold text-[#2E7D32] uppercase tracking-wide block">{t('summaryConfirmed')}</span>
                  <span className="text-2xl font-black text-[#2E7D32] mt-1 block font-mono">{confirmedRowsCount}</span>
                </div>

                {/* 3. Modificate/Edited count logs */}
                <div className="bg-gray-50 border border-gray-205 rounded-lg p-4 text-center flex flex-col justify-center items-center">
                  <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wide block">{t('summaryModified')}</span>
                  <span className="text-2xl font-black text-[#1C2B3A] mt-1 block font-mono">
                    {orderLines.filter(l => l.status === 'confirmed' && l.uncertain === false && MOCK_ORDER_LINES.find(o => o.id === l.id)?.matchedSku !== l.matchedSku).length}
                  </span>
                </div>

                {/* 4. Rifiutate */}
                <div className="bg-[#FFEBEE] border border-[#FFCDD2] rounded-lg p-4 text-center flex flex-col justify-center items-center">
                  <span className="text-[10px] font-bold text-[#C62828] uppercase tracking-wide block">{t('summaryRejected')}</span>
                  <span className="text-2xl font-black text-[#C62828] mt-1 block font-mono">{rejectedRowsCount}</span>
                </div>

                {/* 5. Da Risolvere (Highlights in red when >0, grey when 0) */}
                <div className={`border rounded-lg p-4 text-center flex flex-col justify-center items-center ${daRisolvereCount > 0 ? 'bg-[#FFEBEE] border-[#FFCDD2] text-[#C62828]' : 'bg-gray-50 border-gray-200 text-gray-400'}`}>
                  <span className="text-[10px] font-bold uppercase tracking-wide block">{t('summaryUnresolved')}</span>
                  <span className="text-2xl font-black mt-1 block font-mono">{daRisolvereCount}</span>
                </div>

              </div>
            </div>


            {/* 8. Conferma Ordine Button bottom triggers success */}
            <div className="flex flex-col items-center gap-2 pt-4">
              <button 
                onClick={handleFinalConfirmOrder}
                disabled={exportDisabled}
                className={`w-full max-w-md py-4 rounded-xl shadow-lg border-0 text-sm font-bold tracking-widest font-mono uppercase text-white transition-all duration-200 ${exportDisabled ? 'bg-gray-300 text-gray-500 cursor-not-allowed shadow-none' : 'bg-gradient-to-r from-[#1C2B3A] to-[#2C4A6E] hover:opacity-95 active:scale-95 cursor-pointer'}`}
              >
                {t('finalConfirmButton')}
              </button>
              
              {exportDisabled && (
                <span className="text-[11px] font-bold text-[#C62828] tracking-wide flex items-center gap-1">
                  <AlertCircle className="w-4 h-4 text-[#C62828]" />
                  <span>{t('exportBlockedNotice')}</span>
                </span>
              )}
            </div>

          </div>
        )}


        {/* ==================== PAGE 3: ORDINE CONFERMATO ==================== */}
        {currentPage === 3 && (
          <div className="max-w-2xl mx-auto py-12 space-y-8 text-center animate-fade-in" id="page-3-container">
            
            {/* Green Success checkmark sign */}
            <div className="flex justify-center">
              <div className="w-20 h-20 rounded-full bg-[#E8F5E9] border-4 border-[#C8E6C9] flex items-center justify-center text-[#2E7D32] shadow-sm animate-scale-up">
                <Check className="w-10 h-10 stroke-[3]" />
              </div>
            </div>

            {/* Document Success text block */}
            <div className="space-y-2">
              <h2 className="text-2xl font-sans font-black tracking-tight text-[#1C2B3A]">
                {t('page3Title')}
              </h2>
              <p className="text-xs text-gray-500 max-w-md mx-auto">
                {t('page3Subtitle')}
              </p>
            </div>

            {/* Structured ERP Receipt Card */}
            <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-md text-left text-xs max-w-md mx-auto" id="final-erp-receipt">
              <div className="text-[10px] font-mono font-bold text-gray-400 border-b border-gray-150 pb-2 mb-4 uppercase tracking-widest text-center">
                {t('transmissionSummary')}
              </div>

              <div className="space-y-4 font-sans text-gray-700">
                
                <div className="flex justify-between items-center bg-gray-50 p-2 rounded">
                  <span className="font-semibold text-gray-500 uppercase text-[10px]">{t('customerCodeLabel')}</span>
                  <span className="bg-white border border-gray-300 font-mono font-bold text-[#1C2B3A] px-2 py-0.5 rounded text-xs select-all">
                    {customerCode || "C-2026"}
                  </span>
                </div>

                <div className="flex justify-between items-center p-2 rounded">
                  <span className="font-semibold text-gray-500 uppercase text-[10px]">{t('orderReferenceLabel')}</span>
                  <span className="font-mono text-gray-900 font-bold">
                    {orderReference || "N/D"}
                  </span>
                </div>

                <div className="flex justify-between items-center bg-gray-50 p-2 rounded">
                  <span className="font-semibold text-gray-500 uppercase text-[10px]">DATA ELABORAZIONE</span>
                  <span className="font-mono text-gray-900 font-semibold">
                    {orderDate}
                  </span>
                </div>

                <div className="flex justify-between items-center p-2 rounded">
                  <span className="font-semibold text-gray-500 uppercase text-[10px]">RIGHE TRASMESSE</span>
                  <span className="bg-[#E8F5E9] text-[#2E7D32] border border-[#C8E6C9] font-mono text-[11px] font-bold px-2 py-0.5 rounded-full">
                    {confirmedRowsCount} / {totalRowsCount} righe
                  </span>
                </div>

              </div>

              <div className="h-px bg-gray-150 my-4" />

              <div className="bg-[#F8F9FA] rounded-lg p-3 text-[10px] font-mono flex justify-between items-center border border-gray-200">
                <div>
                  <span className="text-gray-400 font-bold block uppercase">{t('erpTransactionId')}</span>
                  <span className="text-gray-700 font-black tracking-wider block mt-0.5">FOPPA-40963</span>
                </div>
                <div className="text-right">
                  <span className="text-gray-400 font-bold block uppercase">{t('statusLabel')}</span>
                  <span className="text-[#2E7D32] font-black block mt-0.5 leading-none">● {t('syncedLabel')}</span>
                </div>
              </div>
            </div>

            {/* Back Button Returns to Page 1 */}
            <div className="pt-4 flex justify-center">
              <button 
                onClick={() => {
                  // Reset states and exit
                  setUploadedPhoto(null);
                  setUploadedAudio(null);
                  setTextPaste('');
                  setCustomerCode('');
                  setOrderReference('');
                  setCurrentPage(1);
                }}
                className="bg-[#2E7D32] hover:bg-opacity-95 text-white font-mono text-xs font-bold py-3.5 px-10 rounded-xl shadow-md cursor-pointer transition-colors active:scale-95 flex items-center gap-2 uppercase tracking-widest bg-gradient-to-r from-[#2E7D32] to-[#1B5E20]"
              >
                <span>{t('page3NewOrderBtn')}</span>
                <ArrowRight className="w-4 h-4 text-white" />
              </button>
            </div>

          </div>
        )}

      </main>

    </div>
  );
}
