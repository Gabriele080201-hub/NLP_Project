import { Language } from './types';

export const TRANSLATIONS: Record<string, Record<Language, string>> = {
  appTitle: {
    ITA: "INTAKE ORDINI",
    DE: "AUFTRAGSEINGANG"
  },
  appSubtitle: {
    ITA: "Piattaforma Estrazione Ordini",
    DE: "Auftragsextraktions-Plattform"
  },
  page1Title: {
    ITA: "Upload file ordine",
    DE: "Bestelldateien hochladen"
  },
  page1Subtitle: {
    ITA: "Seleziona il messaggio inoltrato dai clienti per estrarne le righe d'ordine nel sistema.",
    DE: "Wählen Sie die vom Kunden weitergeleitete Nachricht aus, um die Bestellzeilen im System zu extrahieren."
  },
  zone1Label: {
    ITA: "Foto ordine",
    DE: "Bestellfoto"
  },
  zone1Helper: {
    ITA: "Carica foto WhatsApp o note scritte a mano",
    DE: "WhatsApp-Foto oder handgeschriebene Notiz hochladen"
  },
  zone1SubNote: {
    ITA: "Nota: Il nome del file può contenere il codice cliente e il numero d'ordine (es. C701-ORD99.jpg) per il pre-riempimento automatico.",
    DE: "Hinweis: Der Dateiname kann die Kundennummer und Bestellreferenz enthalten (z. B. C701-ORD99.jpg) für eine automatische Vorausfüllung."
  },
  zone2Label: {
    ITA: "Messaggio vocale",
    DE: "Sprachnachricht"
  },
  zone2Helper: {
    ITA: "Carica messaggio audio da WhatsApp",
    DE: "WhatsApp-Sprachnachricht hochladen"
  },
  zone2DialectNote: {
    ITA: "IT/DE — Bilingue: L'audio può contenere messaggi misti in italiano, tedesco o dialetto sudtirolese tedesco (Südtirolerisch).",
    DE: "IT/DE — Bilingue: L'audio può contenere messaggi misti in italiano, tedesco o dialetto sudtirolese tedesco (Südtirolerisch)."
  },
  zone3Label: {
    ITA: "Testo ordine",
    DE: "Bestelltext"
  },
  zone3Placeholder: {
    ITA: "Incolla qui il messaggio WhatsApp del cliente... / WhatsApp-Nachricht hier einfügen...",
    DE: "Incolla qui il messaggio WhatsApp del cliente... / WhatsApp-Nachricht hier einfügen..."
  },
  zone3Note: {
    ITA: "Accetta italiano, tedesco o misto",
    DE: "Akzeptiert Italienisch, Deutsch oder gemischt"
  },
  dropAreaTextPhoto: {
    ITA: "Sfoglia o Trascina file",
    DE: "Datei durchsuchen oder hierher ziehen"
  },
  dropAreaTextAudio: {
    ITA: "Sfoglia o Trascina audio",
    DE: "Datei durchsuchen oder hierher ziehen"
  },
  formatsPhotoLabel: {
    ITA: "Formati: .jpg, .jpeg, .png, .webp",
    DE: "Formats: .jpg, .jpeg, .png, .webp"
  },
  formatsAudioLabel: {
    ITA: "Formati: .wav, .mp3, .ogg, .m4a",
    DE: "Formats: .wav, .mp3, .ogg, .m4a"
  },
  customerCodeLabel: {
    ITA: "Codice cliente",
    DE: "Kundennummer"
  },
  orderReferenceLabel: {
    ITA: "Riferimento ordine",
    DE: "Bestellreferenz"
  },
  dateLabel: {
    ITA: "Data ordine",
    DE: "Bestelldatum"
  },
  optionalSectionTitle: {
    ITA: "INFORMAZIONI CLIENTE OPZIONALI",
    DE: "OPTIONALE KUNDENINFORMATIONEN"
  },
  submitButtonText: {
    ITA: "ESTRAI ORDINE",
    DE: "BESTELLUNG EXTRAHIEREN"
  },
  page2Title: {
    ITA: "Revisione umana",
    DE: "Manuelle Überprüfung"
  },
  pipelineStep1: {
    ITA: "1. CARICAMENTO",
    DE: "1. HOCHLADEN"
  },
  pipelineStep2: {
    ITA: "2. ESTRAZIONE AI",
    DE: "2. KI-EXTRAKTION"
  },
  pipelineStep3: {
    ITA: "3. REVISIONA UMANA",
    DE: "3. MANUELLE ÜBERPRÜFUNG"
  },
  pipelineStep4: {
    ITA: "4. ORDINE COMPLETATO",
    DE: "4. AUFTRAGSEINGANG"
  },
  sectionDetectedOrder: {
    ITA: "Ordine rilevato",
    DE: "Erkannte Bestellung"
  },
  sectionValidationCard: {
    ITA: "Scheda di Convalida",
    DE: "Validierungsblatt"
  },
  sectionOrderLines: {
    ITA: "Righe Ordine Rilevate",
    DE: "Erkannte Bestellzeilen"
  },
  sectionExtractionNotes: {
    ITA: "Note d'estrazione",
    DE: "Extraktionsnotizen"
  },
  sectionOutputPreview: {
    ITA: "Anteprima output",
    DE: "Ausgabevorschau"
  },
  sectionOrderSummary: {
    ITA: "Riepilogo ordine",
    DE: "Bestellübersicht"
  },
  colOriginalText: {
    ITA: "TESTO ORIGINALE",
    DE: "ORIGINALTEXT"
  },
  colProductDesc: {
    ITA: "DESCRIZIONE PRODOTTO",
    DE: "PRODUKTBESCHREIBUNG"
  },
  colSKU: {
    ITA: "ARTICOLO ABBINATO",
    DE: "ZUGEORDNETER ARTIKEL"
  },
  colQuantity: {
    ITA: "QTÀ",
    DE: "MENGE"
  },
  colUnit: {
    ITA: "UNITÀ",
    DE: "EINHEIT"
  },
  colLanguage: {
    ITA: "LINGUA",
    DE: "SPRACHE"
  },
  colStatus: {
    ITA: "STATO",
    DE: "STATUS"
  },
  colConfidenceLabel: {
    ITA: "LIVELLO AFFIDABILITÀ",
    DE: "ZUVERLÄSSIGKEITSSTUFE"
  },
  colActions: {
    ITA: "AZIONI",
    DE: "AKTIONEN"
  },
  actionConfirm: {
    ITA: "Conferma",
    DE: "Bestätigen"
  },
  actionEdit: {
    ITA: "Modifica",
    DE: "Bearbeiten"
  },
  actionReject: {
    ITA: "Rifiuta",
    DE: "Ablehnen"
  },
  bulkConfirmAll: {
    ITA: "Conferma tutto",
    DE: "Alles bestätigen"
  },
  bulkExportJSON: {
    ITA: "Esporta JSON",
    DE: "JSON exportieren"
  },
  bulkExportCSV: {
    ITA: "Esporta CSV",
    DE: "CSV exportieren"
  },
  bulkReset: {
    ITA: "Resetta",
    DE: "Zurücksetzen"
  },
  finalConfirmButton: {
    ITA: "Conferma ordine",
    DE: "Bestellung bestätigen"
  },
  page3Title: {
    ITA: "Ordine Confermato con Successo",
    DE: "Bestellung erfolgreich bestätigt"
  },
  page3Subtitle: {
    ITA: "I dati dell'ordine sono stati registrati ed inviati correttamente al sistema ERP aziendale.",
    DE: "Die Bestelldaten wurden erfolgreich registriert und an das ERP-System des Unternehmens gesendet."
  },
  page3NewOrderBtn: {
    ITA: "Nuovo caricamento ordini",
    DE: "Neue Bestellung laden"
  },
  aiSuggestionsLabel: {
    ITA: "Suggerimenti assistente AI",
    DE: "KI-Assistenten-Vorschläge"
  },
  replaceLabelInsideEdit: {
    ITA: "Sostituisci con",
    DE: "Ersetzen durch"
  },
  summaryTotalLines: {
    ITA: "Righe totali",
    DE: "Gesamtzeilen"
  },
  summaryConfirmed: {
    ITA: "Confermate",
    DE: "Bestätigt"
  },
  summaryModified: {
    ITA: "Modificate",
    DE: "Bearbeitet"
  },
  summaryRejected: {
    ITA: "Rifiutate",
    DE: "Abgelehnt"
  },
  summaryUnresolved: {
    ITA: "Da risolvere",
    DE: "Noch zu klären"
  },
  exportBlockedNotice: {
    ITA: "Risolvi tutte le righe a validazione obbligatoria prima di esportare",
    DE: "Bitte alle Zeilen mit Pflichtvalidierung auflösen, bevor exportiert wird"
  },
  newUploadBtn: {
    ITA: "Nuovo caricamento",
    DE: "Neues Hochladen"
  },
  operatorLabel: {
    ITA: "Operatore",
    DE: "Bediener"
  },
  fileReceived: {
    ITA: "File ricevuto",
    DE: "Datei empfangen"
  },
  fileReceivedSub: {
    ITA: "Verifica di integrità e rilevamento formati completato.",
    DE: "Integritätsprüfung und Formaterkennung abgeschlossen."
  },
  aiExtractionInProgress: {
    ITA: "Estrazione AI in corso...",
    DE: "KI-Extraktion läuft..."
  },
  aiExtractionInProgressSub: {
    ITA: "Gemini rileva righe d'ordine grezze in tedesco/italiano.",
    DE: "Gemini erkennt rohe Bestellzeilen auf Deutsch/Italienisch."
  },
  structuringNotes: {
    ITA: "Strutturazione note...",
    DE: "Notizen werden strukturiert..."
  },
  structuringNotesSub: {
    ITA: "Separazione note logistiche e flagging parti incerte.",
    DE: "Trennung von Logistiknotizen und Kennzeichnung unsicherer Teile."
  },
  readyForReview: {
    ITA: "Pronto per revisione",
    DE: "Bereit zur Überprüfung"
  },
  readyForReviewSub: {
    ITA: "Generazione della scheda di convalida per l'addetto alle vendite.",
    DE: "Erstellung des Validierungsblatts für den Vertriebsmitarbeiter."
  },
  extractionNotesTitle: {
    ITA: "Note d'estrazione",
    DE: "Extraktionsnotizen"
  },
  logisticsNotesSub: {
    ITA: "NOTE LOGISTICHE INTERPRETATE:",
    DE: "INTERPRETIERTE LOGISTIKHINWEISE:"
  },
  unreadablePartsSub: {
    ITA: "PARTI NON LEGGIBILI:",
    DE: "NICHT LESBARE TEILE:"
  },
  generalCommentSub: {
    ITA: "COMMENTO GENERALE:",
    DE: "ALLGEMEINER KOMMENTAR:"
  },
  unreadableWarning: {
    ITA: "Impossibile identificare prodotto o quantità alla riga 7 / Produkt oder Menge in Zeile 7 kann nicht identifiziert werden.",
    DE: "Impossibile identificare prodotto o quantità alla riga 7 / Produkt oder Menge in Zeile 7 kann nicht identifiziert werden."
  },
  transmissionSummary: {
    ITA: "RIEPILOGO TRASMISSIONE",
    DE: "ÜBERMITTLUNGSZUSAMMENFASSUNG"
  },
  erpTransactionId: {
    ITA: "ID TRANSAZIONE ERP",
    DE: "ERP-TRANSAKTIONS-ID"
  },
  statusLabel: {
    ITA: "STATO",
    DE: "STATUS"
  },
  syncedLabel: {
    ITA: "SINCRONIZZATO",
    DE: "SYNCHRONISIERT"
  }
};
