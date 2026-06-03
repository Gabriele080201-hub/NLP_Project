import React, { useState } from 'react';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import UploadPage from './components/UploadPage';
import ReviewPage from './components/ReviewPage';
import SuccessPage from './components/SuccessPage';
import LoadingModal from './components/LoadingModal';
import { Language, OrderLine, ExtractionNote, OrderSource } from './types';

const API_BASE = 'http://localhost:8000';

// Simple heuristic to guess item language for the per-line language badge
const guessLanguage = (originalText: string): 'DE' | 'IT' | 'Mix' => {
  const text = originalText.toLowerCase();
  const deWords = ['schwein', 'kaiser', 'deckel', 'naturjoghurt', 'apfelsaft', 'ohne', 'vom', 'angebot', 'lieferung', 'morgen', 'freitag'];
  const itWords = ['latte', 'intero', 'litri', 'pane', 'forse', 'sacchi', 'speck', 'consegna', 'venerdi', 'mattina', 'pomodoro', 'salsa'];

  let deCount = 0;
  let itCount = 0;
  for (const w of deWords) {
    if (text.includes(w)) deCount++;
  }
  for (const w of itWords) {
    if (text.includes(w)) itCount++;
  }

  if (deCount > 0 && itCount > 0) return 'Mix';
  if (itCount > deCount) return 'IT';
  return 'DE'; // Default to German
};

// Helper to extract the product code (SKU) from the matchedSku string
const getSkuFromMatchedSkuString = (matchedSkuStr?: string): string => {
  if (!matchedSkuStr) return '';
  const parts = matchedSkuStr.split(' – ');
  return parts[0] || matchedSkuStr;
};

export default function App() {
  // Default language = German (DE)
  const [lang, setLang] = useState<Language>('DE');
  const [page, setPage] = useState<1 | 2 | 3>(1);
  const [showLoadingModal, setShowLoadingModal] = useState(false);
  const [loadingStep, setLoadingStep] = useState<number>(1);
  const [loadError, setLoadError] = useState<string | null>(null);

  // Extracted results to pass to ReviewPage
  const [extractedLines, setExtractedLines] = useState<OrderLine[]>([]);
  const [extractionNotes, setExtractionNotes] = useState<ExtractionNote[]>([]);
  const [logistics, setLogistics] = useState<{ it: string; de: string }>({ it: '', de: '' });
  const [rawText, setRawText] = useState<string>('');
  const [source, setSource] = useState<OrderSource | null>(null);

  // Saved upload metadata from Page 1
  const [submissionMetadata, setSubmissionMetadata] = useState<{
    customerCode: string;
    orderReference: string;
    date: string;
    inputType: 'IMAGINE' | 'VOCALE' | 'TESTO';
    filename: string;
  }>({
    customerCode: '',
    orderReference: '',
    date: '',
    inputType: 'TESTO',
    filename: ''
  });

  // Compiled results to display on Page 3
  const [successSummary, setSuccessSummary] = useState<{
    customerCode: string;
    orderReference: string;
    date: string;
    confirmedCount: number;
    editedCount: number;
    rejectedCount: number;
    totalCount: number;
  }>({
    customerCode: '',
    orderReference: '',
    date: '',
    confirmedCount: 0,
    editedCount: 0,
    rejectedCount: 0,
    totalCount: 0
  });

  // Handle page 1 submission, triggering loading modal & API extraction
  const handlePage1Submit = async (data: {
    customerCode: string;
    orderReference: string;
    date: string;
    inputType: 'IMAGINE' | 'VOCALE' | 'TESTO';
    filename: string;
    photoFile?: File | null;
    audioFile?: File | null;
    textPaste?: string;
  }) => {
    setSubmissionMetadata({
      customerCode: data.customerCode,
      orderReference: data.orderReference,
      date: data.date,
      inputType: data.inputType,
      filename: data.filename
    });

    // Capture the real source so it can be shown side-by-side during review.
    // Revoke any previous object URL to avoid leaks.
    setSource((prev) => {
      if (prev?.url) URL.revokeObjectURL(prev.url);
      if (data.inputType === 'IMAGINE' && data.photoFile) {
        return { kind: 'image', url: URL.createObjectURL(data.photoFile), mime: data.photoFile.type, filename: data.filename };
      }
      if (data.inputType === 'VOCALE' && data.audioFile) {
        return { kind: 'audio', url: URL.createObjectURL(data.audioFile), mime: data.audioFile.type, filename: data.filename };
      }
      return { kind: 'text', text: data.textPaste || '', filename: data.filename };
    });

    setLoadError(null);
    setLoadingStep(1);
    setShowLoadingModal(true);

    try {
      const formData = new FormData();
      formData.append('customer_code', data.customerCode || 'CUST-DEMO');

      if (data.inputType === 'TESTO') {
        formData.append('text', data.textPaste || '');
      } else {
        const fileObj = data.inputType === 'IMAGINE' ? data.photoFile : data.audioFile;
        if (fileObj) {
          formData.append('file', fileObj);
        } else {
          formData.append('text', data.textPaste || '');
        }
      }

      setLoadingStep(2); // extracting + matching (real work)

      const response = await fetch(`${API_BASE}/api/extract`, {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      const result = await response.json(); // ExtractResponse

      // Map backend MatchedItem array to the OrderLine format used by the UI
      const backendItems = result.matched?.items || [];
      const mappedLines: OrderLine[] = backendItems.map((item: any, index: number) => {
        const scoreVal = item.selected?.score !== undefined ? item.selected.score / 100 : 0.0;
        const matchedSkuStr = item.selected?.code ? `${item.selected.code} – ${item.selected.description || ''}` : '';

        let statusVal: OrderLine['status'] = 'to_complete';
        if (item.selected?.code === 'UNKNOWN' || item.selected?.code === 'UNK00') {
          statusVal = 'unreadable';
        } else if (item.confidence_label === 'HIGH_CONFIDENCE') {
          statusVal = 'confirmed';
        } else if (item.confidence_label === 'REVIEW_RECOMMENDED') {
          statusVal = 'pending';
        }

        const altSkus: string[] = (item.alternatives || []).map((alt: any) =>
          `${alt.code} – ${alt.description}`
        );

        return {
          id: index + 1,
          originalText: item.raw_text || '',
          itDescription: item.selected?.description || '',
          deDescription: item.selected?.description || '',
          qty: item.requested_quantity !== null && item.requested_quantity !== undefined ? item.requested_quantity.toString() : '–',
          unit: item.requested_unit_hint || 'pz',
          lang: guessLanguage(item.raw_text || ''),
          confidence: scoreVal,
          status: statusVal,
          suggestions: (item.alternatives || []).slice(0, 3).map((alt: any) => alt.description),
          matchedSku: matchedSkuStr,
          initialMatchedSku: matchedSkuStr,
          alternativeSkus: altSkus,
          initialConfidenceLabel: item.confidence_label,
          initialValidationRequired: item.validation_required,
          modified: false
        };
      });

      setExtractedLines(mappedLines);

      // Structure extraction notes from delivery note or item notes
      const notesList: ExtractionNote[] = [];
      const deliveryNote = result.matched?.delivery_note || result.extracted?.delivery_note;
      if (deliveryNote) {
        notesList.push({
          original: deliveryNote,
          extracted: {
            it: `Nota di consegna: ${deliveryNote}`,
            de: `Lieferhinweis: ${deliveryNote}`
          },
          uncertain: false
        });
      }

      (result.extracted?.items || []).forEach((extItem: any) => {
        if (extItem.notes && extItem.notes.trim()) {
          notesList.push({
            original: extItem.raw_text || '',
            extracted: {
              it: `Nota articolo: ${extItem.notes}`,
              de: `Artikelnotiz: ${extItem.notes}`
            },
            uncertain: true
          });
        }
      });

      setExtractionNotes(notesList);

      const logisticsInfo = {
        it: deliveryNote
          ? `Rilevata nota di consegna: "${deliveryNote}".`
          : 'Nessuna nota logistica rilevata.',
        de: deliveryNote
          ? `Lieferhinweis erkannt: "${deliveryNote}".`
          : 'Keine Logistikhinweise erkannt.'
      };
      setLogistics(logisticsInfo);

      setRawText(result.extracted?.raw_text || '');

      setLoadingStep(3); // done
    } catch (error) {
      console.error('Error extracting order:', error);
      setLoadError(
        lang === 'IT'
          ? "Estrazione non riuscita. Verifica che il backend sia attivo su :8000 e riprova."
          : 'Extraktion fehlgeschlagen. Prüfe, ob das Backend auf :8000 läuft, und versuche es erneut.'
      );
    }
  };

  // Callback from modal when the done step completes
  const handleLoadingComplete = () => {
    setShowLoadingModal(false);
    setPage(2);
  };

  // Navigates from Page 2 to Page 3 and submits reviewed changes as operator feedback
  const handleConfirmOrderAndSubmit = async (
    summary: typeof successSummary,
    finalLines: OrderLine[]
  ) => {
    const reviewedItems = finalLines.map(line => {
      const predictedSku = getSkuFromMatchedSkuString(line.initialMatchedSku);
      const currentSku = getSkuFromMatchedSkuString(line.matchedSku);

      let action: 'confirmed' | 'edited' | 'rejected' = 'confirmed';
      if (line.status === 'unreadable' || !currentSku || currentSku === 'UNKNOWN' || currentSku === 'UNK00') {
        action = 'rejected';
      } else if (currentSku !== predictedSku) {
        action = 'edited';
      }

      return {
        action,
        corrected_item_code: action === 'edited' ? currentSku : null,
        original_raw_text: line.originalText,
        predicted_item_code: predictedSku || 'UNKNOWN',
        confidence_label: line.initialConfidenceLabel || 'HUMAN_VALIDATION_REQUIRED',
        validation_required: line.initialValidationRequired !== undefined ? line.initialValidationRequired : true
      };
    });

    const payload = {
      customer_code: summary.customerCode || 'CUST-DEMO',
      items: reviewedItems,
      reviewer_note: `Reviewed via operator console. Transmitted ${summary.confirmedCount} / ${summary.totalCount} lines.`
    };

    try {
      const response = await fetch(`${API_BASE}/api/feedback`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      if (!response.ok) {
        console.error('Failed to submit feedback to backend');
      }
    } catch (err) {
      console.error('Error submitting feedback:', err);
    }

    setSuccessSummary(summary);
    setPage(3);
  };

  const handleResetSession = () => {
    setPage(1);
    setSource((prev) => {
      if (prev?.url) URL.revokeObjectURL(prev.url);
      return null;
    });
    setSubmissionMetadata({ customerCode: '', orderReference: '', date: '', inputType: 'TESTO', filename: '' });
    setSuccessSummary({ customerCode: '', orderReference: '', date: '', confirmedCount: 0, editedCount: 0, rejectedCount: 0, totalCount: 0 });
    setExtractedLines([]);
    setExtractionNotes([]);
    setLogistics({ it: '', de: '' });
    setRawText('');
  };

  return (
    <div className="flex flex-col min-h-screen bg-paper text-ink-900 antialiased">
      <Navbar currentLang={lang} onLanguageChange={setLang} />

      <main className="flex-grow">
        {page === 1 && (
          <UploadPage currentLang={lang} onSubmit={handlePage1Submit} />
        )}

        {page === 2 && (
          <ReviewPage
            currentLang={lang}
            metadata={submissionMetadata}
            initialLines={extractedLines}
            initialNotes={extractionNotes}
            logistics={logistics}
            rawText={rawText}
            source={source}
            onConfirmOrder={handleConfirmOrderAndSubmit}
            onBackToUpload={() => setPage(1)}
          />
        )}

        {page === 3 && (
          <SuccessPage
            currentLang={lang}
            customerCode={successSummary.customerCode}
            orderReference={successSummary.orderReference}
            date={successSummary.date}
            confirmedLinesCount={successSummary.confirmedCount}
            editedLinesCount={successSummary.editedCount}
            rejectedLinesCount={successSummary.rejectedCount}
            totalLinesCount={successSummary.totalCount}
            onReset={handleResetSession}
          />
        )}
      </main>

      {showLoadingModal && (
        <LoadingModal
          currentLang={lang}
          loadingStep={loadingStep}
          error={loadError}
          onComplete={handleLoadingComplete}
          onClose={() => setShowLoadingModal(false)}
        />
      )}

      <Footer currentLang={lang} />
    </div>
  );
}
