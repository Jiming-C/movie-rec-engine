from fastapi import APIRouter, HTTPException, Query

from app.schemas.recommendation import HealthResponse, MovieOut, RecommendationOut
from app.services.data_loader import load_movies, load_ratings
from app.services.recommender import (
    explain_recommendation,
    get_embedding_map,
    get_recommendations,
    get_training_history,
)

router = APIRouter()

_movies_cache: list[dict] | None = None


@router.get("/health", response_model=HealthResponse)
def health():
    return {"status": "ok"}


@router.get("/recommend/{user_id}", response_model=list[RecommendationOut])
def recommend(user_id: int, top_n: int = Query(default=10, ge=1, le=100)):
    try:
        return get_recommendations(user_id, top_n)
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))


@router.get("/movies", response_model=list[MovieOut])
def movies():
    global _movies_cache
    if _movies_cache is None:
        df = load_movies()
        _movies_cache = [
            {"movieId": row["movieId"], "title": row["title"]}
            for _, row in df.iterrows()
        ]
    return _movies_cache


@router.get("/movies/{movie_id}/users")
def movie_users(movie_id: int):
    df = load_ratings()
    user_ids = df.loc[df["movieId"] == movie_id, "userId"].unique().tolist()
    if not user_ids:
        raise HTTPException(status_code=404, detail=f"No ratings for movie {movie_id}")
    return {"user_ids": user_ids}


@router.get("/training/history")
def training_history():
    return get_training_history()


@router.get("/explain/{user_id}")
def explain(user_id: int, top_n: int = Query(default=5, ge=1, le=20)):
    try:
        return explain_recommendation(user_id, top_n)
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))


@router.get("/embeddings/map")
def embedding_map():
    return get_embedding_map()
