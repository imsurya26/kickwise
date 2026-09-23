# KICKWISE — Bundesliga Match Intelligence & Tactical What-If Simulator

[![KICKWISE CI](https://github.com/kickwise/kickwise/actions/workflows/ci.yml/badge.svg)](https://github.com/kickwise/kickwise/actions)
[![License: MIT](https://img.shields.io/badge/License-MIT-cyan.svg)](https://opensource.org/licenses/MIT)
[![Python 3.11+](https://img.shields.io/badge/Python-3.11+-emerald.svg)](https://www.python.org/)
[![Next.js 15](https://img.shields.io/badge/Next.js-15.0-white.svg)](https://nextjs.org/)

> **Read the game before it happens.**
> KICKWISE is a production-grade Bundesliga football intelligence platform combining XGBoost multiclass outcome classification, statsmodels bivariate Poisson regression for scorelines, SHAP TreeExplainer feature attributions, and a Next.js 15 Dark Industrial Telemetry dashboard.

---

## ⚡ Architecture Overview

```
KICKWISE
├── Data Pipeline (Kaggle Ingestion -> Per-90 Normalization -> Schema Validation -> Supabase DB)
├── ML Engine (Time-Aware Features -> XGBoost Multiclass Classifier + Poisson GLM + SHAP TreeExplainer)
├── Backend API (FastAPI `/simulate` endpoint with deterministic What-If simulation)
├── Frontend (Next.js 15 App Router + Tailwind CSS + Bento Grid + Interactive Football Pitch)
└── Automation (GitHub Actions weekly data update cron pipeline)
```

---

## 🧠 ML Modeling Architecture

### 1. Multiclass Match Outcome (XGBoost)
* **Target Classes**: `HOME_WIN (0)`, `DRAW (1)`, `AWAY_WIN (2)`
* **Validation Strategy**: Time-aware chronological splits (no future data leakage).
* **Lineup Feature Weighting**:
  * **Attackers (FWD)**: Finishing efficiency ($xG/90$), shot volume, conversion rates.
  * **Midfielders (MID)**: Progressive passes, progressive carries, key passes ($xA/90$), pressure triggers.
  * **Defenders (DEF)**: Tackles per 90, interceptions, clearances, block percentage.
  * **Goalkeepers (GK)**: Post-shot expected goals prevented ($PSxG+/-$).

### 2. Scoreline Distribution (Bivariate Poisson Regression)
* Fits home attack & away defence parameters via Poisson Generalized Linear Models (GLM).
* Generates a complete $6 \times 6$ (0 to 5 goals) bivariate joint probability matrix:
$$P(X=h, Y=a) = \frac{e^{-\lambda_h} \lambda_h^h}{h!} \times \frac{e^{-\lambda_a} \lambda_a^a}{a!}$$

### 3. SHAP TreeExplainer & Plain-English Tactical Reasoning
* Computes exact Shapley values for each match simulation.
* Synthesizes automated, plain-English tactical insights with:
  * **Primary Driver**: Decisive tactical or form factor favoring the predicted outcome.
  * **Tactical Factor**: Specific expected goals ($xG$) differential and progression metrics.
  * **Counter-Signal**: Remaining upset threat or turnover risk identified by the model.

---

## 🛠️ Quickstart & Local Installation

### Prerequisites
* Python 3.11+
* Node.js 20+
* Supabase Account & Kaggle API Credentials

### 1. Clone & Environment Setup
```bash
git clone https://github.com/kickwise/kickwise.git
cd kickwise
cp .env.example .env
```

Fill in your Supabase and Kaggle credentials in `.env`.

### 2. Python Backend & ML Training
```bash
# Create and activate virtual environment
python -m venv .venv
source .venv/bin/activate # On Windows: .venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Run initial offline data seeding and ML training
python scripts/seed_reference_data.py
python ml/train_model.py

# Launch FastAPI Service
uvicorn api.main:app --host 0.0.0.0 --port 8000 --reload
```

### 3. Next.js 15 Frontend
```bash
# In a separate terminal
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to access the KICKWISE dashboard.

---

## 📡 API Reference

### `POST /simulate`
Runs real-time tactical What-If match simulation.

**Request Payload**:
```json
{
  "home_team": "Bayern Munich",
  "away_team": "Borussia Dortmund",
  "home_lineup": [
    {
      "player_id": "bay_10",
      "player_name": "Harry Kane",
      "team": "Bayern Munich",
      "position": "FWD",
      "xg_90": 0.94,
      "xa_90": 0.28,
      "tackles_90": 0.6,
      "interceptions_90": 0.4,
      "pressures_90": 11.4,
      "minutes": 2600
    }
  ],
  "away_lineup": [...]
}
```

**Response**:
```json
{
  "home_win_probability": 0.624,
  "draw_probability": 0.218,
  "away_win_probability": 0.158,
  "expected_home_goals": 2.34,
  "expected_away_goals": 1.08,
  "predicted_score": "2-1",
  "scoreline_probabilities": [...],
  "radar": { ... },
  "shap_features": [ ... ],
  "tactical_summary": "• Primary Driver: Bayern Munich's superior attacking depth...",
  "model_version": "v1.2.0-prod-xgb",
  "duration_ms": 28
}
```

---

## 🧪 Testing Suite

Execute Python test suite:
```bash
pytest tests/ -v
```

Execute frontend typecheck:
```bash
npm run type-check
```

---

## 📄 License
MIT License. Built for Bundesliga intelligence & tactical simulation.
