#!/bin/bash

# Configuration
export GEMINI_MODEL="gemini-2.5-flash"
export DATA_DIR="/Users/vandabaer/Desktop/NLP PROJECT/Start Data Project /OneDrive_1_5-25-2026"

# Ensure GEMINI_API_KEY is set or notify user
if [ -z "$GEMINI_API_KEY" ]; then
  echo "========================================================================="
  echo "WARNING: GEMINI_API_KEY environment variable is not set."
  echo "The backend will run with fallback mock extraction."
  echo "To use live Gemini, stop (Ctrl+C) and run: export GEMINI_API_KEY=\"your_key\""
  echo "========================================================================="
fi

# Cleanup function to kill backend and frontend background processes on exit
cleanup() {
  echo ""
  echo "Stopping backend and frontend servers..."
  kill "$BACKEND_PID" "$FRONTEND_PID" 2>/dev/null
  exit 0
}

# Trap terminal exits (Ctrl+C)
trap cleanup SIGINT SIGTERM

echo "Starting Restaurant Order AI Unified Project..."

# 1. Start the backend
echo "Starting FastAPI Backend on port 8000..."
cd backend
python3 -m uvicorn app.main:app --reload --port 8000 &
BACKEND_PID=$!
cd ..

# 2. Start the frontend
echo "Starting React Frontend on port 3000..."
cd frontend
npm run dev -- --port 3000 --host 0.0.0.0 &
FRONTEND_PID=$!
cd ..

# Wait for servers to initialize
sleep 2

echo ""
echo "=================================================="
echo "Restaurant Order AI is running!"
echo "Backend:  http://localhost:8000/api/health"
echo "Frontend: http://localhost:3000"
echo "=================================================="
echo "Press Ctrl+C to terminate both servers."
echo ""

# Keep running and wait for background processes
wait "$BACKEND_PID" "$FRONTEND_PID"
