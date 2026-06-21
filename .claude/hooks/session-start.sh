#!/bin/bash
set -euo pipefail

if [ "${CLAUDE_CODE_REMOTE:-}" != "true" ]; then
  exit 0
fi

echo '{"async": true, "asyncTimeout": 300000}'

cd "$CLAUDE_PROJECT_DIR"

uv pip install --system \
  "fastapi>=0.110" \
  "uvicorn[standard]>=0.27" \
  "pydantic>=2.6" \
  "python-dotenv>=1.0.0" \
  "yfinance>=0.2.40" \
  "fredapi>=0.5" \
  "pandas>=2.0" \
  "numpy>=1.24" \
  "statsmodels>=0.14" \
  "lightgbm>=4.0" \
  "mapie>=0.8" \
  "shap>=0.43" \
  "scikit-learn>=1.3" \
  "feedparser>=6.0" \
  "google-genai>=1.0" \
  "pyarrow>=14.0" \
  "openpyxl>=3.1" \
  "pytest>=8.0"

echo "export PYTHONPATH=\"$CLAUDE_PROJECT_DIR\"" >> "$CLAUDE_ENV_FILE"
