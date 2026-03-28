# MovieMatch - Movie Recommendation Engine

A full-stack movie recommendation system that uses **matrix factorization** to learn user preferences from rating data and predict which movies a user will enjoy. Includes interactive visualizations that let you watch the model train, see how embeddings work, and understand exactly how a recommendation is computed — step by step.

Built with PyTorch, FastAPI, React, and the MovieLens dataset.

**Live demo:** [movie-rec-engine.vercel.app](https://movie-rec-engine.vercel.app)

---

## How It Works

### The Core Idea: Matrix Factorization

Imagine a giant spreadsheet where each row is a user, each column is a movie, and each cell is a rating (1-5 stars). Most cells are empty — no one has seen every movie. Matrix factorization fills in those blanks by finding hidden patterns.

The model learns two things:
- A **user embedding** — a list of 64 numbers that capture a user's taste (do they like action? comedy? artsy films?)
- An **item embedding** — a list of 64 numbers that capture a movie's characteristics

To predict how much User A will like Movie B, the model computes the **dot product** (multiply each pair of numbers, then sum them all). A high score means the user's taste and the movie's qualities align well.

Nobody tells the model what the 64 dimensions mean. It figures them out on its own from the rating data. This is the magic of **representation learning**.

### What Is an Embedding?

An embedding is a learned vector (list of numbers) that represents something — a user, a movie, a word — in a way that captures its meaning. Similar things end up with similar vectors. In our case:

- Users who like the same movies get similar embeddings
- Movies enjoyed by the same users get similar embeddings
- The dot product between a user and movie embedding predicts the rating

### Training: How the Model Learns

Training happens over multiple **epochs**. One epoch = the model sees every rating in the training data once. Here's what happens each epoch:

1. **Forward pass**: The model predicts ratings for a batch of (user, movie) pairs using the current embeddings
2. **Loss calculation**: We measure how wrong the predictions are using **MSE (Mean Squared Error)** — the average of (predicted - actual)^2
3. **Backpropagation**: We calculate how to adjust each number in the embeddings to reduce the error
4. **Optimizer step**: **Adam optimizer** updates the embeddings by a small amount (the **learning rate**, set to 0.01)
5. **Repeat** for all batches in the epoch

We train for **20 epochs**. You can watch this process animated in the Training Curves tab.

### Key Concepts Explained

| Term | What It Means |
|---|---|
| **Epoch** | One full pass through all training data. More epochs = more learning, but too many leads to overfitting. |
| **Batch** | A small chunk of data (256 ratings) processed together. Batches make training faster and more stable. |
| **Learning Rate** | How big each adjustment step is (0.01). Too high = unstable. Too low = slow learning. |
| **MSE Loss** | Mean Squared Error. Measures prediction quality: average of (predicted - actual)^2. Lower is better. |
| **RMSE** | Root Mean Squared Error. Square root of MSE — gives error in the same units as ratings (e.g., "off by 1.25 stars"). |
| **Train Loss** | How wrong the model is on data it trained on. Always goes down. |
| **Test RMSE** | How wrong the model is on data it has NEVER seen. This is the real measure of quality. |
| **Overfitting** | When train loss keeps dropping but test RMSE stops improving — the model is memorizing, not learning. |
| **Embedding Dimension** | How many numbers represent each user/movie (64). Higher = more expressive but slower to train. |
| **Dot Product** | Multiply two vectors element-wise, then sum. Measures similarity/compatibility. |
| **Kaiming Initialization** | A smart way to set initial random embedding values so training starts stable (not too big, not too small). |
| **PCA** | Principal Component Analysis. Squishes 64 dimensions down to 2 so you can visualize embeddings on a scatter plot. |

### Overfitting: The Train/Test Gap

The model sees 80% of ratings during training and 20% is held back for testing. If the model memorizes specific users' ratings instead of learning general patterns, it performs great on training data but poorly on test data. The gap between the blue line (train loss) and red line (test RMSE) in the Training Curves visualization shows this.

---

## Tech Stack

### Backend

| Technology | Role |
|---|---|
| **Python 3.11** | Runtime (Docker container) |
| **PyTorch 2.11** | Deep learning framework — defines the model, runs training, handles tensors |
| **FastAPI** | Async web framework — serves the REST API with automatic OpenAPI docs |
| **Uvicorn** | ASGI server that runs FastAPI |
| **pandas** | Loads and manipulates the CSV rating/movie data |
| **NumPy** | Numerical operations, array handling |
| **scikit-learn** | PCA for dimensionality reduction in the embedding visualization |
| **boto3** | AWS SDK — downloads model artifacts from S3 on first deploy |
| **python-dotenv** | Environment variable management |

### Frontend

| Technology | Role |
|---|---|
| **React 19** | UI framework — component-based, reactive state management |
| **Vite 8** | Build tool — instant hot reload, fast bundling |
| **Tailwind CSS v4** | Utility-first CSS (used for base styles) |
| **Custom SVG** | All charts and visualizations are hand-drawn SVG — no charting libraries |

### Infrastructure

| Technology | Role |
|---|---|
| **AWS EC2** | Hosts the backend API (Docker container on Ubuntu) |
| **AWS S3** | Stores model artifacts (weights + mappings) for deployment |
| **Docker** | Containerizes the backend for consistent deployment |
| **Vercel** | Hosts the frontend with API rewrites to proxy backend requests |

### Dataset

**MovieLens Latest Small** — 100,836 ratings from 610 users across 9,742 movies. Collected by GroupLens Research at the University of Minnesota.

---

## Architecture

```
                         ┌──────────────────────────┐
                         │       Vercel (CDN)        │
                         │   Frontend (React/Vite)   │
                         │                           │
                         │  movie-rec-engine.vercel  │
                         └────────────┬─────────────┘
                                      │
                           /api/* rewrite (HTTPS→HTTP)
                                      │
                         ┌────────────▼─────────────┐
                         │      AWS EC2 (Ubuntu)     │
                         │   Docker: FastAPI + Uvi   │
                         │       port 8000           │
                         │                           │
                         │  ┌─────────────────────┐  │
                         │  │  PyTorch MF Model    │  │
                         │  │  64-dim embeddings   │  │
                         │  └─────────────────────┘  │
                         │                           │
                         │  Volumes:                 │
                         │   /app/data      (dataset)│
                         │   /app/artifacts (model)  │
                         └────────────┬─────────────┘
                                      │
                              on first boot
                                      │
                         ┌────────────▼─────────────┐
                         │        AWS S3             │
                         │  movie-rec-engine-        │
                         │  artifacts bucket         │
                         │                           │
                         │  models/mf_model.pt       │
                         │  models/id_mappings.pkl   │
                         └──────────────────────────┘
```

The frontend is served by Vercel's CDN. All API calls go to `/api/*` which Vercel rewrites to the EC2 backend over HTTP. This avoids mixed-content issues (HTTPS frontend calling HTTP backend) without needing to set up TLS on EC2. On first boot, the backend downloads model artifacts from S3 if they don't exist locally.

---

## ML Data Pipeline

### Dataset: MovieLens Latest Small

The [MovieLens](https://grouplens.org/datasets/movielens/) dataset contains real user ratings collected by GroupLens Research. We use the "latest small" version:

- **100,836 ratings** on a 0.5–5.0 star scale
- **610 users**, **9,742 movies**
- Each rating has a userId, movieId, rating, and timestamp
- Movies have titles and pipe-separated genre tags

### Training Pipeline

```
ratings.csv ──► pandas DataFrame
                    │
                    ▼
            Create ID mappings
         (user_to_idx, item_to_idx)
                    │
                    ▼
          80/20 train/test split
             (seed=42)
                    │
                    ▼
        PyTorch DataLoaders
          (batch_size=256)
                    │
                    ▼
    ┌─── 20 epochs ──────────────┐
    │  Forward: dot product      │
    │  Loss: MSE                 │
    │  Backward: gradients       │
    │  Update: Adam (lr=0.01)    │
    │  Evaluate: test RMSE       │
    └────────────────────────────┘
                    │
                    ▼
          Save artifacts:
           mf_model.pt
           id_mappings.pkl
           training_history.json
```

### Model Architecture

The `MatrixFactorization` model is a PyTorch `nn.Module` with two embedding layers:

- **User embedding**: `nn.Embedding(610, 64)` — each user gets a 64-dimensional vector
- **Item embedding**: `nn.Embedding(9742, 64)` — each movie gets a 64-dimensional vector
- **Scoring**: element-wise multiply user and item vectors, sum across all 64 dimensions (dot product)
- **Initialization**: Kaiming normal for stable training

No bias terms or regularization — this is an intentionally simple baseline to make the math easy to visualize and explain.

### Inference

At serving time, to recommend movies for a user:

1. Look up the user's 64-dim embedding
2. Compute the dot product with every movie's embedding
3. Return the top-N highest-scoring movies

The `/explain` endpoint breaks this down step by step, showing the actual embedding values, element-wise products, and running sum.

---

## Project Structure

```
movie-rec-engine/
├── backend/
│   ├── Dockerfile                 # python:3.11-slim, uvicorn entrypoint
│   ├── .dockerignore
│   ├── requirements.txt           # PyTorch, FastAPI, boto3, etc.
│   ├── app/
│   │   ├── main.py                # FastAPI app + CORS middleware
│   │   ├── api/routes.py          # 7 REST endpoints
│   │   ├── core/config.py         # Path constants
│   │   ├── models/mf_model.py     # PyTorch MatrixFactorization model
│   │   ├── schemas/
│   │   │   └── recommendation.py  # Pydantic response models
│   │   └── services/
│   │       ├── data_loader.py     # Load CSVs with pandas
│   │       ├── recommender.py     # Inference, explain, embedding map, S3 download
│   │       └── trainer.py         # Training loop (run offline)
│   ├── artifacts/models/          # Model weights + ID mappings
│   └── data/raw/ml-latest-small/  # MovieLens dataset
├── frontend/
│   ├── vercel.json                # API rewrite rules for production
│   ├── vite.config.js
│   ├── package.json
│   └── src/
│       ├── App.jsx                # Main app with tab navigation
│       ├── index.css
│       └── components/
│           ├── SearchBar.jsx          # Movie search with autocomplete
│           ├── MovieCard.jsx          # Single recommendation row with stars
│           ├── RecommendationList.jsx # Results table
│           ├── TrainingChart.jsx      # Animated training loss/RMSE curves
│           ├── ExplainView.jsx        # 5-step embedding math walkthrough
│           └── EmbeddingMap.jsx       # PCA 2D scatter plot of embeddings
├── docker-compose.yml             # Backend service with volume mounts
└── README.md
```

---

## API Endpoints

| Method | Path | Description |
|---|---|---|
| GET | `/health` | Health check — returns `{"status": "ok"}` |
| GET | `/movies` | All 9,742 movies (id + title) for search dropdown |
| GET | `/movies/{movie_id}/users` | Users who rated a specific movie |
| GET | `/recommend/{user_id}?top_n=10` | Top-N recommendations with predicted scores |
| GET | `/training/history` | Epoch-by-epoch train loss and test RMSE |
| GET | `/explain/{user_id}?top_n=5` | Embedding vectors, element-wise products, dot products |
| GET | `/embeddings/map` | PCA 2D projection of 50 users + 200 movies |

---

## Visualizations

### Training Curves
Watch the model learn epoch by epoch. Press play to see the loss and RMSE lines draw in real-time with a progress bar, pulsating data points, and narration that explains what's happening at each stage (initial random guesses, rapid learning, overfitting risk, convergence).

### How It Works (5-Step Explainer)
An animated walkthrough of exactly how one recommendation is computed:

1. **User embedding** — see the 64-dimensional taste vector with intuitive guesses ("maybe likes action?")
2. **Movie embedding** — the movie's characteristic vector in a different color
3. **Element-wise multiplication** — rows light up one by one showing user x movie for each dimension, with commentary on whether it's a match or mismatch
4. **Running sum** — product boxes highlight sequentially as a big counter accumulates the dot product
5. **Final ranking** — the top 5 movies sorted by score with bar charts

### Embedding Map
A PCA projection that squishes the 64-dimensional embedding space down to 2D. Press play to watch 250 points (50 users + 200 movies) appear on the scatter plot. Hover to see labels. Users cluster near movies they'd enjoy — the model learned this entirely from rating data.

---

## Deployment

### Backend (AWS EC2 + Docker)

The backend runs as a Docker container on an EC2 instance (Ubuntu). Docker Compose manages the service with volume mounts so model weights and dataset persist across container restarts.

```yaml
# docker-compose.yml
services:
  backend:
    build: ./backend
    ports:
      - "8000:8000"
    volumes:
      - ./backend/data:/app/data
      - ./backend/artifacts:/app/artifacts
```

On first boot, if model artifacts aren't present locally, the backend automatically downloads them from an S3 bucket (`movie-rec-engine-artifacts`). This is configured via environment variables:

| Variable | Default | Description |
|---|---|---|
| `S3_BUCKET` | `movie-rec-engine-artifacts` | S3 bucket with model files |
| `AWS_REGION` | `us-east-2` | AWS region for S3 |
| `CORS_ORIGINS` | `http://localhost:5173` | Comma-separated allowed origins |

To deploy on a fresh EC2 instance:

```bash
# Clone and start
git clone <repo-url> && cd movie-rec-engine
docker-compose up -d --build

# Verify
curl http://localhost:8000/health
```

### Frontend (Vercel)

The React frontend is deployed on Vercel. A rewrite rule in `vercel.json` proxies all `/api/*` requests to the EC2 backend, solving the HTTPS/HTTP mixed-content problem without needing TLS on EC2.

The `VITE_API_URL` environment variable is set to `/api` in Vercel's project settings. In local development, it defaults to empty string (requests go to `http://localhost:8000` via Vite's dev server or directly).

To redeploy:

```bash
cd movie-rec-engine
vercel --prod
```

---

## Getting Started (Local Development)

### Prerequisites
- Python 3.10+
- Node.js 18+

### Backend Setup

```bash
cd backend
python -m venv venv
source venv/bin/activate
pip install -r requirements.txt
```

Train the model (takes about 30 seconds):
```bash
python -m app.services.trainer
```

Start the API server:
```bash
uvicorn app.main:app --reload --port 8000
```

### Frontend Setup

```bash
cd frontend
npm install
npm run dev
```

Open http://localhost:5173 in your browser.

### Docker (Alternative)

```bash
docker compose up --build
```

Backend will be available at http://localhost:8000.

---

## Model Performance

After 20 epochs of training:
- **Train Loss (MSE)**: 0.2631
- **Test RMSE**: 1.2544 (off by ~1.25 stars on unseen ratings)
- **Training time**: ~30 seconds on CPU

This is a baseline matrix factorization model. Improvements could include adding bias terms, regularization, or switching to a neural collaborative filtering architecture.

---

## Design Choice: Windows XP Theme

The frontend uses a retro Windows XP aesthetic — Tahoma font, beveled buttons, groove borders, inset text fields, and the classic blue title bar gradient. This is a deliberate stylistic choice, not a limitation. All visualizations are custom SVG with no external charting libraries.
