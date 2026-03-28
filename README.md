# MovieMatch - Movie Recommendation Engine

A full-stack movie recommendation system using **matrix factorization** to learn user preferences from rating data and predict movies a user will enjoy. Includes interactive visualizations to see how embeddings work and how a recommendation is computed step by step.

Built with PyTorch, FastAPI, React, and the MovieLens dataset (100k ratings, 610 users, 9,742 movies).

**Live demo:** [movie-rec-engine.vercel.app](https://movie-rec-engine.vercel.app)

---

## How the ML Works

### Matrix Factorization

The model learns two things from rating data:
- A **user embedding** — a 64-dimensional vector capturing a user's taste
- An **item embedding** — a 64-dimensional vector capturing a movie's characteristics

To predict how much User A will like Movie B, it computes the **dot product** of their vectors (multiply each pair of dimensions, sum them all). High score = strong alignment between taste and movie. The model figures out what each dimension represents entirely on its own — this is **representation learning**.

### Training

The model trains for 20 epochs on 80% of the ratings, holding back 20% for evaluation:

1. **Forward pass** — predict ratings via dot product of user/movie embeddings
2. **Loss** — MSE between predicted and actual ratings
3. **Backprop** — compute gradients
4. **Update** — Adam optimizer (lr=0.01) adjusts embeddings to reduce error
5. **Evaluate** — measure RMSE on held-out test set each epoch

After 20 epochs: **Train MSE: 0.2631 | Test RMSE: 1.25** (off by ~1.25 stars on unseen ratings)

### Model Architecture

```python
class MatrixFactorization(nn.Module):
    user_embedding = nn.Embedding(610, 64)   # 610 users × 64 dims
    item_embedding = nn.Embedding(9742, 64)  # 9742 movies × 64 dims

    def forward(self, user_ids, item_ids):
        return (self.user_embedding(user_ids) * self.item_embedding(item_ids)).sum(dim=1)
```

Embeddings are initialized with Kaiming normal for stable training. No bias terms or regularization — intentionally simple baseline.

### Inference

To recommend movies for a user, the API computes the dot product between that user's embedding and every movie's embedding, then returns the top-N scores. The `/explain` endpoint exposes the full math: the actual 64-dim vectors, element-wise products, and running sum.

---

## Deployment

### Backend — AWS EC2 + Docker + S3

The FastAPI backend runs in a Docker container on an EC2 instance (Ubuntu). Docker Compose manages the service with volume mounts so model weights and the dataset persist across restarts.

Model artifacts (weights + ID mappings) are stored in **S3**. On first boot, if artifacts aren't found locally, the backend automatically pulls them down via `boto3` before serving requests — so deploying to a fresh instance requires no manual file transfer.

```
┌─────────────────────┐         ┌──────────────────────┐
│   Vercel (CDN)      │         │    AWS EC2 (Ubuntu)   │
│   React frontend    │──/api/──▶  Docker: FastAPI 8000 │
│                     │         │  PyTorch MF model     │
└─────────────────────┘         └──────────┬───────────┘
                                           │ on first boot
                                ┌──────────▼───────────┐
                                │       AWS S3          │
                                │  mf_model.pt          │
                                │  id_mappings.pkl      │
                                └──────────────────────┘
```

Vercel rewrites all `/api/*` requests to the EC2 backend — this solves the HTTPS→HTTP mixed-content problem without needing TLS on EC2.

### Frontend — Vercel

```bash
vercel --prod
```

`VITE_API_URL` is set to `/api` in Vercel project settings. The rewrite in `vercel.json` proxies those calls to the EC2 host.

### Running Locally

```bash
# Backend
cd backend && pip install -r requirements.txt
python -m app.services.trainer   # train the model (~30s)
uvicorn app.main:app --reload --port 8000

# Frontend
cd frontend && npm install && npm run dev
```

Or with Docker: `docker compose up --build`

---

## Tech Stack

**Backend:** Python 3.11, PyTorch, FastAPI, boto3 (S3), scikit-learn (PCA), pandas

**Frontend:** React 19, Vite

**Infrastructure:** AWS EC2, AWS S3, Docker, Vercel

**Dataset:** MovieLens Latest Small — 100,836 ratings from GroupLens Research
