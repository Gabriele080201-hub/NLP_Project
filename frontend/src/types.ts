export type Language = 'DE' | 'IT';

export type LineStatus = 'confirmed' | 'pending' | 'to_complete' | 'unreadable' | 'in_progress';

export interface OrderLine {
  id: number;
  originalText: string;
  itDescription: string;
  deDescription: string;
  qty: string;
  unit: string;
  lang: 'DE' | 'IT' | 'Mix';
  confidence: number;
  status: LineStatus;
  suggestions?: string[];
  matchedSku?: string;
  alternativeSkus?: string[];
  initialMatchedSku?: string;
  initialConfidenceLabel?: string;
  initialValidationRequired?: boolean;
  modified?: boolean;
}

export interface ExtractionNote {
  original: string;
  extracted: {
    it: string;
    de: string;
  };
  uncertain: boolean;
}

/** The original order source, captured at upload, shown during review. */
export interface OrderSource {
  kind: 'image' | 'audio' | 'text';
  /** object URL for image/audio previews */
  url?: string;
  mime?: string;
  /** pasted text (for text orders) */
  text?: string;
  filename?: string;
}

export interface ValidationSheet {
  customerCode: string;
  orderReference: string;
  date: string;
  inputType: 'IMAGINE' | 'VOCALE' | 'TESTO' | 'BILD' | 'AUDIO' | 'TEXT';
  filename: string;
  detectedLanguage: string;
  uncertainLinesCount: number;
}
