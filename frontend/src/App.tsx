import React, { useState } from 'react';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import UploadPage from './components/UploadPage';
import ReviewPage from './components/ReviewPage';
import SuccessPage from './components/SuccessPage';
import LoadingModal from './components/LoadingModal';
import { Language, OrderLine, ExtractionNote } from './types';

// Simple heuristic to guess item language for Giulia's lang badge
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
  // 5. DEFAULT LANGUAGE = GERMAN (DE). On first load, DE always first.
  const [lang, setLang] = useState<Language>('DE');
  const [page, setPage] = useState<1 | 2 | 3>(1);
  const [showLoadingModal, setShowLoadingModal] = useState(false);
  const [loadingStep, setLoadingStep] = useState<number>(1);

  // Extracted results to pass to ReviewPage
  const [extractedLines, setExtractedLines] = useState<OrderLine[]>([]);
  const [extractionNotes, setExtractionNotes] = useState<ExtractionNote[]>([]);
  const [logistics, setLogistics] = useState<{ it: string; de: string }>({ it: '', de: '' });
  const [rawText, setRawText] = useState<string>('');

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
    totalCount: number;
  }>({
    customerCode: '',
    orderReference: '',
    date: '',
    confirmedCount: 0,
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
    setLoadingStep(1);
    setShowLoadingModal(true);

    // Simulate stepping through sequential stages for UI visual feedback
    const timer1 = setTimeout(() => setLoadingStep(2), 600);
    const timer2 = setTimeout(() => setLoadingStep(3), 1500);

    try {
      const formData = new FormData();
      formData.append('customer_code', data.customerCode || '1204');

      if (data.inputType === 'TESTO') {
        formData.append('text', data.textPaste || '');
      } else {
        const fileObj = data.inputType === 'IMAGINE' ? data.photoFile : data.audioFile;
        if (fileObj) {
          formData.append('file', fileObj);
        } else {
          // If no raw file object is present (simulated file mode on Page 1)
          // We pass the simulated text transcription so the backend can run end-to-end matching/extraction.
          const simulatedText = `5 schweinskaiserteile ohne deckl
2 naturjoghurt brimi
latte intero 6 litri
pane tipo 00 forse 3 sacchi
speck alto adige affettato
Apfelsaft 12x1L Fa. Juval
consegna venerdi mattina`;
          formData.append('text', simulatedText);
        }
      }

      const response = await fetch('http://localhost:8000/api/extract', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error(`Extraction failed with status ${response.status}`);
      }

      const result = await response.json(); // ExtractResponse

      // Map backend MatchedItem array to Giulia's OrderLine format
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

      // Also grab notes from item-level extraction if any
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

      // Structure logistics note
      const logisticsInfo = {
        it: deliveryNote 
          ? `Il sistema ha rilevato note di consegna: "${deliveryNote}". Nessuna ulteriore incoerenza riscontrata.` 
          : "Nessuna nota logistica rilevata.",
        de: deliveryNote 
          ? `Das System hat Lieferhinweise erkannt: "${deliveryNote}". Keine weiteren Unstimmigkeiten festgestellt.` 
          : "Keine Logistikhinweise erkannt."
      };
      setLogistics(logisticsInfo);

      // Set raw extracted text
      const rawTextContent = result.extracted?.raw_text || '';
      setRawText(rawTextContent);

      clearTimeout(timer1);
      clearTimeout(timer2);
      setLoadingStep(4); // Completing sequence

    } catch (error) {
      console.error('Error extracting order:', error);
      clearTimeout(timer1);
      clearTimeout(timer2);
      setShowLoadingModal(false);
      alert(lang === 'IT' ? 'Errore durante l\'estrazione dell\'ordine.' : 'Fehler bei der Bestellungsextraktion.');
    }
  };

  // Callback from modal when loading step timer completes
  const handleLoadingComplete = () => {
    setShowLoadingModal(false);
    setPage(2);
  };

  // Navigates from Page 2 to Page 3 and submits reviewed changes as operator feedback
  const handleConfirmOrderAndSubmit = async (
    summary: typeof successSummary,
    finalLines: OrderLine[]
  ) => {
    // Construct ReviewedItem array for FeedbackPayload
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
      customer_code: summary.customerCode || '1204',
      items: reviewedItems,
      reviewer_note: `Reviewed via React frontend. Transmitted ${summary.confirmedCount} / ${summary.totalCount} lines.`
    };

    try {
      const response = await fetch('http://localhost:8000/api/feedback', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
      });

      if (!response.ok) {
        console.error('Failed to submit feedback to backend');
      } else {
        console.log('Feedback submitted successfully');
      }
    } catch (err) {
      console.error('Error submitting feedback:', err);
    }

    setSuccessSummary(summary);
    setPage(3);
  };

  // Reset order session
  const handleResetSession = () => {
    setPage(1);
    setSubmissionMetadata({
      customerCode: '',
      orderReference: '',
      date: '',
      inputType: 'TESTO',
      filename: ''
    });
    setSuccessSummary({
      customerCode: '',
      orderReference: '',
      date: '',
      confirmedCount: 0,
      totalCount: 0
    });
    setExtractedLines([]);
    setExtractionNotes([]);
    setLogistics({ it: '', de: '' });
    setRawText('');
  };

  return (
    <div className="flex flex-col min-h-screen bg-[#F8F9FA] select-none text-[#1C2B3A] antialiased">
      {/* Navbar present on all pages */}
      <Navbar currentLang={lang} onLanguageChange={setLang} />

      {/* Main content area */}
      <main className="flex-grow">
        {page === 1 && (
          <UploadPage
            currentLang={lang}
            onSubmit={handlePage1Submit}
          />
        )}

        {page === 2 && (
          <ReviewPage
            currentLang={lang}
            metadata={submissionMetadata}
            initialLines={extractedLines}
            initialNotes={extractionNotes}
            logistics={logistics}
            rawText={rawText}
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
            totalLinesCount={successSummary.totalCount}
            onReset={handleResetSession}
          />
        )}
      </main>

      {/* Loading Modal Overlay */}
      {showLoadingModal && (
        <LoadingModal
          currentLang={lang}
          loadingStep={loadingStep}
          onComplete={handleLoadingComplete}
        />
      )}

      {/* Footer present on all pages with correct translated indicator */}
      <Footer currentLang={lang} />
    </div>
  );
}
