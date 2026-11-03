import datetime as dt
import json
from pathlib import Path

import joblib
import numpy as np
import pandas as pd
import yaml

from sklearn.ensemble import RandomForestClassifier
from sklearn.metrics import (
    accuracy_score,
    precision_score,
    recall_score,
    f1_score,
    roc_auc_score,
    confusion_matrix,
    classification_report
)
from sklearn.model_selection import train_test_split


# 1. Read configuration
with open("params.yaml", "r", encoding="utf-8") as file:
    config = yaml.safe_load(file)

DATA_PATH = Path(config["data"]["path"])
SEED = config["seed"]
SAMPLE_FRAC = 0.08

print("=" * 55)
print("CHAOSGUARD AI - MODEL TRAINING")
print("=" * 55)

if not DATA_PATH.exists():
    raise FileNotFoundError(f"Dataset not found: {DATA_PATH}")


# 2. Read the large CSV in smaller chunks
print("\nReading dataset in memory-efficient chunks...")

sampled_chunks = []
total_rows = 0

for chunk_number, chunk in enumerate(
    pd.read_csv(DATA_PATH, chunksize=50000, low_memory=False),
    start=1
):
    chunk.columns = chunk.columns.str.strip()

    chunk["Label"] = pd.to_numeric(chunk["Label"], errors="coerce")
    chunk = chunk.replace([np.inf, -np.inf], np.nan)
    chunk = chunk.dropna(subset=["Label"])

    # Keep only the binary labels 0 and 1
    chunk = chunk[chunk["Label"].isin([0, 1])]

    # Sample each chunk so the full dataset is not loaded into RAM
    if len(chunk) > 0:
        sampled = chunk.sample(
            frac=SAMPLE_FRAC,
            random_state=SEED + chunk_number
        )
        sampled_chunks.append(sampled)

    total_rows += len(chunk)

    print(
        f"Processed chunk {chunk_number} | "
        f"Rows scanned: {total_rows:,}"
    )

if not sampled_chunks:
    raise ValueError("No valid records found in the dataset.")

df = pd.concat(sampled_chunks, ignore_index=True)
df = df.sample(frac=1, random_state=SEED).reset_index(drop=True)

print("\nTotal valid rows scanned:", f"{total_rows:,}")
print("Sampled rows:", f"{len(df):,}")


# 3. Separate features and target
y = df["Label"].astype(int)

X = df.drop(
    columns=["Label", "Original_Label"],
    errors="ignore"
).select_dtypes(include=[np.number])

X = X.replace([np.inf, -np.inf], np.nan)
X = X.fillna(X.median()).astype("float32")

if X.shape[1] == 0:
    raise ValueError("No numeric features available for training.")

print("\nNumber of features:", X.shape[1])
print("Class distribution:")
print(y.value_counts().sort_index().rename(index={
    0: "BENIGN",
    1: "ATTACK"
}))

if y.nunique() != 2:
    raise ValueError("Training data must contain both BENIGN and ATTACK records.")


# 4. Split training and testing data
X_train, X_test, y_train, y_test = train_test_split(
    X,
    y,
    test_size=config["test_size"],
    random_state=SEED,
    stratify=y
)

print("\nTraining records:", f"{len(X_train):,}")
print("Testing records:", f"{len(X_test):,}")


# 5. Train Random Forest
print("\nTraining Random Forest model...")

model = RandomForestClassifier(
    random_state=SEED,
    n_jobs=-1,
    class_weight="balanced_subsample",
    **config["rf"]
)

model.fit(X_train, y_train)

print("Model training completed!")


# 6. Evaluate model
predictions = model.predict(X_test)
probabilities = model.predict_proba(X_test)[:, 1]

metrics = {
    "accuracy": float(accuracy_score(y_test, predictions)),
    "precision": float(precision_score(y_test, predictions, zero_division=0)),
    "recall": float(recall_score(y_test, predictions, zero_division=0)),
    "f1": float(f1_score(y_test, predictions, zero_division=0)),
    "roc_auc": float(roc_auc_score(y_test, probabilities))
}

print("\n========== MODEL RESULTS ==========")

for name, value in metrics.items():
    print(f"{name.upper():12}: {value:.4f}")

print("\nConfusion Matrix:")
print(confusion_matrix(y_test, predictions))

print("\nClassification Report:")
print(
    classification_report(
        y_test,
        predictions,
        target_names=["BENIGN", "ATTACK"],
        zero_division=0
    )
)


# 7. Save model and reference statistics
Path("models").mkdir(exist_ok=True)

bundle = {
    "model": model,
    "features": list(X.columns),
    "name": "Random Forest",
    "version": config["model_version"]
}

joblib.dump(bundle, "models/model.joblib")

reference = {
    "mean": X_train.mean().tolist(),
    "std": X_train.std().fillna(0).tolist()
}

with open("models/reference.json", "w", encoding="utf-8") as file:
    json.dump(reference, file, indent=2)


# 8. Save evaluation metrics
training_time = dt.datetime.now().strftime("%Y%m%d-%H%M%S")

result = {
    "best": "Random Forest",
    "version": config["model_version"],
    "dataset": "CIC-IDS2017",
    "rows_scanned": int(total_rows),
    "sampled_rows": int(len(df)),
    "training_rows": int(len(X_train)),
    "testing_rows": int(len(X_test)),
    "features": int(X.shape[1]),
    "class_distribution": {
        "BENIGN": int((y == 0).sum()),
        "ATTACK": int((y == 1).sum())
    },
    **metrics,
    "confusion_matrix": confusion_matrix(y_test, predictions).tolist()
}

with open("metrics.json", "w", encoding="utf-8") as file:
    json.dump(result, file, indent=2)

# 9. Save experiment history
experiment_file = Path("experiments.csv")
experiment = pd.DataFrame([{
    "id": f"exp-{training_time}",
    "dataset": "CIC-IDS2017",
    "model": "1.0",
    "algorithm": "Random Forest",
    **metrics,
    "trained": training_time
}])

experiment.to_csv(
    experiment_file,
    mode="a",
    header=not experiment_file.exists(),
    index=False
)

print("\n========== SAVED FILES ==========")
print("models/model.joblib")
print("models/reference.json")
print("metrics.json")
print("experiments.csv")

print("\nCHAOSGUARD AI MODEL TRAINING COMPLETED!")
