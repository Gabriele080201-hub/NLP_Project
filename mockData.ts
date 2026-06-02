import { OrderLine, OrderMetadata } from './types';

export const getInitialMockOrder = (filename = "PHOTO-2026-05-27-10-14-37.jpg"): OrderMetadata => ({
  customerCode: "C-2026",
  orderReference: "N/D",
  date: "2026-05-27",
  inputType: "image",
  filename: filename,
  duration: undefined,
  rawText: undefined
});

export const MOCK_ORDER_LINES: OrderLine[] = [
  {
    id: 1,
    originalText: "5 schweinskaiserteile ohne deckl",
    productDescription: {
      ITA: "Spalla di maiale affumicata (Kaiserteile)",
      DE: "Schweinskaiserteile (Schweinsrücken)"
    },
    matchedSku: "SWT05",
    matchedSkuLabel: {
      ITA: "SWT05 – Schweinskaiserteile ohne Deckel",
      DE: "SWT05 – Schweinskaiserteile ohne Deckel"
    },
    quantity: 5,
    unit: "—",
    languageDetected: "DE",
    confidenceScore: 0.72,
    confidenceLabel: {
      ITA: "Validazione umana richiesta",
      DE: "Manuelle Validierung erforderlich"
    },
    status: "tocomplete",
    uncertain: true,
    uncertaintyReason: {
      ITA: "Taglio specifico rimosso (ohne deckl) / Spezifischer Schnitt entfernt",
      DE: "Taglio specifico rimosso (ohne deckl) / Spezifischer Schnitt entfernt"
    },
    notes: {
      ITA: "Verificare disponibilità a magazzino / Verfügbarkeit im Lager prüfen",
      DE: "Verificare disponibilità a magazzino / Verfügbarkeit im Lager prüfen"
    },
    alternatives: [
      {
        sku: "SWT06",
        label: {
          ITA: "SWT06 – Schweinskarree",
          DE: "SWT06 – Schweinskarree"
        }
      },
      {
        sku: "SWK01",
        label: {
          ITA: "SWK01 – Kaiserfleisch Schwein",
          DE: "SWK01 – Kaiserfleisch Schwein"
        }
      }
    ]
  },
  {
    id: 2,
    originalText: "2 naturjoghurt brimi",
    productDescription: {
      ITA: "Yogurt naturale Brimi",
      DE: "Naturjoghurt Brimi"
    },
    matchedSku: "NJB02",
    matchedSkuLabel: {
      ITA: "NJB02 – Naturjoghurt Brimi 500g",
      DE: "NJB02 – Naturjoghurt Brimi 500g"
    },
    quantity: 2,
    unit: "—",
    languageDetected: "DE",
    confidenceScore: 0.97,
    confidenceLabel: {
      ITA: "Alta affidabilità",
      DE: "Hohe Zuverlässigkeit"
    },
    status: "confirmed",
    uncertain: false,
    alternatives: [
      {
        sku: "NJB03",
        label: {
          ITA: "NJB03 – Naturjoghurt Brimi 1kg",
          DE: "NJB03 – Naturjoghurt Brimi 1kg"
        }
      }
    ]
  },
  {
    id: 3,
    originalText: "latte intero 6 litri",
    productDescription: {
      ITA: "Latte intero",
      DE: "Vollmilch"
    },
    matchedSku: "LAT06",
    matchedSkuLabel: {
      ITA: "LAT06 – Latte Intero 1L",
      DE: "LAT06 – Vollmilch 1L"
    },
    quantity: 6,
    unit: "L",
    languageDetected: "ITA",
    confidenceScore: 0.96,
    confidenceLabel: {
      ITA: "Alta affidabilità",
      DE: "Hohe Zuverlässigkeit"
    },
    status: "confirmed",
    uncertain: false,
    alternatives: [
      {
        sku: "LAT07",
        label: {
          ITA: "LAT07 – Latte Parzialmente Scremato 1L",
          DE: "LAT07 – Teilentrahmte Milch 1L"
        }
      }
    ]
  },
  {
    id: 4,
    originalText: "pane tipo 00 forse 3 sacchi",
    productDescription: {
      ITA: "Farina tipo 00",
      DE: "Mehl Type 00"
    },
    matchedSku: "FAR00",
    matchedSkuLabel: {
      ITA: "FAR00 – Farina Tipo 00 5kg",
      DE: "FAR00 – Mehl Type 00 5kg"
    },
    quantity: 3,
    unit: "sacchi",
    languageDetected: "ITA",
    confidenceScore: 0.88,
    confidenceLabel: {
      ITA: "Revisione consigliata",
      DE: "Überprüfung empfohlen"
    },
    status: "pending",
    uncertain: true,
    uncertaintyReason: {
      ITA: "Quantità indicata come incerta (\"forse\") / Menge als unsicher angegeben",
      DE: "Quantità indicata come incerta (\"forse\") / Menge als unsicher angegeben"
    },
    alternatives: [
      {
        sku: "FAR01",
        label: {
          ITA: "FAR01 – Farina Manitoba 5kg",
          DE: "FAR01 – Manitoba Mehl 5kg"
        }
      },
      {
        sku: "FAR02",
        label: {
          ITA: "FAR02 – Mehl Type 00 5kg",
          DE: "FAR02 – Mehl Type 00 5kg"
        }
      }
    ]
  },
  {
    id: 5,
    originalText: "speck alto adige affettato",
    productDescription: {
      ITA: "Speck Alto Adige affettato",
      DE: "Südtiroler Speck aufgeschnitten"
    },
    matchedSku: "SPK01",
    matchedSkuLabel: {
      ITA: "SPK01 – Speck Alto Adige IGP affettato 100g",
      DE: "SPK01 – Südtiroler Speck g.g.A. aufgeschnitten 100g"
    },
    quantity: null,
    unit: "—",
    languageDetected: "ITA",
    confidenceScore: 0.81,
    confidenceLabel: {
      ITA: "Revisione consigliata",
      DE: "Überprüfung empfohlen"
    },
    status: "tocomplete",
    uncertain: true,
    uncertaintyReason: {
      ITA: "Quantità mancante nell'ordine / Menge in der Bestellung fehlt",
      DE: "Quantità mancante nell'ordine / Menge in der Bestellung fehlt"
    },
    alternatives: [
      {
        sku: "SPK02",
        label: {
          ITA: "SPK02 – Speck affettato sottovuoto",
          DE: "SPK02 – Speck vakuumverpackt aufgeschnitten"
        }
      },
      {
        sku: "SPK03",
        label: {
          ITA: "SPK03 – Südtiroler Speck geschnitten",
          DE: "SPK03 – Südtiroler Speck in Scheiben"
        }
      }
    ]
  },
  {
    id: 6,
    originalText: "Apfelsaft 12x1L Fa. Juval",
    productDescription: {
      ITA: "Succo di mela Juval",
      DE: "Apfelsaft Juval"
    },
    matchedSku: "APS12",
    matchedSkuLabel: {
      ITA: "APS12 – Apfelsaft Juval 1L",
      DE: "APS12 – Apfelsaft Juval 1L"
    },
    quantity: 12,
    unit: "x1L",
    languageDetected: "DE",
    confidenceScore: 0.98,
    confidenceLabel: {
      ITA: "Alta affidabilità",
      DE: "Hohe Zuverlässigkeit"
    },
    status: "confirmed",
    uncertain: false,
    alternatives: [
      {
        sku: "APS13",
        label: {
          ITA: "APS13 – Apfelsaft Juval 0.5L",
          DE: "APS13 – Apfelsaft Juval 0.5L"
        }
      }
    ]
  },
  {
    id: 7,
    originalText: "[unlesbar / illeggibile]",
    productDescription: {
      ITA: "Clicca modifica per inserire",
      DE: "Klicken Sie zum Bearbeiten"
    },
    matchedSku: null,
    matchedSkuLabel: null,
    quantity: null,
    unit: "—",
    languageDetected: "Misto",
    confidenceScore: 0.40,
    confidenceLabel: {
      ITA: "Validazione umana richiesta",
      DE: "Manuelle Validierung erforderlich"
    },
    status: "unreadable",
    uncertain: true,
    uncertaintyReason: {
      ITA: "Risoluzione immagine insufficiente o testo scarabocchiato / Unleserlicher Text",
      DE: "Risoluzione immagine insufficiente o testo scarabocchiato / Unleserlicher Text"
    },
    alternatives: []
  }
];

export const MOCK_LOGISTICS_NOTES = [
  {
    text: "consegna venerdì mattina",
    interpretation: {
      ITA: "Consegna richiesta venerdì mattina / Lieferung am Freitagmorgen gewünscht",
      DE: "Consegna richiesta venerdì mattina / Lieferung am Freitagmorgen gewünscht"
    },
    uncertain: false
  },
  {
    text: "vom Angebot",
    interpretation: {
      ITA: "Dall'offerta corrente / Aus dem aktuellen Angebot",
      DE: "Dall'offerta corrente / Aus dem aktuellen Angebot"
    },
    uncertain: true
  }
];

export const MOCK_GENERAL_COMMENT = {
  ITA: "Rilevate inconsistenze sulle quantità di Speck e sui sacchi di pane. Richiesto controllo manuale.",
  DE: "Inkonsistenzen bei Speckmengen und Brotsäcken festgestellt. Manuelle Kontrolle erforderlich."
};

export const MOCK_AI_SUGGESTIONS = {
  schweinskaiserteile: [
    "Schweinskaiser ohne Deckel",
    "Schweinskarree",
    "Kaiserfleisch Schwein"
  ],
  speck: [
    "Speck Alto Adige IGP affettato 100g",
    "Speck affettato sottovuoto",
    "Südtiroler Speck geschnitten"
  ],
  farina: [
    "Farina tipo 00 5kg",
    "Farina Manitoba",
    "Mehl Type 00"
  ]
};
