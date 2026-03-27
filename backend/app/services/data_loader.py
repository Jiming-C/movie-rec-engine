import pandas as pd

from app.core.config import DATA_RAW_DIR


def load_ratings() -> pd.DataFrame:
    """Load ratings.csv from the raw data directory."""
    return pd.read_csv(DATA_RAW_DIR / "ratings.csv")


def load_movies() -> pd.DataFrame:
    """Load movies.csv from the raw data directory."""
    return pd.read_csv(DATA_RAW_DIR / "movies.csv")
