
import asyncio
import json
import os
import time

from collections import deque
from pathlib import Path

import joblib
import numpy as np

from fastapi import FastAPI, HTTPException, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import Response
from prometheus_client import (
    CONTENT_TYPE_LATEST,
    Counter,
    Gauge,
    Histogram,
    generate_latest
)
from pydantic import BaseModel


# --------------------------------------------------
# 1. Configuration
# --------------------------------------------------

MD = Path(os.getenv("MODEL_DIR", "models"))

CHAOS = os.getenv("CHAOS_ENABLED", "false").lower() == "true"

app = FastAPI(
    title="ChaosGuard AI API",
    version="1.0.0",
    description="ML-powered Network Intrusion Detection System"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_methods=["*"],
    allow_headers=["*"]
)


# --------------------------------------------------
# 2. Prometheus Metrics
# --------------------------------------------------

REQ = Counter(
    "cg_requests_total",
    "Total API requests",
    ["path", "status"]
)

PRED = Counter(
    "cg_predictions_total",
    "Total ML predictions",
    ["label"]
)

LAT = Histogram(
    "cg_predict_seconds",
    "Prediction latency"
)

LOADED = Gauge(
    "cg_model_loaded",
    "1 if model is loaded"
)

DRIFT = Gauge(
    "cg_drift_score",
    "Mean standardized feature shift"
)


# --------------------------------------------------
# 3. Global Variables
# --------------------------------------------------

bundle = None
ref = {}

recent = deque(maxlen=500)
lats = deque(maxlen=500)

sim = {}

cnt = {
    "req": 0,
    "err": 0
}


# --------------------------------------------------
# 4. Load Saved ML Model
# --------------------------------------------------

def load():
    global bundle, ref

    model_path = MD / "model.joblib"

    if model_path.exists():
        bundle = joblib.load(model_path)
    else:
        bundle = None

    reference_path = MD / "reference.json"

    if reference_path.exists():
        ref = json.loads(reference_path.read_text())
    else:
        ref = {}

    LOADED.set(1 if bundle else 0)


load()


# --------------------------------------------------
# 5. Chaos Simulation Helper
# --------------------------------------------------

def active(key):
    return sim.get(key, 0) > time.time()


# --------------------------------------------------
# 6. Data Drift Calculation
# --------------------------------------------------

def drift():

    if len(recent) < 20 or not ref:
        return 0.0

    mean_values = np.array(recent).mean(axis=0)

    reference_mean = np.array(ref["mean"])
    reference_std = np.array(ref["std"])

    score = np.mean(
        np.abs(mean_values - reference_mean)
        / (reference_std + 1e-9)
    )

    return float(score)


# --------------------------------------------------
# 7. Request Monitoring Middleware
# --------------------------------------------------

@app.middleware("http")
async def middleware(request: Request, call_next):

    response = await call_next(request)

    REQ.labels(
        request.url.path,
        str(response.status_code)
    ).inc()

    if request.url.path not in ("/metrics", "/health"):

        cnt["req"] += 1

        if response.status_code >= 400:
            cnt["err"] += 1

    return response


# --------------------------------------------------
# 8. Prediction Request Schema
# --------------------------------------------------

class Req(BaseModel):
    features: dict[str, float]


# --------------------------------------------------
# 9. Health Check API
# --------------------------------------------------

@app.get("/health")
def health():

    if bundle is None or active("artifact"):
        raise HTTPException(
            status_code=503,
            detail="model unavailable"
        )

    return {
        "status": "ok"
    }


# --------------------------------------------------
# 10. Get Required Model Features
# --------------------------------------------------

@app.get("/features")
def features():

    if bundle is None:
        raise HTTPException(
            status_code=503,
            detail="model unavailable"
        )

    return {
        "features": bundle["features"]
    }


# --------------------------------------------------
# 11. Model Information API
# --------------------------------------------------

@app.get("/model-info")
def info():

    return {
        "name": bundle["name"] if bundle else "none",
        "version": bundle["version"] if bundle else "-",
        "loaded": bool(bundle) and not active("artifact")
    }


# --------------------------------------------------
# 12. FEATURE IMPORTANCE API (NEW)
# --------------------------------------------------

@app.get("/feature-importance")
def feature_importance():

    if bundle is None or active("artifact"):
        raise HTTPException(
            status_code=503,
            detail="model unavailable"
        )

    model = bundle["model"]
    feature_names = bundle["features"]

    importance_values = model.feature_importances_

    importance = [
        {
            "name": name,
            "importance": float(value)
        }
        for name, value in zip(
            feature_names,
            importance_values
        )
    ]

    # Sort from highest to lowest importance
    importance.sort(
        key=lambda item: item["importance"],
        reverse=True
    )

    return {
        "model": bundle["name"],
        "total_features": len(importance),
        "features": importance
    }


# --------------------------------------------------
# 13. ML Prediction API
# --------------------------------------------------

@app.post("/predict")
async def predict(request: Req):

    start_time = time.perf_counter()

    # Simulated API failure
    if active("fail"):
        raise HTTPException(
            status_code=503,
            detail="simulated API failure"
        )

    if bundle is None or active("artifact"):
        raise HTTPException(
            status_code=503,
            detail="model unavailable"
        )

    # Check missing features
    missing = [
        feature
        for feature in bundle["features"]
        if feature not in request.features
    ]

    if missing:
        raise HTTPException(
            status_code=422,
            detail=f"missing features: {missing}"
        )

    # Simulated latency
    if active("latency"):
        await asyncio.sleep(
            sim.get("latency_ms", 800) / 1000
        )

    # Arrange input features in the exact training order
    row = [
        request.features[feature]
        for feature in bundle["features"]
    ]

    # Predict using Random Forest
    probabilities = bundle["model"].predict_proba([row])[0]

    label = (
        "ATTACK"
        if probabilities[1] >= 0.5
        else "BENIGN"
    )

    confidence = float(max(probabilities))

    # Update monitoring metrics
    PRED.labels(label).inc()

    recent.append(row)

    DRIFT.set(drift())

    duration = time.perf_counter() - start_time

    LAT.observe(duration)
    lats.append(duration)

    return {
        "prediction": label,
        "confidence": confidence
    }


# --------------------------------------------------
# 14. Model Evaluation + Runtime Metrics
# --------------------------------------------------

@app.get("/metrics-summary")
def summary():

    metrics_path = Path("metrics.json")

    if metrics_path.exists():
        metrics = json.loads(metrics_path.read_text())
    else:
        metrics = {}

    latency_p95 = (
        float(np.percentile(lats, 95) * 1000)
        if lats
        else 0.0
    )

    return {
        "accuracy": metrics.get("accuracy"),
        "precision": metrics.get("precision"),
        "recall": metrics.get("recall"),
        "f1": metrics.get("f1"),
        "roc_auc": metrics.get("roc_auc"),

        "requests": cnt["req"],
        "errors": cnt["err"],

        "error_rate": (
            cnt["err"] / max(cnt["req"], 1)
        ),

        "latency_p95_ms": latency_p95,
        "drift_score": drift()
    }


# --------------------------------------------------
# 15. Prometheus Metrics Endpoint
# --------------------------------------------------

@app.get("/metrics")
def metrics():

    return Response(
        generate_latest(),
        media_type=CONTENT_TYPE_LATEST
    )


# --------------------------------------------------
# 16. Chaos Engineering Simulation APIs
# --------------------------------------------------

@app.post("/sim/{kind}")
def start(
    kind: str,
    seconds: int = 20,
    ms: int = 800
):

    if not CHAOS:
        raise HTTPException(
            status_code=403,
            detail="chaos endpoints disabled; set CHAOS_ENABLED=true"
        )

    seconds = max(1, min(seconds, 120))

    # Simulate data drift
    if kind == "drift" and ref:

        mean_values = np.array(ref["mean"])
        std_values = np.array(ref["std"]) + 1e-9

        for _ in range(300):

            simulated_row = (
                mean_values
                + 4 * std_values
                + np.random.randn(len(mean_values))
                * std_values * 0.2
            )

            recent.append(simulated_row.tolist())

        DRIFT.set(drift())

        return {
            "kind": kind,
            "drift_score": drift()
        }

    # Supported simulations
    if kind not in ("latency", "fail", "artifact"):

        raise HTTPException(
            status_code=404,
            detail="unknown simulation"
        )

    sim[kind] = time.time() + seconds
    sim["latency_ms"] = ms

    return {
        "kind": kind,
        "expires_in_s": seconds
    }


# --------------------------------------------------
# 17. Reset Chaos Simulations
# --------------------------------------------------

@app.post("/sim-reset")
def reset():

    if not CHAOS:
        raise HTTPException(
            status_code=403,
            detail="chaos endpoints disabled"
        )

    sim.clear()
    recent.clear()

    DRIFT.set(0)

    return {
        "status": "reset"
    }
