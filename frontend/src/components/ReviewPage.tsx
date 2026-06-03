import React, { useState } from 'react';
import {
  Check,
  Edit,
  Trash2,
  ChevronDown,
  ChevronUp,
  FileText,
  AlertTriangle,
  Code,
  ArrowRight,
  ArrowLeft,
  Info,
  X,
  Languages
} from 'lucide-react';
import { Language, OrderLine, ExtractionNote, ValidationSheet } from '../types';
import { translations } from '../translations';
import { motion, AnimatePresence } from 'motion/react';

interface ReviewPageProps {
  currentLang: Language;
  onConfirmOrder: (
    summaryData: {
      customerCode: string;
      orderReference: string;
      date: string;
      confirmedCount: number;
      totalCount: number;
    },
    finalLines: OrderLine[]
  ) => void;
  onBackToUpload: () => void;
  metadata: {
    customerCode: string;
    orderReference: string;
    date: string;
    inputType: 'IMAGINE' | 'VOCALE' | 'TESTO';
    filename: string;
  };
  initialLines: OrderLine[];
  initialNotes: ExtractionNote[];
  logistics: { it: string; de: string };
  rawText: string;
}

export default function ReviewPage({
  currentLang,
  onConfirmOrder,
  onBackToUpload,
  metadata,
  initialLines,
  initialNotes,
  logistics,
  rawText
}: ReviewPageProps) {
  const t = translations[currentLang];

  // Load state
  const [lines, setLines] = useState<OrderLine[]>(initialLines);
  const [editingLineId, setEditingLineId] = useState<number | null>(null);

  // Expanded/collapsed sections
  const [isExtractionNotesOpen, setIsExtractionNotesOpen] = useState(true);
  const [isOutputPreviewOpen, setIsOutputPreviewOpen] = useState(true);

  // Inline Editorial Form fields
  const [editProductDesc, setEditProductDesc] = useState('');
  const [editQty, setEditQty] = useState('');
  const [editUnit, setEditUnit] = useState('');
  const [editLineLang, setEditLineLang] = useState<'DE' | 'IT' | 'Mix'>('DE');
  const [editMatchedSku, setEditMatchedSku] = useState('');

  // Operator Feedback Logs State (Simulated Backend Feedback Capture endpoint)
  interface FeedbackEntry {
    id: string;
    timestamp: string;
    originalText: string;
    suggestedSku: string;
    selectedSku: string;
    customerCode: string;
    action: 'CONFIRM' | 'MODIFY' | 'REJECT';
  }
  const [feedbackLogs, setFeedbackLogs] = useState<FeedbackEntry[]>([]);

  // Capture Operator Feedback and log it
  const addFeedback = (
    originalText: string,
    suggestedSku: string,
    selectedSku: string,
    action: 'CONFIRM' | 'MODIFY' | 'REJECT'
  ) => {
    const newEntry: FeedbackEntry = {
      id: Math.random().toString(36).substring(2, 9).toUpperCase(),
      timestamp: new Date().toISOString(),
      originalText,
      suggestedSku: suggestedSku || 'N/A',
      selectedSku: selectedSku || 'N/A',
      customerCode: metadata.customerCode || '1204',
      action
    };
    setFeedbackLogs((prev) => [newEntry, ...prev]);
  };

  // Compute number of uncertainty lines dynamically
  // Uncertainty = lines with status 'to_complete', 'pending', or 'unreadable'
  const uncertainLinesCount = lines.filter(
    (l) => l.status === 'to_complete' || l.status === 'pending' || l.status === 'unreadable'
  ).length;

  // Render Status Badge
  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'confirmed':
        return (
          <div className="flex items-center space-x-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-[#2E7D32]" />
            <span className="text-[13px] font-medium text-[#2E7D32]">{t.statusConfirmed}</span>
          </div>
        );
      case 'in_progress':
        return (
          <div className="flex items-center space-x-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-[#1565C0]" />
            <span className="text-[13px] font-medium text-[#1565C0]">{t.statusInProgress}</span>
          </div>
        );
      case 'pending':
        return (
          <div className="flex items-center space-x-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-[#F57C00]" />
            <span className="text-[13px] font-medium text-[#F57C00]">{t.statusPending}</span>
          </div>
        );
      case 'to_complete':
        return (
          <div className="flex items-center space-x-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-[#EF6C00]" />
            <span className="text-[13px] font-medium text-[#EF6C00]">{t.statusToComplete}</span>
          </div>
        );
      case 'unreadable':
        return (
          <div className="flex items-center space-x-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-[#C62828]" />
            <span className="text-[13px] font-medium text-[#C62828]">{t.statusUnreadable}</span>
          </div>
        );
      default:
        return null;
    }
  };

  // Dynamic Confidence Label logic based on prompt requirements
  const getConfidenceLabel = (confidence: number) => {
    if (confidence >= 0.95) return 'High Confidence';
    if (confidence >= 0.80) return 'Review Recommended';
    return 'Human Validation Required';
  };

  const getConfidenceBadge = (confidence: number) => {
    const label = getConfidenceLabel(confidence);
    switch (label) {
      case 'High Confidence':
        return (
          <span className="inline-flex items-center space-x-1 bg-[#E8F5E9] text-[#2E7D32] text-[10px] font-bold px-2 py-0.5 rounded-[4px] border border-[#A5D6A7] tracking-wider uppercase">
            <Check size={10} strokeWidth={3} />
            <span>{t.confHigh}</span>
          </span>
        );
      case 'Review Recommended':
        return (
          <span className="inline-flex items-center space-x-1 bg-[#FFF8E1] text-[#F57C00] text-[10px] font-bold px-2 py-0.5 rounded-[4px] border border-[#FFE082] tracking-wider uppercase animate-pulse">
            <AlertTriangle size={10} strokeWidth={2.5} />
            <span>{t.confReview}</span>
          </span>
        );
      case 'Human Validation Required':
        return (
          <span className="inline-flex items-center space-x-1 bg-red-50 text-[#C62828] text-[10px] font-bold px-2 py-0.5 rounded-[4px] border border-[#FFCDD2] tracking-wider uppercase">
            <AlertTriangle size={10} strokeWidth={2.5} className="animate-bounce" />
            <span>{t.confRequired}</span>
          </span>
        );
      default:
        return null;
    }
  };

  // Border colored by Confidence
  const getBorderColorByConfidence = (confidence: number) => {
    if (confidence >= 0.95) return 'border-l-[3px] border-l-[#2E7D32]';
    if (confidence >= 0.85) return 'border-l-[3px] border-l-[#F57C00]';
    return 'border-l-[3px] border-l-[#C62828]';
  };

  // Actions
  const handleConfirmRow = (id: number) => {
    setLines(
      lines.map((l) => {
        if (l.id === id) {
          addFeedback(
            l.originalText,
            l.initialMatchedSku || l.matchedSku || '',
            l.matchedSku || '',
            'CONFIRM'
          );
          return { ...l, status: 'confirmed', confidence: 1.0 };
        }
        return l;
      })
    );
  };

  const handleRejectRow = (id: number) => {
    setLines(
      lines.map((l) => {
        if (l.id === id) {
          addFeedback(
            l.originalText,
            l.initialMatchedSku || l.matchedSku || '',
            'REJECTED',
            'REJECT'
          );
          return { ...l, status: 'unreadable', confidence: 0.0 };
        }
        return l;
      })
    );
  };

  const handleSelectAlternative = (id: number, selectedSku: string) => {
    setLines(
      lines.map((l) => {
        if (l.id === id) {
          addFeedback(
            l.originalText,
            l.initialMatchedSku || l.matchedSku || '',
            selectedSku,
            'MODIFY'
          );
          return {
            ...l,
            matchedSku: selectedSku,
            status: 'confirmed',
            confidence: 1.0,
            modified: true
          };
        }
        return l;
      })
    );
  };

  const handleEditRowClick = (line: OrderLine) => {
    setEditingLineId(line.id);
    setEditProductDesc(currentLang === 'IT' ? line.itDescription : line.deDescription);
    setEditQty(line.qty);
    setEditUnit(line.unit);
    setEditLineLang(line.lang);
    setEditMatchedSku(line.matchedSku || '');
  };

  const handleSaveInlineEdit = (id: number) => {
    setLines(
      lines.map((l) => {
        if (l.id === id) {
          addFeedback(
            l.originalText,
            l.initialMatchedSku || l.matchedSku || '',
            editMatchedSku,
            'MODIFY'
          );
          return {
            ...l,
            itDescription: currentLang === 'IT' ? editProductDesc : l.itDescription,
            deDescription: currentLang === 'DE' ? editProductDesc : l.deDescription,
            qty: editQty,
            unit: editUnit,
            lang: editLineLang,
            matchedSku: editMatchedSku,
            status: 'confirmed',
            confidence: 1.0, // User corrected
            modified: true
          };
        }
        return l;
      })
    );
    setEditingLineId(null);
  };

  const handleConfirmAll = () => {
    setLines(
      lines.map((l) => {
        if (l.status !== 'confirmed') {
          addFeedback(
            l.originalText,
            l.initialMatchedSku || l.matchedSku || '',
            l.matchedSku || '',
            'CONFIRM'
          );
        }
        return {
          ...l,
          status: 'confirmed',
          confidence: l.confidence < 0.95 ? 0.95 : l.confidence
        };
      })
    );
  };

  const handleReset = () => {
    setLines(initialLines);
    setEditingLineId(null);
  };

  // Compute unresolved "Human Validation Required" count to drive lock rules
  const unresolvedValidationRequiredCount = lines.filter((l) => {
    const label = getConfidenceLabel(l.confidence);
    const isCritical = label === 'Human Validation Required';
    const isUnresolved = l.status !== 'confirmed' && l.status !== 'unreadable';
    return isCritical && isUnresolved;
  }).length;

  const isExportDisabled = unresolvedValidationRequiredCount > 0;

  const handleExportJson = () => {
    if (isExportDisabled) return;
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(generateJsonOutput(), null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute("href", dataStr);
    downloadAnchor.setAttribute("download", `foppa_intake_${metadata.orderReference || 'order'}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  const handleExportCsv = () => {
    if (isExportDisabled) return;
    let csvContent = "data:text/csv;charset=utf-8,\uFEFF";
    csvContent += "#,Original Text,Product Description,SKU,Qty,Unit,Lang,Status,Confidence\n";
    lines.forEach((l) => {
      const desc = currentLang === 'IT' ? l.itDescription : l.deDescription;
      const sku = l.matchedSku || '';
      const row = `"${l.id}","${l.originalText.replace(/"/g, '""')}","${desc.replace(/"/g, '""')}","${sku.replace(/"/g, '""')}","${l.qty}","${l.unit}","${l.lang}","${l.status}","${l.confidence}"`;
      csvContent += row + "\n";
    });
    const encodedUri = encodeURI(csvContent);
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute("href", encodedUri);
    downloadAnchor.setAttribute("download", `foppa_intake_${metadata.orderReference || 'order'}.csv`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  // JSON Live Output generator
  const generateJsonOutput = () => {
    return {
      customer_code: metadata.customerCode || "1204",
      order_reference: metadata.orderReference || "FORN-2026-031",
      date: metadata.date || "2026-05-27",
      input_source: {
        type: metadata.inputType,
        filename: metadata.filename
      },
      detected_language: currentLang === 'IT' ? 'Misto' : 'Gemischt',
      total_items_count: lines.length,
      uncertain_lines_count: uncertainLinesCount,
      unresolved_critical_validations: unresolvedValidationRequiredCount,
      order_items: lines.map((l) => ({
        index: l.id,
        original_text: l.originalText,
        product_description: currentLang === 'IT' ? l.itDescription : l.deDescription,
        matched_sku: l.matchedSku || null,
        qty: l.qty === '–' ? null : l.qty,
        unit: l.unit === '–' ? null : l.unit,
        line_language: l.lang,
        confidence_score: l.confidence,
        confidence_label: getConfidenceLabel(l.confidence),
        status: l.status,
        modified: !!l.modified
      }))
    };
  };

  const confirmedCount = lines.filter((l) => l.status === 'confirmed').length;

  return (
    <div id="review-container" className="pb-16 font-sans">
      
      {/* Pipeline Banner - Full width row perfectly styled */}
      <div id="pipeline-banner" className="bg-[#E0E0E0]/30 border-b border-[#E0E0E0] py-3.5 px-6 select-none">
        <div className="max-w-[1400px] mx-auto flex items-center space-x-3 text-xs font-semibold text-[#1C2B3A]">
          <span className="text-[#9E9E9E]">{t.pipelineUpload}</span>
          <span className="text-[#9E9E9E]">→</span>
          <span className="text-[#9E9E9E]">{t.pipelineExtraction}</span>
          <span className="text-[#9E9E9E]">→</span>
          <span className="bg-[#1565C0] text-white px-3 py-1.5 rounded-[4px] font-bold">
            {t.pipelineHumanReview}
          </span>
          <span className="text-[#9E9E9E]">→</span>
          <span className="text-[#9E9E9E]">{t.pipelineConfirmed}</span>
        </div>
      </div>

      <div className="max-w-[1400px] mx-auto px-6 pt-8 space-y-8">
        
        {/* Title */}
        <h2 className="text-[28px] font-bold text-[#1C2B3A] leading-tight">
          {t.page2Title}
        </h2>

        {/* Section 1: Validation Card */}
        <div id="section-validation" className="bg-white border border-[#E0E0E0] rounded-[8px] p-5 shadow-sm">
          <p className="text-[11px] font-bold text-[#1565C0] tracking-wider uppercase mb-4">
            {t.validationCardTitle}
          </p>
          <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-4">
            
            {/* Customer Code */}
            <div className="border-r border-stone-100 last:border-0 pr-2">
              <span className="text-[10px] uppercase text-[#9E9E9E] font-bold block mb-1">
                {t.validationCustomerCode}
              </span>
              <span className="text-[13px] font-bold text-[#1C2B3A]">
                {metadata.customerCode || '1204'}
              </span>
            </div>

            {/* Order Reference */}
            <div className="border-r border-stone-100 last:border-0 pr-2">
              <span className="text-[10px] uppercase text-[#9E9E9E] font-bold block mb-1">
                {t.validationOrderRef}
              </span>
              <span className="text-[13px] font-bold text-[#1C2B3A] font-mono">
                {metadata.orderReference || 'FORN-2026-031'}
              </span>
            </div>

            {/* Date */}
            <div className="border-r border-stone-100 last:border-0 pr-2">
              <span className="text-[10px] uppercase text-[#9E9E9E] font-bold block mb-1">
                {t.validationDate}
              </span>
              <span className="text-[13px] font-bold text-[#1C2B3A]">
                {metadata.date}
              </span>
            </div>

            {/* Input Type */}
            <div className="border-r border-stone-100 last:border-0 pr-2">
              <span className="text-[10px] uppercase text-[#9E9E9E] font-bold block mb-1">
                {t.validationInputType}
              </span>
              <span className="text-[13px] font-bold text-[#1C2B3A] space-x-1">
                <span className="bg-slate-100 px-2.5 py-0.5 rounded text-[11px] font-bold text-slate-800 tracking-wide">
                  {currentLang === 'IT' ? metadata.inputType : (metadata.inputType === 'IMAGINE' ? 'BILD' : (metadata.inputType === 'VOCALE' ? 'AUDIO' : 'TEXT'))}
                </span>
              </span>
            </div>

            {/* Filename */}
            <div className="border-r border-stone-100 last:border-0 pr-2">
              <span className="text-[10px] uppercase text-[#9E9E9E] font-bold block mb-1">
                {t.validationFilename}
              </span>
              <span className="text-[13px] font-medium text-stone-600 font-mono block truncate" title={metadata.filename}>
                {metadata.filename}
              </span>
            </div>

            {/* Language Detected */}
            <div className="border-r border-stone-100 last:border-0 pr-2">
              <span className="text-[10px] uppercase text-[#9E9E9E] font-bold block mb-1">
                {t.validationLanguage}
              </span>
              <span className="text-[13px] font-bold text-[#1C2B3A]">
                {currentLang === 'IT' ? 'Misto' : 'Gemischt'}
              </span>
            </div>

            {/* Lines with Uncertainty */}
            <div>
              <span className="text-[10px] uppercase text-[#9E9E9E] font-semibold block mb-1">
                {t.validationUncertainLines}
              </span>
              <div className="flex items-center">
                <span className="w-7 h-7 rounded-full bg-[#F57C00] text-white flex items-center justify-center font-bold text-xs shadow-sm">
                  {uncertainLinesCount}
                </span>
              </div>
            </div>

          </div>
        </div>

        {/* Section 2: Detected Order */}
        <div id="section-detected-raw" className="bg-white border border-[#E0E0E0] rounded-[8px] p-6 shadow-sm">
          <p className="text-[11px] font-bold text-[#1565C0] tracking-wider uppercase mb-3">
            {t.detectedOrderTitle}
          </p>
          <div className="border border-[#E0E0E0] rounded-[6px] bg-[#FAF9F5] p-6 shadow-inner font-mono text-xs leading-relaxed text-[#1C2B3A]">
            <p className="text-[#9E9E9E] text-[10px] font-bold tracking-wider mb-3 select-none">
              {t.detectedOrderOriginalText.toUpperCase()}
            </p>
            <pre className="whitespace-pre-wrap select-text font-mono">
              {rawText}
            </pre>
          </div>
        </div>

        {/* Section 3: Order Lines Table */}
        <div id="section-extracted-table" className="bg-white border border-[#E0E0E0] rounded-[8px] overflow-hidden shadow-sm">
          
          {/* Header Row */}
          <div className="bg-[#F8F9FA] border-b border-[#E0E0E0] px-6 py-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 select-none">
            <span className="text-[14px] font-bold text-[#1C2B3A]">
              {t.orderLinesTableTitle} ({lines.length})
            </span>

            {/* Action Buttons */}
            <div className="flex flex-wrap gap-2">
              <button
                id="btn-confirm-all"
                onClick={handleConfirmAll}
                className="bg-[#1565C0] hover:bg-[#0D47A1] text-white px-4 py-2 rounded-[4px] text-xs font-bold uppercase tracking-wider transition-all duration-150 shadow-sm"
              >
                {t.btnConfirmAll}
              </button>
              <button
                id="btn-export-json"
                disabled={isExportDisabled}
                onClick={handleExportJson}
                className={`border px-4 py-2 rounded-[4px] text-xs font-semibold whitespace-nowrap transition-all duration-150 ${
                  isExportDisabled 
                    ? 'bg-stone-100 text-stone-400 border-stone-200 cursor-not-allowed opacity-60' 
                    : 'bg-white hover:bg-stone-50 border-[#E0E0E0] text-[#1C2B3A] cursor-pointer'
                }`}
                title={isExportDisabled ? "Risolvere le righe ad errore critico per sbloccare l'esportazione." : "Esporta in formato JSON"}
              >
                {t.btnExportJson}
              </button>
              <button
                id="btn-export-csv"
                disabled={isExportDisabled}
                onClick={handleExportCsv}
                className={`border px-4 py-2 rounded-[4px] text-xs font-semibold whitespace-nowrap transition-all duration-150 ${
                  isExportDisabled 
                    ? 'bg-stone-100 text-stone-400 border-stone-200 cursor-not-allowed opacity-60' 
                    : 'bg-white hover:bg-stone-50 border-[#E0E0E0] text-[#1C2B3A] cursor-pointer'
                }`}
                title={isExportDisabled ? "Risolvere le righe ad errore critico per sbloccare l'esportazione." : "Esporta in formato CSV"}
              >
                {t.btnExportCsv}
              </button>
              <button
                id="btn-table-reset"
                onClick={handleReset}
                className="border border-[#E0E0E0] hover:bg-red-50 hover:text-[#C62828] text-stone-600 px-4 py-2 rounded-[4px] text-xs font-semibold whitespace-nowrap transition-all duration-150 animate-duration-500"
              >
                {t.btnReset}
              </button>
            </div>
          </div>

          {/* Table Element */}
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-[#1C2B3A] border-collapse">
              <thead>
                <tr className="bg-[#FAF9FA] border-b border-[#E0E0E0] text-[10px] text-[#9E9E9E] uppercase tracking-wider font-bold">
                  <th className="px-5 py-3.5 w-12">{t.colHash}</th>
                  <th className="px-5 py-3.5 md:w-[240px]">{t.colOriginalText}</th>
                  <th className="px-5 py-3.5">{t.colProductDescription}</th>
                  <th className="px-5 py-3.5 w-16">{t.colQty}</th>
                  <th className="px-5 py-3.5 w-20">{t.colUnit}</th>
                  <th className="px-5 py-3.5 w-16">{t.colLang}</th>
                  <th className="px-5 py-3.5 w-[190px]">{currentLang === 'IT' ? 'Stato e Confidenza' : 'Status & Konfidenz'}</th>
                  <th className="px-5 py-3.5 text-right md:w-[250px]">{t.colActions}</th>
                </tr>
              </thead>
              <tbody>
                {lines.map((line) => {
                  const isEditing = editingLineId === line.id;
                  const isUnreadable = line.status === 'unreadable';

                  return (
                    <React.Fragment key={line.id}>
                      {/* Standard Table Row with left border colored by confidence score */}
                      <tr
                        className={`border-b border-[#E0E0E0] hover:bg-stone-50/50 transition-colors duration-150 relative ${getBorderColorByConfidence(
                          line.confidence
                        )} ${isEditing ? 'bg-stone-50/70' : ''}`}
                      >
                        {/* Num */}
                        <td className="px-5 py-4 font-bold text-[#9E9E9E]">
                          {line.id}
                        </td>

                        {/* Original Text */}
                        <td className={`px-5 py-4 font-mono font-medium text-stone-600 leading-normal ${isUnreadable ? 'line-through decoration-[#C62828]/50' : 'italic'}`}>
                          {line.originalText}
                        </td>

                        {/* Product Description column loaded with product details and SKU information */}
                        <td className="px-5 py-4 font-semibold text-[13px] text-[#1C2B3A] space-y-2">
                          <div className="text-[13px] font-semibold text-[#1C2B3A]">
                            {currentLang === 'IT' ? line.itDescription : line.deDescription}
                          </div>

                          {/* SKU matched tag */}
                          <div className="mt-2 flex flex-wrap items-center gap-1.5 md:gap-2">
                            <span className="text-[10px] uppercase text-[#9E9E9E] font-bold tracking-wider">SKU:</span>
                            <span className="bg-[#FAF5ED] text-[#5C4033] text-[11px] font-mono font-bold px-2 py-0.5 rounded-[4px] border border-[#E9DFCF] shadow-sm inline-flex items-center">
                              {line.matchedSku || '---'}
                            </span>
                            {line.modified && (
                              <span className="bg-blue-50 text-[#1565C0] text-[9px] font-extrabold px-1.5 py-0.5 rounded uppercase tracking-wider border border-blue-200">
                                {currentLang === 'IT' ? 'Modificato' : 'Geändert'}
                              </span>
                            )}
                          </div>

                          {/* Alternatives clickable array */}
                          {line.alternativeSkus && line.alternativeSkus.length > 0 && line.status !== 'confirmed' && (
                            <div className="pt-2 border-t border-dashed border-stone-200 mt-2">
                              <p className="text-[10px] text-[#9E9E9E] font-extrabold uppercase tracking-wide mb-1">
                                {currentLang === 'IT' ? 'SKU Alternativi suggeriti (Clicca per correggere):' : 'Alternative SKU-Zuweisungen (Klicken zum Ändern):'}
                              </p>
                              <div className="flex flex-wrap gap-1">
                                {line.alternativeSkus.map((alt) => (
                                  <button
                                    key={alt}
                                    onClick={() => handleSelectAlternative(line.id, alt)}
                                    className="bg-stone-50 hover:bg-blue-50 hover:text-[#1565C0] border border-stone-200 hover:border-blue-300 text-stone-600 text-[10px] font-bold px-2.5 py-1 rounded transition duration-150 cursor-pointer max-w-[280px] truncate"
                                    title={alt}
                                  >
                                    {alt}
                                  </button>
                                ))}
                              </div>
                            </div>
                          )}
                        </td>

                        {/* Qty */}
                        <td className={`px-5 py-4 text-[13px] ${line.qty === '–' ? 'text-[#9E9E9E] font-normal' : 'font-bold text-[#1C2B3A]'}`}>
                          {line.qty}
                        </td>

                        {/* Unit */}
                        <td className={`px-5 py-4 font-mono ${line.unit === '–' ? 'text-[#9E9E9E] italic' : 'text-[#1C2B3A]'}`}>
                          {line.unit}
                        </td>

                        {/* Lang badge */}
                        <td className="px-5 py-4">
                          <span className="bg-stone-100 text-[10px] font-bold text-[#1C2B3A] px-1.5 py-0.5 rounded shadow-sm border border-stone-200">
                            {line.lang}
                          </span>
                        </td>

                        {/* Status Label with confidence label */}
                        <td className="px-5 py-4">
                          <div className="flex flex-col space-y-1.5 align-middle">
                            {getStatusBadge(line.status)}
                            {getConfidenceBadge(line.confidence)}
                          </div>
                        </td>

                        {/* Row Actions */}
                        <td className="px-5 py-4 text-right space-x-1 whitespace-nowrap">
                          {line.status !== 'confirmed' && (
                            <button
                              onClick={() => handleConfirmRow(line.id)}
                              className="text-stone-700 hover:text-[#2E7D32] border border-[#E0E0E0] bg-white hover:bg-green-50 px-2.5 py-1.5 rounded text-[11px] font-bold transition-all duration-150 shadow-sm"
                            >
                              {currentLang === 'IT' ? 'Conferma' : 'Bestätigen'}
                            </button>
                          )}
                          <button
                            onClick={() => handleEditRowClick(line)}
                            className="text-stone-700 hover:text-[#1565C0] border border-[#E0E0E0] bg-white hover:bg-blue-50 px-2.5 py-1.5 rounded text-[11px] font-bold transition-all duration-150 shadow-sm inline-flex items-center space-x-1"
                          >
                            <Edit size={11} />
                            <span>{currentLang === 'IT' ? 'Modifica' : 'Bearbeiten'}</span>
                          </button>
                          {line.status !== 'unreadable' && (
                            <button
                              onClick={() => handleRejectRow(line.id)}
                              className="text-stone-700 hover:text-[#C62828] border border-[#E0E0E0] bg-white hover:bg-red-50 px-2.5 py-1.5 rounded text-[11px] font-bold transition-all duration-150 shadow-sm inline-flex items-center space-x-1"
                            >
                              <span>{currentLang === 'IT' ? 'Rifiuta' : 'Ablehnen'}</span>
                            </button>
                          )}
                        </td>
                      </tr>

                      {/* Editorial Inline Panel Expanded immediately below */}
                      {isEditing && (
                        <tr>
                          <td colSpan={8} className="px-5 py-5 bg-[#FAF9FB] border-b border-[#E0E0E0]">
                            <div className="border border-[#1565C0] rounded-[8px] bg-white p-5 space-y-4 shadow-sm relative">
                              
                              <button
                                onClick={() => setEditingLineId(null)}
                                className="absolute top-4 right-4 text-[#9E9E9E] hover:text-[#1C2B3A] transition-all duration-150"
                              >
                                <X size={18} />
                              </button>

                              {/* Form Header */}
                              <p className="text-[11px] font-bold text-[#1565C0] tracking-wider uppercase">
                                {t.editPanelHeader} — {line.originalText.toUpperCase()}
                              </p>

                              {/* Main inputs row */}
                              <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
                                
                                {/* Product Description field (very wide) */}
                                <div className="md:col-span-6 space-y-3">
                                  <div>
                                    <label className="text-[10px] font-bold text-[#1C2B3A] tracking-wider block mb-1">
                                      {t.editFieldDescription}
                                    </label>
                                    <input
                                      type="text"
                                      value={editProductDesc}
                                      onChange={(e) => setEditProductDesc(e.target.value)}
                                      className="w-full bg-white border border-[#E0E0E0] rounded-[6px] px-3 py-2 text-xs font-semibold focus:outline-none focus:border-[#1565C0] text-[#1C2B3A]"
                                    />
                                  </div>

                                  {/* Matched SKU selector input & pills alternatives in edit panel */}
                                  <div className="space-y-1">
                                    <label className="text-[10px] font-bold text-[#1C2B3A] tracking-wider block">
                                      {currentLang === 'IT' ? 'SKU matched dell\'articolo:' : 'Zugeordnete Artikel-SKU:'}
                                    </label>
                                    <input
                                      type="text"
                                      value={editMatchedSku}
                                      onChange={(e) => setEditMatchedSku(e.target.value)}
                                      className="w-full bg-stone-50 border border-[#E0E0E0] font-mono font-bold text-[11px] rounded-[6px] px-3 py-2 text-[#1C2B3A] focus:outline-none focus:border-[#1565C0]"
                                      placeholder="es. KEP20 – Ketchup Portions"
                                    />

                                    {line.alternativeSkus && line.alternativeSkus.length > 0 && (
                                      <div className="pt-2">
                                        <span className="text-[10px] text-[#9E9E9E] font-bold block uppercase tracking-wide mb-1">
                                          {currentLang === 'IT' ? 'Sostituisci SKU con alternativa:' : 'Mit Alternativ-SKU ersetzen:'}
                                        </span>
                                        <div className="flex flex-wrap gap-1">
                                          {line.alternativeSkus.map((alt) => (
                                            <button
                                              key={alt}
                                              type="button"
                                              onClick={() => setEditMatchedSku(alt)}
                                              className={`px-2 py-1 rounded text-[10px] font-bold transition duration-150 border cursor-pointer ${
                                                editMatchedSku === alt
                                                  ? 'bg-[#1565C0] text-white border-[#1565C0]'
                                                  : 'bg-white text-stone-700 border-[#E0E0E0] hover:bg-stone-50'
                                              }`}
                                            >
                                              {alt.substring(0, 5)}...
                                            </button>
                                          ))}
                                        </div>
                                      </div>
                                    )}
                                  </div>

                                  {/* AI suggestions label and chips */}
                                  {line.suggestions && line.suggestions.length > 0 && (
                                    <div className="pt-1 space-y-1">
                                      <p className="text-[10px] font-bold text-[#1565C0] flex items-center space-x-1">
                                        <span>{t.btnSuggestions}</span>
                                      </p>
                                      <div className="flex flex-wrap gap-1.5 pt-0.5">
                                        {line.suggestions.map((sug, i) => (
                                          <button
                                            key={i}
                                            type="button"
                                            onClick={() => setEditProductDesc(sug)}
                                            className="bg-sky-50 text-blue-800 hover:bg-sky-100 border border-sky-200 rounded px-2.5 py-1 text-[11px] font-medium transition-all duration-150 cursor-pointer"
                                          >
                                            {sug}
                                          </button>
                                        ))}
                                      </div>
                                    </div>
                                  )}
                                </div>

                                {/* Qty */}
                                <div className="md:col-span-2 space-y-1.5">
                                  <label className="text-[10px] font-bold text-[#1C2B3A] tracking-wider block">
                                    {t.editFieldQty}
                                  </label>
                                  <input
                                    type="text"
                                    value={editQty}
                                    onChange={(e) => setEditQty(e.target.value)}
                                    className="w-full bg-white border border-[#E0E0E0] rounded-[6px] px-3 py-2 text-xs font-semibold focus:outline-none focus:border-[#1565C0] text-[#1C2B3A]"
                                  />
                                </div>

                                {/* Unit */}
                                <div className="md:col-span-2 space-y-1.5">
                                  <label className="text-[10px] font-bold text-[#1C2B3A] tracking-wider block">
                                    {t.editFieldUnit}
                                  </label>
                                  <input
                                    type="text"
                                    value={editUnit}
                                    onChange={(e) => setEditUnit(e.target.value)}
                                    className="w-full bg-white border border-[#E0E0E0] rounded-[6px] px-3 py-2 text-xs font-semibold focus:outline-none focus:border-[#1565C0] text-[#1C2B3A]"
                                  />
                                </div>

                                {/* Language buttons */}
                                <div className="md:col-span-2 space-y-1.5">
                                  <label className="text-[10px] font-bold text-[#1C2B3A] tracking-wider block">
                                    {t.editFieldLang}
                                  </label>
                                  <div className="flex space-x-1 bg-stone-100 p-0.5 rounded-[6px] border border-[#E0E0E0]">
                                    {(['IT', 'DE', 'Mix'] as const).map((langOpt) => (
                                      <button
                                        key={langOpt}
                                        onClick={() => setEditLineLang(langOpt)}
                                        className={`flex-grow py-1 rounded-[4px] text-[10px] font-bold uppercase transition-all duration-150 ${
                                          editLineLang === langOpt
                                            ? 'bg-[#1565C0] text-white shadow-sm'
                                            : 'text-stone-600 hover:bg-stone-200'
                                        }`}
                                      >
                                        {langOpt}
                                      </button>
                                    ))}
                                  </div>
                                </div>

                              </div>

                              {/* Save/Cancel Panel footer */}
                              <div className="flex justify-end space-x-2 pt-2">
                                <button
                                  onClick={() => setEditingLineId(null)}
                                  className="px-4 py-2 border border-[#E0E0E0] hover:bg-stone-50 text-stone-700 bg-white rounded-[4px] text-xs font-bold transition-all duration-150"
                                >
                                  {t.btnCancel}
                                </button>
                                <button
                                  onClick={() => handleSaveInlineEdit(line.id)}
                                  className="px-4 py-2 bg-[#1565C0] hover:bg-[#0D47A1] text-white rounded-[4px] text-xs font-bold transition-all duration-150 shadow-sm"
                                >
                                  {t.btnSave}
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

        {/* Order Validation Summary Card (Dashboard) */}
        <div id="order-validation-summary" className="bg-white border-2 border-stone-200 rounded-[8px] p-6 shadow-sm space-y-4">
          <div className="flex items-center justify-between border-b border-stone-100 pb-3">
            <div className="flex items-center space-x-2">
              <FileText size={18} className="text-[#1565C0]" />
              <h3 className="font-bold text-sm text-[#1C2B3A] uppercase tracking-wider">
                {currentLang === 'IT' ? 'Riepilogo Avanzamento Validazione Ordine' : 'Fortschrittsbericht Bestelldatenvalidierung'}
              </h3>
            </div>
            {unresolvedValidationRequiredCount > 0 ? (
              <span className="bg-red-50 text-[#C62828] text-[10px] font-bold px-3 py-1 rounded-full uppercase border border-[#FFCDD2] flex items-center space-x-1 animate-pulse">
                <AlertTriangle size={11} />
                <span>{currentLang === 'IT' ? 'Bloccato - Conconvalide pendenti' : 'Gesperrt - Kritische Prüfungen offen'}</span>
              </span>
            ) : (
              <span className="bg-[#E8F5E9] text-[#2E7D32] text-[10px] font-bold px-3 py-1 rounded-full uppercase border border-[#A5D6A7] flex items-center space-x-1">
                <Check size={11} />
                <span>{currentLang === 'IT' ? 'Sbloccato - Pronto per l\'ERP' : 'Freigegeben - Bereit für ERP'}</span>
              </span>
            )}
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
            {/* Righe Totali */}
            <div className="bg-[#F8F9FA] border border-[#E0E0E0] rounded-[6px] p-4 text-center">
              <span className="text-[10px] text-[#9E9E9E] font-bold uppercase block mb-1">
                {currentLang === 'IT' ? 'Righe Totali' : 'Gesamtzeilen'}
              </span>
              <span className="text-xl font-extrabold text-[#1C2B3A]">
                {lines.length}
              </span>
            </div>

            {/* Confermate */}
            <div className="bg-[#E8F5E9]/50 border border-[#A5D6A7]/50 rounded-[6px] p-4 text-center">
              <span className="text-[10px] text-[#2E7D32] font-bold uppercase block mb-1">
                {currentLang === 'IT' ? 'Confermate' : 'Bestätigt'}
              </span>
              <span className="text-xl font-extrabold text-[#2E7D32]">
                {lines.filter((l) => l.status === 'confirmed').length}
              </span>
            </div>

            {/* Modificate */}
            <div className="bg-[#E3F2FD]/50 border border-[#90CAF9]/50 rounded-[6px] p-4 text-center">
              <span className="text-[10px] text-[#1565C0] font-bold uppercase block mb-1">
                {currentLang === 'IT' ? 'Modificate' : 'Geändert'}
              </span>
              <span className="text-xl font-extrabold text-[#1565C0]">
                {lines.filter((l) => l.modified).length}
              </span>
            </div>

            {/* Rifiutate */}
            <div className="bg-stone-50 border border-[#E0E0E0] rounded-[6px] p-4 text-center">
              <span className="text-[10px] text-stone-600 font-bold uppercase block mb-1">
                {currentLang === 'IT' ? 'Rifiutate' : 'Verworfen'}
              </span>
              <span className="text-xl font-extrabold text-stone-600">
                {lines.filter((l) => l.status === 'unreadable').length}
              </span>
            </div>

            {/* Ancora da Risolvere */}
            <div className={`rounded-[6px] p-4 text-center border ${
              unresolvedValidationRequiredCount > 0 
                ? 'bg-red-50/50 border-[#FFCDD2]' 
                : 'bg-[#FFF8E1]/50 border-[#FFE082]'
            }`}>
              <span className={`text-[10px] font-bold uppercase block mb-1 ${
                unresolvedValidationRequiredCount > 0 ? 'text-[#C62828]' : 'text-[#F57C00]'
              }`}>
                {currentLang === 'IT' ? 'Convalide AI Pendenti' : 'Offene Validier.'}
              </span>
              <span className={`text-xl font-extrabold flex items-center justify-center space-x-1 ${
                unresolvedValidationRequiredCount > 0 ? 'text-[#C62828]' : 'text-[#F57C00]'
              }`}>
                <span>{unresolvedValidationRequiredCount}</span>
                <span className="text-[10px] font-medium text-stone-500 font-normal lowercase">
                  ({lines.filter((l) => l.status !== 'confirmed' && l.status !== 'unreadable').length} tot)
                </span>
              </span>
            </div>
          </div>

          {unresolvedValidationRequiredCount > 0 && (
            <div className="bg-red-50 text-[#C62828] text-xs font-semibold p-4 rounded-[6px] flex items-center space-x-2.5 border border-[#FFCDD2] select-none">
              <AlertTriangle size={15} className="flex-shrink-0 animate-bounce" />
              <p>
                {currentLang === 'IT' 
                  ? `ATTENZIONE: Le funzioni di esportazione commerciale JSON/CSV ed invio a gestore d'ordine rimangono inibiti fino alla definizione degli articoli categorizzati con stato "${t.confRequired}".`
                  : `ACHTUNG: Export- und ERP-Systemfunktionen sind inaktiviert, solange Positionen mit ungelöster "${t.confRequired}"-Markierung vorliegen.`}
              </p>
            </div>
          )}
        </div>

        {/* Section 4: Extraction Notes (Collapsible ACCORDION style) */}
        <div id="section-notes-accordion" className="bg-white border border-[#E0E0E0] rounded-[8px] overflow-hidden shadow-sm">
          <button
            onClick={() => setIsExtractionNotesOpen(!isExtractionNotesOpen)}
            className="w-full px-6 py-4 flex items-center justify-between bg-white hover:bg-stone-50 transition-colors duration-150 select-none text-left"
          >
            <span className="text-[14px] font-bold text-[#1C2B3A] tracking-tight uppercase flex items-center space-x-2">
              <span>{t.extractionNotesTitle} ({initialNotes.length})</span>
            </span>
            <div className="text-stone-500">
              {isExtractionNotesOpen ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
            </div>
          </button>
          
          <AnimatePresence initial={false}>
            {isExtractionNotesOpen && (
              <motion.div
                initial={{ height: 0 }}
                animate={{ height: 'auto' }}
                exit={{ height: 0 }}
                transition={{ duration: 0.15, ease: 'easeInOut' }}
                className="overflow-hidden"
              >
                <div className="p-6 border-t border-[#E0E0E0] space-y-6">
                  {/* Grid or flex note cards */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {initialNotes.map((note, idx) => {
                      const cardClass = note.uncertain
                        ? "bg-[#FFFDE7] border border-[#FFF59D] rounded-[8px] p-5 shadow-sm space-y-3"
                        : "bg-white border border-[#E0E0E0] rounded-[8px] p-5 shadow-sm space-y-3";
                      return (
                        <div key={idx} className={cardClass}>
                          <div className="flex items-center space-x-2">
                            <span className="bg-stone-105 text-stone-600 text-[9px] font-bold px-2.5 py-0.5 rounded uppercase tracking-wider">
                              {t.extractionNotesBadgeExtracted}
                            </span>
                            {note.uncertain && (
                              <span className="bg-red-50 text-[#C62828] text-[9px] font-bold px-2.5 py-0.5 rounded uppercase tracking-wider flex items-center space-x-1">
                                <AlertTriangle size={9} />
                                <span>{t.extractionNotesBadgeUncertainty}</span>
                              </span>
                            )}
                          </div>
                          <p className="text-xs font-mono text-stone-400 italic">
                            "{note.original}"
                          </p>
                          <p className="text-[13px] font-bold text-[#1C2B3A]">
                            {currentLang === 'IT' ? note.extracted.it : note.extracted.de}
                          </p>
                        </div>
                      );
                    })}
                  </div>

                  {/* Gray Logistics note box */}
                  <div className="bg-[#F8F9FA] border border-[#E0E0E0] p-4 rounded-[6px] text-xs leading-relaxed text-[#1C2B3A]">
                    <span className="font-bold text-[#1C2B3A] mr-1.5">
                      {t.logisticsNoteLabel}
                    </span>
                    <span className="font-semibold text-stone-700">
                      {currentLang === 'IT' ? logistics.it : logistics.de}
                    </span>
                  </div>

                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Section 5: Output Preview (Collapsible) */}
        <div id="section-preview" className="bg-white border border-[#E0E0E0] rounded-[8px] overflow-hidden shadow-sm">
          <button
            onClick={() => setIsOutputPreviewOpen(!isOutputPreviewOpen)}
            className="w-full px-6 py-4 flex items-center justify-between bg-white hover:bg-stone-50 transition-colors duration-150 select-none text-left"
          >
            <div className="flex items-center space-x-3">
              <span className="text-[14px] font-bold text-[#1C2B3A] tracking-tight uppercase">
                {t.outputPreviewTitle}
              </span>
              <span className="bg-[#E3F2FD] text-[#1565C0] text-[9px] font-bold px-2.5 py-0.5 rounded-full tracking-wider font-mono">
                {t.liveJsonBadge}
              </span>
            </div>
            <div className="text-stone-500">
              {isOutputPreviewOpen ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
            </div>
          </button>

          <AnimatePresence initial={false}>
            {isOutputPreviewOpen && (
              <motion.div
                initial={{ height: 0 }}
                animate={{ height: 'auto' }}
                exit={{ height: 0 }}
                transition={{ duration: 0.15, ease: 'easeInOut' }}
                className="overflow-hidden"
              >
                <div className="p-6 border-t border-[#E0E0E0] bg-[#FAF9F6]">
                  {/* Monospace JSON Live Code Block */}
                  <pre className="text-xs font-mono text-[#1C2B3A] bg-[#F5F5F5] p-5 border border-[#E0E0E0] rounded-[6px] overflow-x-auto leading-relaxed select-all">
                    {JSON.stringify(generateJsonOutput(), null, 2)}
                  </pre>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Section 6: Realtime AI Feedback Capture Console */}
        <div id="feedback-audit-panel" className="bg-[#0F172A] text-slate-100 rounded-[8px] overflow-hidden shadow-md border border-slate-800">
          <div className="bg-slate-800/80 px-6 py-3 flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Code size={14} className="text-emerald-400 animate-pulse animate-duration-1000" />
              <span className="text-[10px] font-extrabold text-[#94A3B8] tracking-widest uppercase font-mono">
                [AI LEARNING CONSOLE] - Realtime Operator Actions Capture Logs (REST Feedback Endpoint Simulator)
              </span>
            </div>
            <div className="flex items-center space-x-2">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping"></span>
              <span className="text-emerald-400 text-[9px] font-mono font-bold uppercase">
                Sim-Telemetry Link Active
              </span>
            </div>
          </div>

          <div className="p-4 bg-[#020617] font-mono text-[11px] space-y-2 max-h-[170px] overflow-y-auto divide-y divide-[#1E293B]">
            {feedbackLogs.length === 0 ? (
              <p className="text-slate-500 italic py-3 text-center select-none font-mono">
                [In attesa di eventi...] Conferma, Modifica o Rifiuta righe ordine sovrastanti per generare pacchetti di feedback per l'apprendimento del LLM.
              </p>
            ) : (
              feedbackLogs.map((log) => (
                <div key={log.id} className="pt-2 pb-2 first:pt-0 flex flex-col md:flex-row md:items-center justify-between gap-2">
                  <div className="font-mono">
                    <span className="text-orange-400 font-bold mr-2">[{log.action}]</span>
                    <span className="text-slate-400">Testo:</span> <span className="text-slate-100 italic">"{log.originalText}"</span>
                    <span className="text-slate-400 mx-2">|</span>
                    <span className="text-slate-400">Suggerito:</span> <span className="text-amber-500">"{log.suggestedSku}"</span>
                    <span className="text-slate-400 mx-2">|</span>
                    <span className="text-slate-400">Selezionato:</span> <span className="text-emerald-400 font-bold">"{log.selectedSku}"</span>
                  </div>
                  <div className="text-right text-slate-500 text-[10px] space-x-2">
                    <span>Cliente: <strong className="text-slate-300 font-bold">{log.customerCode}</strong></span>
                    <span>|</span>
                    <span>Invio API: <strong className="text-emerald-400 font-bold">SUCCESS_201</strong></span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Bottom Actions Row with Back button on the left and Confirm button on the right */}
        <div className="flex flex-col sm:flex-row justify-between items-center select-none pt-4 gap-4">
          <button
            id="btn-back-to-upload"
            onClick={onBackToUpload}
            className="w-full sm:w-auto px-6 py-4 rounded-[4px] text-xs font-bold uppercase tracking-wider transition-all duration-150 border border-stone-300 bg-white hover:bg-stone-50 text-[#1C2B3A] cursor-pointer inline-flex items-center justify-center space-x-2 shadow-sm"
          >
            <ArrowLeft size={14} />
            <span>{currentLang === 'IT' ? 'Torna al caricamento' : 'Zurück zur Eingabe'}</span>
          </button>

          <button
            id="btn-confirm-review-order"
            disabled={isExportDisabled}
            onClick={() =>
              onConfirmOrder({
                customerCode: metadata.customerCode || '1204',
                orderReference: metadata.orderReference || 'FORN-2026-031',
                date: metadata.date,
                confirmedCount: confirmedCount,
                totalCount: lines.length
              }, lines)
            }
            className={`w-full sm:w-auto px-8 py-4 rounded-[4px] text-xs font-bold uppercase tracking-wider transition-all duration-150 shadow-md inline-flex items-center justify-center space-x-2 ${
              isExportDisabled
                ? 'bg-stone-200 text-stone-400 border border-stone-300 cursor-not-allowed opacity-60'
                : 'bg-[#1565C0] hover:bg-[#0D47A1] text-white hover:shadow-lg cursor-pointer'
            }`}
            title={isExportDisabled ? "Risolvere le righe ad errore critico per sbloccare l'inoltro a gestionale" : "Conferma l'ordine e inoltra ad ERP backend"}
          >
            <span>{t.btnConfirmOrder}</span>
            <ArrowRight size={14} />
          </button>
        </div>

      </div>
    </div>
  );
}
