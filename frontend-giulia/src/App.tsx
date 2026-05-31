import React, { useState } from 'react';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import UploadPage from './components/UploadPage';
import ReviewPage from './components/ReviewPage';
import SuccessPage from './components/SuccessPage';
import LoadingModal from './components/LoadingModal';
import { Language } from './types';

export default function App() {
  // 5. DEFAULT LANGUAGE = GERMAN (DE). On first load, DE always first.
  const [lang, setLang] = useState<Language>('DE');
  const [page, setPage] = useState<1 | 2 | 3>(1);
  const [showLoadingModal, setShowLoadingModal] = useState(false);

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

  // Handle page 1 submission, triggering loading modal
  const handlePage1Submit = (data: typeof submissionMetadata) => {
    setSubmissionMetadata(data);
    setShowLoadingModal(true);
  };

  // Callback from modal when timer is done
  const handleLoadingComplete = () => {
    setShowLoadingModal(false);
    setPage(2);
  };

  // Navigates from Page 2 to Page 3
  const handleConfirmOrderAndSubmit = (summary: typeof successSummary) => {
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
            onConfirmOrder={handleConfirmOrderAndSubmit}
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
          onComplete={handleLoadingComplete}
        />
      )}

      {/* Footer present on all pages with correct translated indicator */}
      <Footer currentLang={lang} />
    </div>
  );
}
