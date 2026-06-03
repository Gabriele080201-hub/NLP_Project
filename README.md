# Restaurant Order AI — Reconstruction Engine & UI

AI-powered order reconstruction for **Foppa GmbH**, a food wholesaler in South Tyrol (Italy).
Customers send orders as photos, screenshots, PDFs, typed messages or voice notes, mixing
German, Italian and the local South Tyrolean dialect. The system extracts the order lines
(via Google Gemini), matches them against the real product catalog, and lets an operator
review and confirm the result.

It is made of two parts:

- **`backend/`** — FastAPI engine: Gemini extraction + fuzzy catalog matching. Ships with the
  real masterdata catalog bundled in `backend/data/`, so it works right after cloning.
- **`frontend/`** — React + Vite validation/editorial interface.

---

## Prerequisites

| Tool | Version (tested) | Notes |
|------|------------------|-------|
| Python | 3.10+ (3.13) | for the backend |
| Node.js | 18+ (24) | for the frontend |
| Gemini API key | — | from [Google AI Studio](https://aistudio.google.com/apikey) |

---

## Quick Start

Clone the repo, then set up the two parts. **The only configuration you need is your Gemini
API key** — the product catalog is already bundled in the repo.

### 1. Backend

```bash
cd backend

# Install dependencies
pip install -r requirements.txt

# Create your .env from the template and add your key
cp .env.example .env        # Windows PowerShell: Copy-Item .env.example .env
# then edit .env and set GEMINI_API_KEY=...
```

Run the API (from inside `backend/`):

```bash
python -m uvicorn app.main:app --reload --port 8000
```

The backend is now at **http://localhost:8000**. Verify it:

```bash
curl http://localhost:8000/api/health
# {"ok":true,"live_gemini":true,"model":"gemini-2.5-flash","catalog_size":6453}
```

- `live_gemini: true` → your API key is loaded and real extraction is active.
- `catalog_size: 6453` → the bundled catalog loaded correctly.

### 2. Frontend

In a **second terminal**:

```bash
cd frontend
npm install
npm run dev
```

Open **http://localhost:3000**. The UI talks to the backend on port 8000 automatically.

---

## Configuration (`backend/.env`)

Copy `backend/.env.example` to `backend/.env` and fill it in. **`.env` is git-ignored and must
never be committed.**

| Variable | Required | Description |
|----------|----------|-------------|
| `GEMINI_API_KEY` | **Yes** | Google Gemini key. Without it the backend falls back to fixed mock data (same output for every input). |
| `GEMINI_MODEL` | No | Extraction model. Default `gemini-2.5-flash`. |
| `DATA_DIR` | No | Path to an alternative masterdata folder containing `2. Masterdata/`. **Leave empty** to use the catalog bundled in `backend/data/` (the default). If the path is invalid, the backend automatically falls back to the bundled data. |

The backend loads `.env` automatically on startup (no need to export variables manually).

### Catalog data

The matching catalog (`CompleteItemArchive.xlsx`) and customer templates (`Schablone.xlsx`) live
in `backend/data/2. Masterdata/` and are loaded into memory at startup. To use an updated
catalog without editing the repo, point `DATA_DIR` at another folder that contains a
`2. Masterdata/` subfolder with those two files.

---

## How it works (end-to-end)

1. **Upload / paste** — paste a WhatsApp-style order or upload an image/PDF/audio file.
2. **AI extraction** — the frontend calls `POST /api/extract`; Gemini returns structured order lines.
3. **Matching** — each line is fuzzy-matched against the catalog with a confidence label.
4. **Review** — the operator checks notes, logistics and SKU candidates, and adjusts as needed.
5. **Confirm** — `POST /api/feedback` logs the operator's overrides to `backend/feedback.jsonl`.

### API endpoints

| Method | Path | Purpose |
|--------|------|---------|
| `GET`  | `/api/health` | Status, model, live-Gemini flag, catalog size |
| `POST` | `/api/extract` | Extract + match an order (`text` or `file` form field) |
| `POST` | `/api/feedback` | Persist operator validation feedback |

---

## Alternative: run both with one script (macOS/Linux)

`start.sh` launches backend (`:8000`) and frontend (`:3000`) together and shuts both down on
`Ctrl + C`. It requires `bash`, so on Windows use the two-terminal flow above (or run it from
Git Bash / WSL).

```bash
export GEMINI_API_KEY="YOUR_KEY"
chmod +x start.sh
./start.sh
```

---

## Troubleshooting

- **Same output for every file / `live_gemini: false`** — `GEMINI_API_KEY` is not set in
  `backend/.env`. The backend is running in mock mode.
- **`catalog_size: 5`** — the bundled data wasn't found and the mock catalog is in use. Confirm
  `backend/data/2. Masterdata/` contains both `.xlsx` files, or set `DATA_DIR`.
- **`403 PERMISSION_DENIED ... API key was reported as leaked`** — generate a fresh key in AI
  Studio and update `backend/.env`.
