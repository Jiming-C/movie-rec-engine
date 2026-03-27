from pathlib import Path

BASE_DIR = Path(__file__).resolve().parent.parent.parent  # backend/

DATA_DIR = BASE_DIR / "data"
DATA_RAW_DIR = DATA_DIR / "raw" / "ml-latest-small"
DATA_PROCESSED_DIR = DATA_DIR / "processed"

ARTIFACTS_DIR = BASE_DIR / "artifacts"
MODELS_DIR = ARTIFACTS_DIR / "models"
