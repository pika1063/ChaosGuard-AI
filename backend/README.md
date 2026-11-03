# ChaosGuard AI backend (ML pipeline + FastAPI + monitoring)
1. pip install -r requirements.txt
2. Put your dataset at data/raw/traffic.csv (needs a Label column; BENIGN vs anything else = ATTACK) or run python src/make_demo_data.py for synthetic data. Set data.label in params.yaml if yours differs.
3. python src/train.py (or dvc init && dvc repro). Trains Random Forest and XGBoost, keeps the best by F1, writes models/, metrics.json, experiments.csv.
4. CHAOS_ENABLED=true uvicorn app.main:app --port 8000
5. docker compose up --build runs API, Prometheus (9090), Grafana (3000, dashboard pre-provisioned). Build after training (the Dockerfile copies models/).
Endpoints: /health /features /model-info /predict /metrics-summary /metrics, plus POST /sim/{latency|fail|artifact|drift} and /sim-reset (only when CHAOS_ENABLED=true).
Upload experiments.csv on the frontend Experiments page to see recorded runs. scripts/load_test.py runs the traffic-spike drill.
