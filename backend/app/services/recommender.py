import json
import pickle

import numpy as np
import torch
from sklearn.decomposition import PCA

from app.core.config import MODELS_DIR
from app.models.mf_model import MatrixFactorization
from app.services.data_loader import load_movies

# Load ID mappings
with open(MODELS_DIR / "id_mappings.pkl", "rb") as f:
    _mappings = pickle.load(f)

_user_to_idx: dict[int, int] = _mappings["user_to_idx"]
_item_to_idx: dict[int, int] = _mappings["item_to_idx"]
_idx_to_item: dict[int, int] = {v: k for k, v in _item_to_idx.items()}

# Load model
_num_users = len(_user_to_idx)
_num_items = len(_item_to_idx)
_model = MatrixFactorization(_num_users, _num_items)
_model.load_state_dict(torch.load(MODELS_DIR / "mf_model.pt", weights_only=True))
_model.set_eval_mode()

# Load movies lookup
_movies_df = load_movies()
_movies_lookup: dict[int, dict] = {
    row["movieId"]: {"title": row["title"], "genres": row["genres"]}
    for _, row in _movies_df.iterrows()
}


def get_training_history() -> list[dict]:
    with open(MODELS_DIR / "training_history.json") as f:
        return json.load(f)


def explain_recommendation(user_id: int, top_n: int = 5) -> dict:
    """Show the math behind a recommendation: embeddings + dot products."""
    if user_id not in _user_to_idx:
        raise ValueError(f"Unknown user_id: {user_id}")

    user_idx = _user_to_idx[user_id]

    with torch.no_grad():
        user_emb = _model.user_embedding(torch.LongTensor([user_idx]))[0]
        all_item_embs = _model.item_embedding.weight
        scores = (user_emb * all_item_embs).sum(dim=1)

    # Get top N items
    top_indices = torch.topk(scores, top_n).indices.tolist()
    user_vec = user_emb.tolist()

    items = []
    for idx in top_indices:
        movie_id = int(_idx_to_item[idx])
        info = _movies_lookup.get(movie_id, {"title": "Unknown", "genres": "Unknown"})
        item_vec = all_item_embs[idx].tolist()

        # Element-wise products (show first 8 dimensions for visualization)
        elementwise = [round(u * v, 4) for u, v in zip(user_vec[:8], item_vec[:8])]

        items.append({
            "movieId": movie_id,
            "title": info["title"],
            "embedding_sample": [round(x, 4) for x in item_vec[:8]],
            "elementwise_product": elementwise,
            "dot_product": round(scores[idx].item(), 4),
        })

    return {
        "user_id": int(user_id),
        "user_embedding_sample": [round(x, 4) for x in user_vec[:8]],
        "embedding_dim": len(user_vec),
        "items": items,
    }


def get_embedding_map(sample_users: int = 50, sample_items: int = 200) -> dict:
    """PCA projection of user + item embeddings to 2D for scatter plot."""
    with torch.no_grad():
        user_embs = _model.user_embedding.weight.numpy()
        item_embs = _model.item_embedding.weight.numpy()

    # Sample for performance
    rng = np.random.default_rng(42)
    u_idx = rng.choice(len(user_embs), min(sample_users, len(user_embs)), replace=False)
    i_idx = rng.choice(len(item_embs), min(sample_items, len(item_embs)), replace=False)

    combined = np.vstack([user_embs[u_idx], item_embs[i_idx]])
    pca = PCA(n_components=2)
    coords = pca.fit_transform(combined)

    users_2d = coords[:len(u_idx)]
    items_2d = coords[len(u_idx):]

    user_points = [
        {"x": round(float(x), 3), "y": round(float(y), 3), "label": f"User {list(_user_to_idx.keys())[idx]}"}
        for (x, y), idx in zip(users_2d, u_idx)
    ]
    item_points = []
    for (x, y), idx in zip(items_2d, i_idx):
        mid = _idx_to_item[int(idx)]
        info = _movies_lookup.get(mid, {"title": "Unknown"})
        item_points.append({
            "x": round(float(x), 3), "y": round(float(y), 3),
            "label": info["title"][:30],
        })

    return {
        "users": user_points,
        "items": item_points,
        "explained_variance": [round(float(v), 4) for v in pca.explained_variance_ratio_],
    }


def get_recommendations(user_id: int, top_n: int = 10) -> list[dict]:
    if user_id not in _user_to_idx:
        raise ValueError(f"Unknown user_id: {user_id}")

    user_idx = _user_to_idx[user_id]
    user_tensor = torch.LongTensor([user_idx] * _num_items)
    item_tensor = torch.arange(_num_items)

    with torch.no_grad():
        scores = _model(user_tensor, item_tensor)

    top_indices = torch.topk(scores, top_n).indices.tolist()

    results = []
    for idx in top_indices:
        movie_id = _idx_to_item[idx]
        info = _movies_lookup.get(movie_id, {"title": "Unknown", "genres": "Unknown"})
        results.append({
            "movieId": movie_id,
            "title": info["title"],
            "genres": info["genres"],
            "predicted_score": round(scores[idx].item(), 4),
        })
    return results
