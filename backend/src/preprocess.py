
import pandas as pd
import numpy as np
from pathlib import Path

# Dataset locations
RAW_DIR = Path("data/raw/cicids2017")
PROCESSED_DIR = Path("data/processed")

PROCESSED_DIR.mkdir(parents=True, exist_ok=True)

OUTPUT_FILE = PROCESSED_DIR / "cicids2017_clean.csv"

# CIC-IDS2017 CSV files
files = sorted(RAW_DIR.glob("*.csv"))

if not files:
    raise FileNotFoundError("No CIC-IDS2017 CSV files found!")

print("CIC-IDS2017 PREPROCESSING STARTED")
print("Files found:", len(files))

# Process files in chunks to control RAM usage
for file_index, file in enumerate(files, start=1):

    print(f"\nProcessing {file_index}/{len(files)}: {file.name}")

    for chunk_index, chunk in enumerate(
        pd.read_csv(file, chunksize=50000, low_memory=False)
    ):

        # Clean column names
        chunk.columns = chunk.columns.str.strip()

        # Clean labels
        chunk["Label"] = chunk["Label"].astype(str).str.strip()

        # Remove duplicate rows within each chunk
        chunk = chunk.drop_duplicates()

        # Convert numeric columns safely
        feature_columns = [
            col for col in chunk.columns if col != "Label"
        ]

        for col in feature_columns:
            chunk[col] = pd.to_numeric(chunk[col], errors="coerce")

        # Replace infinity with missing values
        chunk.replace([np.inf, -np.inf], np.nan, inplace=True)

        # Remove rows with missing numeric features
        chunk.dropna(inplace=True)

        # Keep original attack category
        chunk["Original_Label"] = chunk["Label"]

        # Binary classification target
        chunk["Label"] = (
            chunk["Original_Label"].str.upper() != "BENIGN"
        ).astype(int)

        # Save processed data incrementally
        chunk.to_csv(
            OUTPUT_FILE,
            mode="a",
            header=not OUTPUT_FILE.exists(),
            index=False
        )

        print(
            f"  Chunk {chunk_index + 1} processed: "
            f"{len(chunk)} rows"
        )

print("\nPREPROCESSING COMPLETED!")

print("Saved dataset:", OUTPUT_FILE)

# Display processed dataset information
df = pd.read_csv(OUTPUT_FILE, nrows=5)

print("\nColumns:", len(df.columns))
print("Sample data:")
print(df.head())

print("\nBinary labels:")
print(df["Label"].value_counts())
