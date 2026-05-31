import { OrderLine, ExtractionNote, ValidationSheet } from './types';

export const initialValidationSheet: ValidationSheet = {
  customerCode: "1204",
  orderReference: "FORN-2026-031",
  date: "2026-05-27",
  inputType: "IMAGINE",
  filename: "B0491_0001.jpg",
  detectedLanguage: "Misto", // Misto (IT) / Gemischt (DE)
  uncertainLinesCount: 4
};

export const initialOrderLines: OrderLine[] = [
  {
    id: 1,
    originalText: "5 schweinskaiserteile ohne deckl",
    itDescription: "Tagio kaiser di maiale senza copertina",
    deDescription: "Schweinskaiserteile ohne Deckel",
    qty: "5",
    unit: "pz",
    lang: "DE",
    confidence: 0.72,
    status: "to_complete",
    suggestions: ["Schweinskaiser ohne Deckel", "Schweinskarree", "Kaiserfleisch Schwein"],
    matchedSku: "SCH34 – Schweinskaiserteile O.D.",
    initialMatchedSku: "SCH34 – Schweinskaiserteile O.D.",
    alternativeSkus: [
      "SCH12 – Schweinskarree rst",
      "SCH09 – Schweinebauch m.B.",
      "SCH99 – Schweinekopf m.O."
    ]
  },
  {
    id: 2,
    originalText: "2 naturjoghurt brimi",
    itDescription: "Yogurt naturale Brimi",
    deDescription: "Naturjoghurt Brimi",
    qty: "2",
    unit: "pz",
    lang: "DE",
    confidence: 0.97,
    status: "confirmed",
    matchedSku: "YOG10 – Naturjoghurt Brimi 125g",
    initialMatchedSku: "YOG10 – Naturjoghurt Brimi 125g",
    alternativeSkus: [
      "YOG11 – Naturjoghurt Brimi Senza Lattosio",
      "YOG12 – Naturjoghurt Mirtillo 125g"
    ]
  },
  {
    id: 3,
    originalText: "latte intero 6 litri",
    itDescription: "Latte intero",
    deDescription: "Vollmilch",
    qty: "6",
    unit: "L",
    lang: "IT",
    confidence: 0.96,
    status: "confirmed",
    matchedSku: "MIL01 – Latte Intero Brimi 1L",
    initialMatchedSku: "MIL01 – Latte Intero Brimi 1L",
    alternativeSkus: [
      "MIL02 – Latte Parzialmente Scremato 1L",
      "MIL05 – Latte di Capra Alto Adige"
    ]
  },
  {
    id: 4,
    originalText: "pane tipo 00 forse 3 sacchi",
    itDescription: "Farina tipo 00",
    deDescription: "Mehl Type 00",
    qty: "3",
    unit: "sacchi",
    lang: "IT",
    confidence: 0.88,
    status: "pending",
    matchedSku: "PAN22 – Farina Pane Tipo A Gialla",
    initialMatchedSku: "PAN22 – Farina Pane Tipo A Gialla",
    alternativeSkus: [
      "PAN23 – Farina Tipo 00 Manitoba",
      "PAN04 – Pane Rustico Lungo Alto Adige"
    ]
  },
  {
    id: 5,
    originalText: "speck alto adige affettato",
    itDescription: "Speck Alto Adige affettato",
    deDescription: "Südtiroler Speck geschnitten",
    qty: "–",
    unit: "pz",
    lang: "IT",
    confidence: 0.78, // Adjusted to trigger 'Human Validation Required' (under 0.80)
    status: "to_complete",
    suggestions: ["Speck speck affettato", "Alto Adige IGP Speck", "Speck affettato"],
    matchedSku: "SPE66 – Speck Alto Adige IGP Affettato 100g",
    initialMatchedSku: "SPE66 – Speck Alto Adige IGP Affettato 100g",
    alternativeSkus: [
      "SPE67 – Speck Trancio Alto Adige 500g",
      "SPE01 – Speck Alto Adige s.C.",
      "SAL02 – Salami Tipo Milano Extra"
    ]
  },
  {
    id: 6,
    originalText: "Apfelsaft 12x1L Fa. Juval",
    itDescription: "Succo di mela Juval",
    deDescription: "Apfelsaft Juval",
    qty: "12",
    unit: "x1L",
    lang: "DE",
    confidence: 0.98,
    status: "confirmed",
    matchedSku: "JUV05 – Apfelsaft Naturrein Juval 1L",
    initialMatchedSku: "JUV05 – Apfelsaft Naturrein Juval 1L",
    alternativeSkus: [
      "JUV07 – Apfel-Preiselbeer-Saft Juval 1L",
      "JUV01 – Apfelessig Juval 500ml"
    ]
  },
  {
    id: 7,
    originalText: "[unlesbar / illeggibile]",
    itDescription: "non leggibile",
    deDescription: "nicht lesbar",
    qty: "–",
    unit: "–",
    lang: "DE",
    confidence: 0.40,
    status: "unreadable",
    matchedSku: "UNK00 – Unknown Item Code",
    initialMatchedSku: "UNK00 – Unknown Item Code",
    alternativeSkus: [
      "BAK02 – Pane Bianco Fresco Foppa",
      "MEL01 – Mele Golden Alto Adige 1kg"
    ]
  }
];

export const initialExtractionNotes: ExtractionNote[] = [
  {
    original: "consegna venerdi mattina",
    extracted: {
      it: "Consegna richiesta venerdì mattina",
      de: "Gewünschte Lieferung am Freitagvormittag"
    },
    uncertain: false
  },
  {
    original: "vom Angebot",
    extracted: {
      it: "Da offerta promozionale",
      de: "Aus Sonderangebot"
    },
    uncertain: true
  }
];

export const logisticsNote = {
  it: "Il sistema ha identificato i requisiti per venerdì mattina. Nessuna ulteriore incoerenza riscontrata.",
  de: "Das System hat die Anforderungen für Freitagmorgen identifiziert. Keine weiteren Unstimmigkeiten festgestellt."
};

// Raw extracted text for Section 2 (Word-document style)
export const rawExtractedText = `Kunde: 1204 - Foppa Partner (extracted via handwritten paper analysis)
--------------------------------------------------------------
- 5 [unlesbar] (schweinskaiserteile?) ohne deckl
- 2 naturjoghurt brimi
- latte intero 6 litri
- pane tipo 00 forse 3 sacchi
- speck [unlesbar] (alto adige affettato?)
- Apfelsaft 12x1L Fa. Juval
- [unlesbar] (consegna venerdì mattina?)`;
