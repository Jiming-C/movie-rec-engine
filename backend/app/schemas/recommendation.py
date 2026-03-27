from pydantic import BaseModel


class HealthResponse(BaseModel):
    status: str


class MovieOut(BaseModel):
    movieId: int
    title: str


class RecommendationOut(BaseModel):
    movieId: int
    title: str
    genres: str
    predicted_score: float
