# Restaurant Order AI (Reconstruction Engine & UI)

A unified workspace organizing the Foppa AI Order Reconstruction system. It comprises a FastAPI backend matching engine powered by Google Gemini, and Giulia's React validation/editorial interface.

## Workspace Structure

```
restaurant-order-ai/
├── backend/            # FastAPI matching engine & excel data loader
│   ├── app/            # Core business logic (extraction.py, matching.py, etc.)
│   ├── tests/          # Suite of automated tests
│   ├── requirements.txt
│   └── app.py
├── frontend/           # Giulia's React/Vite web application
│   ├── src/            # Components, styles, translations and types
│   ├── package.json
│   └── vite.config.ts
└── README.md           # This file
```

---

## Quick Start (Unified Project Startup)

You can run both the frontend and backend simultaneously using the provided `start.sh` script in the root folder.

### 1. Set Environment Variables
Set your Gemini API Key in your terminal:
```bash
export GEMINI_API_KEY="YOUR_ACTUAL_GEMINI_API_KEY"
```

### 2. Run the Startup Script
Make sure the script is executable and run it:
```bash
chmod +x start.sh
./start.sh
```

This script will spin up both the FastAPI backend on port `8000` and the React frontend on port `3000`. You will see the URLs printed:
- **Backend Health**: `http://localhost:8000/api/health`
- **Frontend App**: `http://localhost:3000`

### 3. Stopping the Servers
To stop both servers and shut down all background processes running the application, simply press **`Ctrl + C`** in the terminal window where `./start.sh` is running. The script traps terminal terminations and kills all associated background tasks cleanly.

If you ever need to manually stop any orphaned processes, you can run:
```bash
kill $(lsof -t -i:8000 -i:3000)
```

---

## Alternative Manual Run Instructions

### 1. Backend Setup & Run

The backend serves the order extraction and matching APIs at `http://localhost:8000`.

#### Installation
Run the following inside the `backend` folder:
```bash
cd backend
pip install -r requirements.txt
```

#### Running the Backend
To start the FastAPI dev server manually, run the following commands:
```bash
cd backend
export GEMINI_API_KEY="YOUR_ACTUAL_GEMINI_API_KEY"
export GEMINI_MODEL="gemini-2.5-flash"
export DATA_DIR="/Users/vandabaer/Desktop/NLP PROJECT/Start Data Project /OneDrive_1_5-25-2026"
python3 -m uvicorn app.main:app --reload --port 8000
```

### 2. Frontend Setup & Run

Giulia's React interface runs on port `3000` and automatically connects to the backend API.

#### Installation
From the root directory, navigate to the `frontend` folder and install dependencies:
```bash
cd frontend
npm install
```

#### Running the Frontend
To start the Vite dev server manually, run:
```bash
cd frontend
npm run dev
```

Open your browser and navigate to `http://localhost:3000`.

---

## End-to-End Extraction & Validation Flow
1. **Upload / Paste**: Paste a WhatsApp order message or upload a document on the upload page (or click one of the simulation triggers).
2. **AI Extraction**: The frontend calls `POST http://localhost:8000/api/extract` sending the data.
3. **Review**: Check extraction notes, logistics, confidence badges, and adjust mapped SKU candidates if necessary.
4. **ERP Submission**: Clicking **Confirm Order** compiles all changes, submits validation feedback to the backend (`POST http://localhost:8000/api/feedback` to log operator overrides), and transitions to the success screen.

