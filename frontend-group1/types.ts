export type Language = 'ITA' | 'DE';

export interface OrderLine {
  id: number;
  originalText: string;
  productDescription: {
    ITA: string;
    DE: string;
  };
  matchedSku: string | null;
  matchedSkuLabel: {
    ITA: string;
    DE: string;
  } | null;
  quantity: number | null;
  unit: string;
  languageDetected: 'ITA' | 'DE' | 'Misto';
  confidenceScore: number;
  confidenceLabel: {
    ITA: string;
    DE: string;
  };
  status: 'confirmed' | 'pending' | 'inprogress' | 'rejected' | 'tocomplete' | 'unreadable'; // pend = In attesa, inprogress = In lavorazione, confirmed = Confermato, rejected = Rifiutato, tocomplete = Da completare, unreadable = Non leggibile
  uncertain: boolean;
  uncertaintyReason?: {
    ITA: string;
    DE: string;
  };
  notes?: {
    ITA: string;
    DE: string;
  };
  alternatives: Array<{
    sku: string;
    label: {
      ITA: string;
      DE: string;
    }
  }>;
}

export interface OrderMetadata {
  customerCode: string;
  orderReference: string;
  date: string;
  inputType: 'image' | 'audio' | 'text' | null;
  filename?: string;
  duration?: string;
  rawText?: string;
}
