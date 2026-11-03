# ChaosGuard AI: Intelligent Network Threat Detection and ML Reliability Platform
backend/   ML pipeline (Random Forest + XGBoost), DVC, FastAPI, Prometheus, Grafana, Docker, CI
frontend/  React + Vite + TypeScript + Tailwind dashboard

## Run
1. cd backend && pip install -r requirements.txt
2. Put your dataset at backend/data/raw/traffic.csv (Label column; BENIGN vs anything else = ATTACK; edit params.yaml if your column differs), or run python src/make_demo_data.py for synthetic data.
3. python src/train.py   (or dvc init && dvc repro)
4. CHAOS_ENABLED=true uvicorn app.main:app --port 8000
5. cd ../frontend && npm install && npm run dev   (open http://localhost:5173; /api is proxied to :8000)
6. Optional: cd backend && docker compose up --build  (Prometheus :9090, Grafana :3000)

## What is live vs demo
Live when the API is up: Prediction Lab, Threat Detection, Model Monitoring (quality metrics from the last training run, latency/errors/drift/requests live), Failure Simulation (real /sim drills with measured recovery), Settings connection test.
Always demo/sample and labelled: Overview, Live Traffic (simulated stream), Reports contents, sample Experiments (upload backend/experiments.csv to see recorded runs), landing metrics. Login pages are a UI demo only.
Not verified: this project was written without being executed. Run the tests (cd backend && pytest -q) and npm run build, and fix anything that fails.
