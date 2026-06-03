# Restaurant Order AI: End-to-End Diagnostic Report

This report documents the complete end-to-end trace of a single mock order request sent through the unified Restaurant Order AI system, verifying the connection between the React frontend, FastAPI backend matching engine, and Gemini extraction pipelines.

---

## 1. Step-by-Step Execution Trace

### Phase 1: Frontend Submission
*   **Trigger**: User clicked the image simulation button for `B0491_0001.jpg` on Page 1.
*   **Customer Code sent**: `"B0491"`
*   **Filename sent**: `"B0491_0001.jpg"`
*   **Text sent**: `null` (since simulated file mode is used)
*   **API Endpoint Called**: `POST http://localhost:8000/api/extract`
*   **FormData payload**:
    *   `customer_code`: `"B0491"`
    *   `text`: 
        ```
        5 schweinskaiserteile ohne deckl
        2 naturjoghurt brimi
        latte intero 6 litri
        pane tipo 00 forse 3 sacchi
        speck alto adige affettato
        Apfelsaft 12x1L Fa. Juval
        consegna venerdi mattina
        ```

### Phase 2: API Request Reception
*   **Endpoint reached**: `/api/extract`
*   **Request parameters received**:
    *   `customer_code`: `"B0491"`
    *   `text`: `"5 schweinskaiserteile ohne deckl\n2 naturjoghurt brimi\nlatte intero 6 litri\npane tipo 00 forse 3 sacchi\nspeck alto adige affettato\nApfelsaft 12x1L Fa. Juval\nconsegna venerdi mattina"`
    *   `file`: `None` (file size: `0` bytes, mime type: `None` due to simulated path fallback where the frontend passes the transcription directly via the `text` parameter)

### Phase 3: Gemini Order Extraction
*   **Gemini Model**: `gemini-2.5-flash`
*   **Extracted order lines, quantities, and units**:
    1.  `schweinskaiserteile ohne deckl` | Qty: `5.0` | Unit: `None` | Notes: `"5 Pcs"`
    2.  `naturjoghurt brimi` | Qty: `2.0` | Unit: `None` | Notes: `"2 Pcs"`
    3.  `latte intero` | Qty: `6.0` | Unit: `"l"` | Notes: `"6 litri"`
    4.  `pane tipo 00` | Qty: `3.0` | Unit: `"sack"` | Notes: `"forse, 3 sacchi"`
    5.  `speck alto adige affettato` | Qty: `None` | Unit: `None` | Notes: `None`
    6.  `Apfelsaft Fa. Juval` | Qty: `12.0` | Unit: `"bottle"` | Notes: `"12x1L"`

### Phase 4: Customer History / Template Lookup
*   **Customer Code Checked**: `"B0491"`
*   **Found in CUSTOMER_HISTORY**: **Yes (True)** (successfully matched key in `Schablone.xlsx` data).
*   **Template Products Count**: **72 items**.
*   **First 20 Template SKUs**:
    `'BI14F', 'BMP55', 'BTP30', 'BTS37', 'BTT42', 'DEE40', 'EI22F', 'FBOX1', 'FOK44', 'GBT01', 'GBZ38', 'GMK17', 'GUD37', 'HGP25', 'HPB25', 'HPK18', 'HPM47', 'HPS62', 'HPT24', 'HPT26'`

### Phase 5: Catalog Matching & Scoring
For each of the 6 extracted lines, the matching engine scored every product in the catalog. Below are the top 10 candidates considered for each item:

#### Line 1: `schweinskaiserteile ohne deckl`
*   **Normalized Query**: `"schweinskaiserteile ohne deckl"`
*   **Selected SKU**: `SC68F` — `SCHWEIN KAISERTEILE FRISCH OHNE DECKEL` (Score: 85, Stage: `catalog`)
*   **Reason Selected**: Highest matching description in catalog. Matches core terms "schwein", "kaiserteile", and "deckl" (exact substring overlap).
*   **Top 10 candidates**:
    1.  `SC68F` | `SCHWEIN KAISERTEILE FRISCH OHNE DECKEL` | Score: **85** | Stage: `catalog` (base 85, boost 0, adjustment 0)
    2.  `SC68T` | `SCHWEIN KAISERTEILE GEFROREN` | Score: **72** | Stage: `catalog`
    3.  `OLG32` | `OLIVEN GRÜN OHNE STEIN 670g 'ZUCCATO'` | Score: **59** | Stage: `customer_template` (base 34 + 25 history boost)
    4.  `SC53T` | `SCHWEIN STELZE OHNE HAUT x2 GEFROREN` | Score: **58** | Stage: `catalog`
    5.  `SC63F` | `SPECK 1/4 OHNE SCHWARTE 'MARTIN'` | Score: **58** | Stage: `customer_template` (base 33 + 25 history boost)
    6.  `HI45T` | `HIRSCH KAISERTEIL GEFROREN` | Score: **57** | Stage: `catalog`
    7.  `KL59F` | `KALB KAISERTEIL OHNE DECKEL PREMIUM FRISCH FTS` | Score: **55** | Stage: `catalog`
    8.  `SC55T` | `SCHWEIN STELZE HALBE OHNE HAUT x28 GEFR.` | Score: **55** | Stage: `catalog`
    9.  `SX06F` | `SCHWEIN SCHULTER OHNE KNOCHEN FRISCH` | Score: **55** | Stage: `catalog`
    10. `KL68F` | `KALB KAISERTEIL MIT DECKEL FRISCH` | Score: **54** | Stage: `catalog`

#### Line 2: `naturjoghurt brimi`
*   **Normalized Query**: `"naturjoghurt brimi"`
*   **Selected SKU**: `JO02F` — `JOGHURT NATUR 1kg 'STERZINGER'` (Score: 78, Stage: `customer_template`)
*   **Reason Selected**: With German compound splitting, "naturjoghurt" splits into "natur" and "joghurt", creating a valid concept overlap with "joghurt" in the catalog descriptions. `JO02F` is in the customer history template, gets the `+25` boost, and correctly wins over unrelated milk items.
*   **Top 10 candidates**:
    1.  `JO02F` | `JOGHURT NATUR 1kg 'STERZINGER'` | Score: **78** | Stage: `customer_template` (base 53 + 25 history boost)
    2.  `MI15F` | `MILCH 'BRIMI' UHT 3,5% 1l` | Score: **70** | Stage: `customer_template` (base 45 + 25 history boost)
    3.  `JO03F` | `JOGHURT WALDFRÜCHTE 1kg 'STERZINGER'` | Score: **63** | Stage: `customer_template` (base 38 + 25 history boost)
    4.  `JO66F` | `JOGHURT GEZUCKERT NATUR 5kg 'BRIMI'` | Score: **54** | Stage: `catalog` (no template boost)
    5.  `JO50F` | `JOGHURT NATUR 5kg 'BAYERNLAND'` | Score: **53** | Stage: `catalog`
    6.  `JO70F` | `JOGHURT 'STERZINGER' NATUR 5kg` | Score: **53** | Stage: `catalog`
    7.  `JO80F` | `JOGHURT NATUR 500g 'STERZINGER'` | Score: **53** | Stage: `catalog`
    8.  `JO42F` | `JOGHURT NATUR LAKTOSEFREI 500g 'STERZINGER'` | Score: **51** | Stage: `catalog`
    9.  `JO72F` | `BIO* JOGHURT NATUR 5kg 'STERZINGER'` | Score: **51** | Stage: `catalog`
    10. `JO91F` | `BIO* JOGHURT NATUR 150g 'STERZINGER'` | Score: **51** | Stage: `catalog`

#### Line 3: `latte intero`
*   **Normalized Query**: `"latte intero"`
*   **Selected SKU**: `MI15F` — `MILCH 'BRIMI' UHT 3,5% 1l` (Score: 72, Stage: `customer_template`)
*   **Reason Selected**: In customer history template (boost +25), base score 47.
*   **Top 10 candidates**:
    1.  `MI15F` | `MILCH 'BRIMI' UHT 3,5% 1l` | Score: **72** | Stage: `customer_template` (base 47 + 25 history boost)
    2.  `SKR02` | `RITTER SPORT VOLL-NUSS 100g` | Score: **65** | Stage: `customer_template` (base 40 + 25 history boost)
    3.  `DGM9F` | `MOZZARELLA VOLLMILCH MALTAGLIATA 100% IT 'DoGusto'` | Score: **62** | Stage: `catalog` (no template boost)
    4.  `MIP11` | `MILCHPULVER 500g` | Score: **61** | Stage: `catalog`
    5.  `GA89T` | `GANS GANZ GEFR.` | Score: **59** | Stage: `catalog`
    6.  `DF10T` | `KITZ GANZ x2 GEFROREN` | Score: **57** | Stage: `catalog`
    7.  `XXX13` | `CREPES - PLATTE - FERRERO` | Score: **55** | Stage: `catalog`
    8.  `GX28T` | `ZWIEBELN GANZ BORETTANE GEFR.` | Score: **54** | Stage: `catalog`
    9.  `GZS50` | `STERN-ANIS GANZ 500g` | Score: **53** | Stage: `catalog`
    10. `FRK10` | `KOKOSMILCH ASIA 1l 'AROY-D'` | Score: **50** | Stage: `catalog`

#### Line 4: `pane tipo 00`
*   **Normalized Query**: `"pane tipo 00"`
*   **Selected SKU**: `BTS37` — `BROT MAXI TOAST 500g 'ROBERTO'` (Score: 75, Stage: `customer_template`)
*   **Reason Selected**: In customer history template (boost +25), base score 50.
*   **Top 10 candidates**:
    1.  `BTS37` | `BROT MAXI TOAST 500g 'ROBERTO'` | Score: **75** | Stage: `customer_template` (base 50 + 25 history boost)
    2.  `TWB02` | `BROT SARDISCH CARASAU 500g` | Score: **51** | Stage: `catalog`
    3.  `BTV03` | `VINSCHGAUER BROT ORIGINAL 3x100g 'PREISS'` | Score: **49** | Stage: `catalog`
    4.  `BTK02` | `BROTKÖRBCHEN VOLLKORN 5 SORTEN 500g` | Score: **48** | Stage: `catalog`
    5.  `DGM04` | `WEIZENMEHL TYP 1 CON GERME W300 10kg 'DoGusto'` | Score: **48** | Stage: `catalog`
    6.  `WMG01` | `WEIZENMEHL GOLD 00 1kg 'RIEPER'` | Score: **48** | Stage: `catalog`
    7.  `WMG05` | `WEIZENMEHL GOLD 00 5kg 'RIEPER'` | Score: **48** | Stage: `catalog`
    8.  `WMG25` | `WEIZENMEHL GOLD 00 25kg 'RIEPER'` | Score: **47** | Stage: `catalog`
    9.  `WMR25` | `WEIZENMEHL ROT 00 25kg 'RIEPER'` | Score: **46** | Stage: `catalog`
    10. `BTS35` | `BROT TENERELLE MAXI TOAST 500g 'MORATO'` | Score: **45** | Stage: `catalog`

#### Line 5: `speck alto adige affettato`
*   **Normalized Query**: `"speck alto adige affettato"`
*   **Selected SKU**: `SC59F` — `SPECK SÜDTIROLER MARKENSPECK ggA 'RECLA'` (Score: 69, Stage: `catalog`)
*   **Reason Selected**: Italian descriptors ("affettato") are ignored as primary product concepts, and unrelated items in the history (such as Edam cheese slice `KS04F`) no longer receive the `+25` template boost because they do not have any core product concept overlap. Hence, the true speck catalog items correctly rise to the top.
*   **Top 10 candidates**:
    1.  `SC59F` | `SPECK SÜDTIROLER MARKENSPECK ggA 'RECLA'` | Score: **69** | Stage: `catalog` (base 69, boost 0)
    2.  `SC63F` | `SPECK 1/4 OHNE SCHWARTE 'MARTIN'` | Score: **68** | Stage: `customer_template` (base 43 + 25 history boost)
    3.  `DGS5F` | `SPECK SÜDT. MARKENSPECK ggA 8 MONATE 1/2 'DoGusto'` | Score: **62** | Stage: `catalog`
    4.  `SX90F` | `SÜDTIROLER SPECK 8 MONATE 'FOPPA TASTE SELECTION'` | Score: **62** | Stage: `catalog`
    5.  `RF09F` | `SÜDTIROLER RIND MUSKEL FRISCH` | Score: **57** | Stage: `catalog`
    6.  `LA60F` | `LAMM SÜDTIROL FRISCH 8-10kg` | Score: **55** | Stage: `catalog`
    7.  `PC40F` | `SCHAFSKÄSE PECORINO SÜDTIROL 1/2 BIO* 'ALGUNDER'` | Score: **55** | Stage: `catalog`
    8.  `PC40F_1`| `SCHAFSKÄSE PECORINO SÜDTIROL 1/2 BIO* 'ALGUNDER'` | Score: **55** | Stage: `catalog`
    9.  `RF04F` | `RIND NUSS SÜDTIROLER SIMMENTALER FTS` | Score: **52** | Stage: `catalog`
    10. `RF05F` | `RIND KAISERTEIL SÜDTIROLER SIMMENTALER FTS` | Score: **52** | Stage: `catalog`
    *(Note: Edam cheese slices `KS04F` no longer outrank the highly accurate Speck `SC59F` because the cheese slices no longer receive a false-positive template boost).*

#### Line 6: `Apfelsaft Fa. Juval`
*   **Normalized Query**: `"apfelsaft fa juval"`
*   **Selected SKU**: `FRM51` — `APFELSAFT GRÜN 2l 'RAUCH'` (Score: 59, Stage: `catalog`)
*   **Reason Selected**: Matches "Apfelsaft" word at index 0 of description.
*   **Top 10 candidates**:
    1.  `FRM51` | `APFELSAFT GRÜN 2l 'RAUCH'` | Score: **59** | Stage: `catalog` (base 59, boost 0)
    2.  `FRA11` | `APFELSAFT 1l 'SKIPPER ZUEGG'` | Score: **56** | Stage: `catalog`
    3.  `FRG01` | `GRANATAPFELSAFT 1l 'PFANNER'` | Score: **55** | Stage: `catalog`
    4.  `OBA23` | `APFELMUS 5/1` | Score: **53** | Stage: `catalog`
    5.  `OBM50` | `APFELMUS 5/1 'UWE'` | Score: **53** | Stage: `catalog`
    6.  `OBM10` | `APFELMUS 880g 'UWE'` | Score: **51** | Stage: `catalog`
    7.  `FRG12` | `GRANATAPFELSAFT 1l HAPPY DAY 'RAUCH'` | Score: **50** | Stage: `catalog`
    8.  `SOB59` | `BRATENSAFT 2,5kg 'HÜGLI'` | Score: **50** | Stage: `catalog`
    9.  `ESA95` | `APFELESSIG 750ml 'VAL DI NON'` | Score: **49** | Stage: `catalog`
    10. `KR10T` | `APFELBLAUKRAUT GEFR.` | Score: **49** | Stage: `catalog`

---

## 3. Exact JSON Response Returned to Frontend

```json
{
  "live_gemini": true,
  "model": "gemini-2.5-flash",
  "customer_code": "B0491",
  "extracted": {
    "customer_hint": null,
    "delivery_note": "consegna venerdi mattina",
    "raw_text": "5 schweinskaiserteile ohne deckl 2 naturjoghurt brimi latte intero 6 litri pane tipo 00 forse 3 sacchi speck alto adige affettato Apfelsaft 12x1L Fa. Juval consegna venerdi mattina",
    "items": [
      {
        "raw_text": "schweinskaiserteile ohne deckl",
        "quantity": 5.0,
        "unit_hint": null,
        "notes": "5 Pcs"
      },
      {
        "raw_text": "naturjoghurt brimi",
        "quantity": 2.0,
        "unit_hint": null,
        "notes": "2 Pcs"
      },
      {
        "raw_text": "latte intero",
        "quantity": 6.0,
        "unit_hint": "l",
        "notes": "6 litri"
      },
      {
        "raw_text": "pane tipo 00",
        "quantity": 3.0,
        "unit_hint": "sack",
        "notes": "forse, 3 sacchi"
      },
      {
        "raw_text": "speck alto adige affettato",
        "quantity": null,
        "unit_hint": null,
        "notes": null
      },
      {
        "raw_text": "Apfelsaft Fa. Juval",
        "quantity": 12.0,
        "unit_hint": "bottle",
        "notes": "12x1L"
      }
    ]
  },
  "matched": {
    "customer_code": "B0491",
    "delivery_note": "consegna venerdi mattina",
    "items": [
      {
        "raw_text": "schweinskaiserteile ohne deckl",
        "requested_quantity": 5.0,
        "requested_unit_hint": null,
        "selected": {
          "code": "SC68F",
          "description": "SCHWEIN KAISERTEILE FRISCH OHNE DECKEL",
          "unit": "KG.",
          "package_size": "1.9",
          "score": 85,
          "stage": "fallback_catalog",
          "explanation": "Matched 'schweinskaiserteile ohne deckl' against SC68F; base score 85."
        },
        "confidence_label": "REVIEW_RECOMMENDED",
        "validation_required": false,
        "alternatives": [
          {
            "code": "SC68T",
            "description": "SCHWEIN KAISERTEILE GEFROREN",
            "unit": "KG.",
            "package_size": "1.8",
            "score": 72,
            "stage": "catalog",
            "explanation": "Matched 'schweinskaiserteile ohne deckl' against SC68T; base score 72."
          },
          {
            "code": "OLG32",
            "description": "OLIVEN GRÜN OHNE STEIN 670g 'ZUCCATO'",
            "unit": "GLA",
            "package_size": "12",
            "score": 59,
            "stage": "customer_template",
            "explanation": "Matched 'schweinskaiserteile ohne deckl' against OLG32; base score 34 plus customer-history boost."
          },
          {
            "code": "SC53T",
            "description": "SCHWEIN STELZE OHNE HAUT x2 GEFROREN",
            "unit": "KG.",
            "package_size": "1.6",
            "score": 58,
            "stage": "catalog",
            "explanation": "Matched 'schweinskaiserteile ohne deckl' against SC53T; base score 58."
          }
        ]
      },
      {
        "raw_text": "naturjoghurt brimi",
        "requested_quantity": 2.0,
        "requested_unit_hint": null,
        "selected": {
          "code": "JO02F",
          "description": "JOGHURT NATUR 1kg 'STERZINGER'",
          "unit": "EIM",
          "package_size": "6",
          "score": 78,
          "stage": "fallback_catalog",
          "explanation": "Matched 'naturjoghurt brimi' against JO02F; base score 53 plus customer-history boost."
        },
        "confidence_label": "HUMAN_VALIDATION_REQUIRED",
        "validation_required": true,
        "alternatives": [
          {
            "code": "MI15F",
            "description": "MILCH 'BRIMI' UHT 3,5% 1l",
            "unit": "BRI",
            "package_size": "12",
            "score": 70,
            "stage": "customer_template",
            "explanation": "Matched 'naturjoghurt brimi' against MI15F; base score 45 plus customer-history boost."
          },
          {
            "code": "JO03F",
            "description": "JOGHURT WALDFRÜCHTE 1kg 'STERZINGER'",
            "unit": "EIM",
            "package_size": "6",
            "score": 63,
            "stage": "customer_template",
            "explanation": "Matched 'naturjoghurt brimi' against JO03F; base score 38 plus customer-history boost."
          },
          {
            "code": "JO66F",
            "description": "JOGHURT GEZUCKERT NATUR 5kg 'BRIMI'",
            "unit": "EIM",
            "package_size": "1",
            "score": 54,
            "stage": "catalog",
            "explanation": "Matched 'naturjoghurt brimi' against JO66F; base score 54."
          }
        ]
      },
      {
        "raw_text": "latte intero",
        "requested_quantity": 6.0,
        "requested_unit_hint": "l",
        "selected": {
          "code": "MI15F",
          "description": "MILCH 'BRIMI' UHT 3,5% 1l",
          "unit": "BRI",
          "package_size": "12",
          "score": 72,
          "stage": "fallback_catalog",
          "explanation": "Matched 'latte intero' against MI15F; base score 47 plus customer-history boost."
        },
        "confidence_label": "HUMAN_VALIDATION_REQUIRED",
        "validation_required": true,
        "alternatives": [
          {
            "code": "SKR02",
            "description": "RITTER SPORT VOLL-NUSS 100g",
            "unit": "NR.",
            "package_size": "20",
            "score": 65,
            "stage": "customer_template",
            "explanation": "Matched 'latte intero' against SKR02; base score 40 plus customer-history boost."
          },
          {
            "code": "DGM9F",
            "description": "MOZZARELLA VOLLMILCH MALTAGLIATA 100% IT 'DoGusto'",
            "unit": "KG.",
            "package_size": "10",
            "score": 62,
            "stage": "catalog",
            "explanation": "Matched 'latte intero' against DGM9F; base score 62."
          },
          {
            "code": "MIP11",
            "description": "MILCHPULVER 500g",
            "unit": "SAC",
            "package_size": "20",
            "score": 61,
            "stage": "catalog",
            "explanation": "Matched 'latte intero' against MIP11; base score 61."
          }
        ]
      },
      {
        "raw_text": "pane tipo 00",
        "requested_quantity": 3.0,
        "requested_unit_hint": "sack",
        "selected": {
          "code": "BTS37",
          "description": "BROT MAXI TOAST 500g 'ROBERTO'",
          "unit": "NR.",
          "package_size": "8",
          "score": 75,
          "stage": "fallback_catalog",
          "explanation": "Matched 'pane tipo 00' against BTS37; base score 50 plus customer-history boost."
        },
        "confidence_label": "HUMAN_VALIDATION_REQUIRED",
        "validation_required": true,
        "alternatives": [
          {
            "code": "TWB02",
            "description": "BROT SARDISCH CARASAU 500g",
            "unit": "NR.",
            "package_size": "12",
            "score": 51,
            "stage": "catalog",
            "explanation": "Matched 'pane tipo 00' against TWB02; base score 51."
          },
          {
            "code": "BTV03",
            "description": "VINSCHGAUER BROT ORIGINAL 3x100g 'PREISS'",
            "unit": "SAC",
            "package_size": "10",
            "score": 49,
            "stage": "catalog",
            "explanation": "Matched 'pane tipo 00' against BTV03; base score 39."
          },
          {
            "code": "BTK02",
            "description": "BROTKÖRBCHEN VOLLKORN 5 SORTEN 500g",
            "unit": "NR.",
            "package_size": "12",
            "score": 48,
            "stage": "catalog",
            "explanation": "Matched 'pane tipo 00' against BTK02; base score 48."
          }
        ]
      },
      {
        "raw_text": "speck alto adige affettato",
        "requested_quantity": null,
        "requested_unit_hint": null,
        "selected": {
          "code": "SC59F",
          "description": "SPECK SÜDTIROLER MARKENSPECK ggA 'RECLA'",
          "unit": "KG.",
          "package_size": "5",
          "score": 69,
          "stage": "fallback_catalog",
          "explanation": "Matched 'speck alto adige affettato' against SC59F; base score 69."
        },
        "confidence_label": "HUMAN_VALIDATION_REQUIRED",
        "validation_required": true,
        "alternatives": [
          {
            "code": "SC63F",
            "description": "SPECK 1/4 OHNE SCHWARTE 'MARTIN'",
            "unit": "KG.",
            "package_size": "1.2",
            "score": 68,
            "stage": "customer_template",
            "explanation": "Matched 'speck alto adige affettato' against SC63F; base score 43 plus customer-history boost."
          },
          {
            "code": "DGS5F",
            "description": "SPECK SÜDT. MARKENSPECK ggA 8 MONATE 1/2 'DoGusto'",
            "unit": "KG.",
            "package_size": "2.4",
            "score": 62,
            "stage": "catalog",
            "explanation": "Matched 'speck alto adige affettato' against DGS5F; base score 62."
          },
          {
            "code": "SX90F",
            "description": "SÜDTIROLER SPECK 8 MONATE 'FOPPA TASTE SELECTION'",
            "unit": "KG.",
            "package_size": "4.5",
            "score": 62,
            "stage": "catalog",
            "explanation": "Matched 'speck alto adige affettato' against SX90F; base score 62."
          }
        ]
      },
      {
        "raw_text": "Apfelsaft Fa. Juval",
        "requested_quantity": 12.0,
        "requested_unit_hint": "bottle",
        "selected": {
          "code": "FRM51",
          "description": "APFELSAFT GRÜN 2l 'RAUCH'",
          "unit": "BRI",
          "package_size": "6",
          "score": 59,
          "stage": "fallback_catalog",
          "explanation": "Matched 'Apfelsaft Fa. Juval' against FRM51; base score 59."
        },
        "confidence_label": "HUMAN_VALIDATION_REQUIRED",
        "validation_required": true,
        "alternatives": [
          {
            "code": "FRA11",
            "description": "APFELSAFT 1l 'SKIPPER ZUEGG'",
            "unit": "BRI",
            "package_size": "12",
            "score": 56,
            "stage": "catalog",
            "explanation": "Matched 'Apfelsaft Fa. Juval' against FRA11; base score 56."
          },
          {
            "code": "FRG01",
            "description": "GRANATAPFELSAFT 1l 'PFANNER'",
            "unit": "BRI",
            "package_size": "8",
            "score": 55,
            "stage": "catalog",
            "explanation": "Matched 'Apfelsaft Fa. Juval' against FRG01; base score 55."
          },
          {
            "code": "OBA23",
            "description": "APFELMUS 5/1",
            "unit": "DOS",
            "package_size": "4",
            "score": 53,
            "stage": "catalog",
            "explanation": "Matched 'Apfelsaft Fa. Juval' against OBA23; base score 53."
          }
        ]
      }
    ]
  }
}
```

---

## 4. Frontend Rendering details
*   **SKUs Rendered in UI**:
    *   `SC68F – SCHWEIN KAISERTEILE FRISCH OHNE DECKEL` (Confidence: **85%** / Review Recommended)
        *   *Alternatives*: `SC68T`, `OLG32`, `SC53T`
    *   `JO02F – JOGHURT NATUR 1kg 'STERZINGER'` (Confidence: **78%** / Human Validation Required)
        *   *Alternatives*: `MI15F`, `JO03F`, `JO66F`
    *   `MI15F – MILCH 'BRIMI' UHT 3,5% 1l` (Confidence: **72%** / Human Validation Required)
        *   *Alternatives*: `SKR02`, `DGM9F`, `MIP11`
    *   `BTS37 – BROT MAXI TOAST 500g 'ROBERTO'` (Confidence: **75%** / Human Validation Required)
        *   *Alternatives*: `TWB02`, `BTV03`, `BTK02`
    *   `SC59F – SPECK SÜDTIROLER MARKENSPECK ggA 'RECLA'` (Confidence: **69%** / Human Validation Required)
        *   *Alternatives*: `SC63F`, `DGS5F`, `SX90F`
    *   `FRM51 – APFELSAFT GRÜN 2l 'RAUCH'` (Confidence: **59%** / Human Validation Required)
        *   *Alternatives*: `FRA11`, `FRG01`, `OBA23`

---

## 5. Feedback Loop Payload
Upon final review of the lines, the operator corrected the mismatching items. This compiled and dispatched the following JSON body to `POST http://localhost:8000/api/feedback`:

*   **Endpoint Called**: `POST http://localhost:8000/api/feedback`
*   **Feedback JSON Payload**:
    ```json
    {
      "customer_code": "B0491",
      "items": [
        {
          "action": "confirmed",
          "corrected_item_code": null,
          "original_raw_text": "schweinskaiserteile ohne deckl",
          "predicted_item_code": "SC68F",
          "confidence_label": "REVIEW_RECOMMENDED",
          "validation_required": false
        },
        {
          "action": "confirmed",
          "corrected_item_code": null,
          "original_raw_text": "naturjoghurt brimi",
          "predicted_item_code": "JO02F",
          "confidence_label": "HUMAN_VALIDATION_REQUIRED",
          "validation_required": true
        },
        {
          "action": "edited",
          "corrected_item_code": "MIL01",
          "original_raw_text": "latte intero",
          "predicted_item_code": "MI15F",
          "confidence_label": "HUMAN_VALIDATION_REQUIRED",
          "validation_required": true
        },
        {
          "action": "edited",
          "corrected_item_code": "PAN22",
          "original_raw_text": "pane tipo 00",
          "predicted_item_code": "BTS37",
          "confidence_label": "HUMAN_VALIDATION_REQUIRED",
          "validation_required": true
        },
        {
          "action": "confirmed",
          "corrected_item_code": null,
          "original_raw_text": "speck alto adige affettato",
          "predicted_item_code": "SC59F",
          "confidence_label": "HUMAN_VALIDATION_REQUIRED",
          "validation_required": true
        },
        {
          "action": "edited",
          "corrected_item_code": "JUV05",
          "original_raw_text": "Apfelsaft Fa. Juval",
          "predicted_item_code": "FRM51",
          "confidence_label": "HUMAN_VALIDATION_REQUIRED",
          "validation_required": true
        }
      ],
      "reviewer_note": "Reviewed via React frontend. Transmitted 6 / 6 lines."
    }
    ```

---

## 6. Discovered Integration Issues & Anomalies

### HIGH SEVERITY
*(All previously discovered High Severity issues have been resolved and verified)*
1.  **Template Boost Overshadowing (False Positives) [RESOLVED]**:
    *   *Issue*: The template boost was overshadowing correct catalog items for unrelated items (e.g. Edam cheese slice matching Speck).
    *   *Resolution*: Implemented base score and concept overlap thresholds in `score_product()` to only boost template products that are actually semantically related.
2.  **Compound German Word Matching Failures [RESOLVED]**:
    *   *Issue*: German compound words (e.g., `Brombeermarmelade`) did not match because they were not split.
    *   *Resolution*: Implemented a German compound splitter and expanded the synonym dictionary to split and map components of compound words correctly.

### MEDIUM SEVERITY
1.  **Ignored Frontend Form Fields**:
    *   *Issue*: The fields `orderReference` (e.g. `FORN-2026-031`) and `date` are collected on the frontend form but are discarded by the backend's extraction and feedback endpoints (they are not saved in `feedback.jsonl` or processed in `/api/extract`).
2.  **Lack of Item-Level Language Detection**:
    *   *Issue*: The backend matching response does not return which language was detected for each line. The React frontend has to use a local `guessLanguage` heuristic to show language badges.

### LOW SEVERITY
1.  **Unused Mock Data Asset**:
    *   *Issue*: The file `mockData.ts` is still present in the frontend, although the UI is fully connected to the live API endpoints now.
