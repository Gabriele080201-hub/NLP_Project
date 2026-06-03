# Restaurant Order AI: Project Status Update & Technical Health Check

This status report provides a comprehensive handover of the current project state, backend ranking refinements, integration checks, known risks, and verification evidence for the unified **Restaurant Order AI** system.

---

## 1. Current Unified Project Structure

The project has been organized into a single repository structure to co-locate the frontend interface and backend services.

*   **Repository Root**: `/Users/vandabaer/Desktop/restaurant-order-ai`
*   **Frontend Path**: [frontend/](file:///Users/vandabaer/Desktop/restaurant-order-ai/frontend)
*   **Backend Path**: [backend/](file:///Users/vandabaer/Desktop/restaurant-order-ai/backend)

### Startup Process
The entire system is managed via a single execution script in the root directory:
- **Startup Script**: [start.sh](file:///Users/vandabaer/Desktop/restaurant-order-ai/start.sh) (runs both servers concurrently with background process trapping and clean shutdown on `Ctrl+C`).
- **Startup Command**:
  ```bash
  cd /Users/vandabaer/Desktop/restaurant-order-ai
  export GEMINI_API_KEY="your_api_key_here"
  ./start.sh
  ```

### API Endpoints Used
The React frontend communicates directly with the FastAPI backend via the following local endpoints:
*   `GET http://localhost:8000/api/health`: Health status and Gemini model verification.
*   `POST http://localhost:8000/api/extract`: Uploads documents (images/audio) or plain text, returns Gemini extraction schemas along with mapped catalog candidates.
*   `POST http://localhost:8000/api/feedback`: Logs reviewed/corrected order lines and operator actions to `feedback.jsonl` for downstream training and audit logs.

---

## 2. Frontend-Backend Integration Status

The integration between the React client and the FastAPI backend is fully operational and has been verified against real data:

*   **POST `/api/extract` Integration**: Verified. The frontend correctly serializes user inputs and uploaded files into `FormData` and posts them.
*   **POST `/api/feedback` Integration**: Verified. Confirming orders on the `ReviewPage` sends item action states (`confirmed` / `edited` / `rejected`), SKU codes, confidence levels, and validation flags to the feedback logger.
*   **Image Uploads**: Verified. The drag-and-drop container and standard file selectors in [UploadPage.tsx](file:///Users/vandabaer/Desktop/restaurant-order-ai/frontend/src/components/UploadPage.tsx) capture the raw `File` object and append it under the `"file"` parameter in the `FormData` upload body.
*   **Audio Uploads**: Verified. Audio recording captures raw audio files and transmits them to `/api/extract` as a `file` field with the correct mime type (e.g. `audio/wav`).
*   **Text Inputs**: Verified. Direct paste text is sent as a text field inside `FormData`.
*   **ReviewPage Mapped Backend Response**: Verified. The UI renders dynamic values fetched from the backend (selected SKU, alternatives, confidence labels, explanations), entirely bypassing `mockData.ts`.
*   **Back-to-Upload Button**: Verified. The "Zurück zur Eingabe" / "Back to upload" button correctly resets page state back to 1 without destroying order metadata.

---

## 3. Backend Logic Status

The backend core processing pipeline functions as follows:

*   **Gemini Extraction**: **Active**. Uses `gemini-2.5-flash` to parse images/audio/text and output structured order items.
*   **Catalog Loading**: **Active**. Automatically reads `CompleteItemArchive.xlsx` from the data directory.
*   **Catalog Size**: **6,453 products** loaded in memory at startup.
*   **Customer History/Template Loading**: **Active**. Loads customer-specific templates from `Schablone.xlsx` into `CUSTOMER_HISTORY`.
*   **Customer Code Propagation**: Verified. The frontend reads and propagates the `customerCode` dynamically (e.g. `"B0491"` extracted from the file name prefix or manual user input) to the backend matching functions.
*   **Template Boost Execution**: Verified. When a customer code matching an active template (e.g. `"B0491"`) is provided, template products receive the `+25` priority ranking boost.
*   **Feedback Persistence**: Verified. Feedback payloads are appended as JSON Lines to `/Users/vandabaer/Desktop/restaurant-order-ai/feedback.jsonl`.

---

## 4. Matching & Ranking Logic Status

The matching engine in [matching.py](file:///Users/vandabaer/Desktop/restaurant-order-ai/backend/app/matching.py) relies on a multi-stage scoring system:

### 1. Tokenization & Normalization
*   Cleans text, replaces German umlauts, strips special chars.
*   Applies a **German Compound Word Splitter** (`split_compounds()`) to dissect compound nouns into their root constituents (e.g. `"Brombeermarmelade"` -> `["brombeer", "marmelade"]`).
*   Resolves synonyms using `SYNONYMS` mappings (e.g., `"marmelade"`, `"marmellata"`, `"jam"` -> `"konfiture"`).

### 2. Base Similarity Score (`calculate_field_score`)
*   Compares the query tokens against catalog descriptions and aliases.
*   Calculates a token index weight (higher weight for earlier tokens in the product description) and applies length penalties to favor specificity.

### 3. Customer Template Boost & Safeguards
*   **Template Boost**: Trustworthy items present in the customer's template are granted a `+25` score boost.
*   **Semantic Overlap Safeguard**: To prevent unrelated template items (e.g. Edam cheese slices) from winning due to the boost, the boost is applied **only if**:
    1.  The base score is $\ge 35$, **AND**
    2.  At least one core product concept overlaps between the query and the candidate description/aliases (verified using `has_concept_overlap()`).
*   **Descriptor Exclusion**: Non-product descriptors and Italian/German adjectives (such as `affettato`, `fette`, `fresco`, `congelato`, `scheiben`) are excluded from triggering this concept overlap.

### 4. Variant Adjustments (`adjust_score_for_variants`)
*   Modifies scores based on package type conflicts (e.g., Sack vs. Karton vs. Eimer), portion vs. bulk sizes, specialty style mismatches, or explicit capacity matches (e.g., matching `"10l"` to `"10l"`).

### 5. Confidence Badge Mapping
*   **`HIGH_CONFIDENCE`**: Score $\ge 95$ and no ambiguous runner-up.
*   **`REVIEW_RECOMMENDED`**: Score between $85$ and $94$, or $\ge 95$ with an alternative candidate within $5$ points.
*   **`HUMAN_VALIDATION_REQUIRED`**: Score $< 85$, or between $85$ and $94$ with an alternative candidate within $5$ points.

---

## 5. Recent Fixes Completed

The following high-priority issues have been successfully addressed:

*   **Unified structure**: Moved both codebases into `~/Desktop/restaurant-order-ai`.
*   **Image Upload Bug**: Fixed the state tracking in `UploadPage.tsx` so the raw image `File` object is sent rather than an empty file reference.
*   **Review Page Navigation**: Added the "Back to Upload" button to return to the input screen safely.
*   **Customer Code Autofill**: Configured the frontend to detect and autofill customer codes from simulated files (e.g. selecting `B0491_0001.jpg` automatically sets `customerCode = "B0491"`).
*   **German Jam & Compound Matching**: Solved `"Brombeermarmelade"` failing to match blackberry jams (`CYB24`, `MMB20`, `MPB45`) by introducing compound noun splitting and mapping `"marmelade" <-> "konfiture"`.
*   **Template Boost Overshadowing**: Introduced a base score threshold ($\ge 35$) and concept overlap guard inside `score_product()` to prevent unrelated template products (like Edam cheese) from winning over catalog matches.

---

## 6. Known Remaining Issues & Risks

> [!WARNING]
> Please review these outstanding issues before deploying to production.

1.  **Unit Normalization Discrepancies**:
    *   *Issue*: Google Gemini extracts canonical English units (e.g., `can`, `bucket`, `piece`, `carton`, `sack`). However, the backend's variant adjustment matching logic in [matching.py](file:///Users/vandabaer/Desktop/restaurant-order-ai/backend/app/matching.py#L436-L474) expects German/Italian keywords (e.g., `dose`, `eimer`, `flasche`, `sack`, `karton`).
    *   *Risk*: When Gemini extracts `unit_hint = "can"`, the matching engine fails to match it to a product with unit `"dos"` because it is looking for the literal string `"dose"` or `"dos"`, not `"can"`.
2.  **Lack of Dialect Unit Translation**:
    *   *Issue*: Local South Tyrolean dialect terms (e.g. `"Kübl"` / `"Kuebl"` for bucket) are not mapped to Eimer/bucket inside either `extraction.py` or the matching logic.
3.  **Hardcoded Paths and Local Defaults**:
    *   *Issue*: The `DATA_DIR` env variable inside `start.sh` points to a local directory path (`/Users/vandabaer/Desktop/NLP PROJECT/...`).
    *   *Risk*: Running the script on another machine will fail unless this directory path is updated or generalized.
4.  **Unused Metadata Fields**:
    *   *Issue*: The UI gathers `orderReference` and `date` fields, but these are completely ignored by the backend extraction and feedback persistence pipelines.
5.  **Unused Frontend Assets**:
    *   *Issue*: The unused `mockData.ts` file remains in `/frontend/src/mockData.ts` and should be deleted to prevent future confusion.
6.  **Backup Directory Clutter**:
    *   *Issue*: The old backup directory `/Users/vandabaer/Desktop/NLP_Project_Giulia_Test` contains duplicate copies of the frontend and backend files, which could confuse developers if opened accidentally.

---

## 7. Recommended Next Steps

### HIGH PRIORITY
*   **Unify Unit Normalization**: Map Gemini's canonical English unit hints (`can`, `bucket`, `piece`, `carton`, `sack`) to their German/Italian equivalents in [matching.py](file:///Users/vandabaer/Desktop/restaurant-order-ai/backend/app/matching.py) so that variant adjustments (such as package type conflict penalties and unit match bonuses) apply correctly.
*   **Generalize `DATA_DIR`**: Modify `start.sh` to read `DATA_DIR` dynamically or fallback to a local relative directory inside the project root, rather than hardcoding a path.

### MEDIUM PRIORITY
*   **Remove Unused Code & Duplicates**: Delete the unused [frontend/src/mockData.ts](file:///Users/vandabaer/Desktop/restaurant-order-ai/frontend/src/mockData.ts) file.
*   **Capture Reference Metadata**: Extend the backend's `/api/extract` and `/api/feedback` endpoints to accept and log the `orderReference` and `date` values.

### LOW PRIORITY
*   **Dialect Synonyms**: Add dialect terms like `"kuebl"` and `"kuebel"` to the synonym dictionary.

---

## 8. Verification Evidence

### pytest Results
Running `pytest` in the `backend` folder yields 100% success across all 8 tests:
```
============================= test session starts ==============================
platform darwin -- Python 3.12.2, pytest-9.0.3, pluggy-1.6.0
rootdir: /Users/vandabaer/Desktop/restaurant-order-ai/backend
collected 8 items

tests/test_extraction.py .                                               [ 12%]
tests/test_matching.py ....                                              [ 62%]
tests/test_regression.py ...                                             [100%]

======================== 8 passed, 5 warnings in 5.86s =========================
```

### Frontend Build Results
Running linting and bundling compiles successfully:
*   `npm run lint`: Completed with **0 TypeScript errors**.
*   `npm run build`:
    ```
    transforming...
    ✓ 2082 modules transformed.
    dist/index.html                   0.41 kB │ gzip:   0.28 kB
    dist/assets/index-BztzNrmh.css   32.46 kB │ gzip:   6.80 kB
    dist/assets/index-DbYVXMw2.js   396.91 kB │ gzip: 121.58 kB
    ✓ built in 1.12s
    ```

### Example Matching Quality (Before vs After)

#### Test Item: `Brombeermarmelade`
| Metric | Before Refactoring | After Refactoring |
| :--- | :--- | :--- |
| **Tokenization** | `["brombeermarmelade"]` | `["brombeer", "konfiture"]` (via compound split & synonyms) |
| **Top Winner** | `MMO10` — Orange Marmalade | `CYB24` — Blackberry Jam (`Score: 94`) |
| **Reason** | Low/0 match against blackberry root; Orange marmalade won on generic letters. | Compound splitting maps query to blackberry and jam concepts correctly. |

#### Test Item: `Speck Alto Adige affettato` (Customer: `B0491`)
| Metric | Before Refactoring | After Refactoring |
| :--- | :--- | :--- |
| **Top Winner** | `KS04F` — Edam Cheese Slices (`Score: 71`) | `SC59F` — Südtiroler Markenspeck (`Score: 69`) |
| **Reason** | Cheese was in customer template, getting a blind `+25` boost. | Cheese fails concept overlap guard (descriptors like `affettato` ignored). Boost is denied. |
