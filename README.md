# MovieMatch - Movie Recommendation Engine

A full-stack movie recommendation system that uses **matrix factorization** to learn user preferences from rating data and predict which movies a user will enjoy. Includes interactive visualizations that let you watch the model train, see how embeddings work, and understand exactly how a recommendation is computed — step by step.

Built with PyTorch, FastAPI, React, and the MovieLens dataset.

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
| **Python 3.14** | Runtime |
| **PyTorch** | Deep learning framework — defines the model, runs training, handles GPU/CPU tensors |
| **FastAPI** | Async web framework — serves the REST API with automatic OpenAPI docs |
| **Uvicorn** | ASGI server that runs FastAPI |
| **pandas** | Loads and manipulates the CSV rating/movie data |
| **NumPy** | Numerical operations, array handling |
| **scikit-learn** | PCA for dimensionality reduction in the embedding visualization |
| **python-dotenv** | Environment variable management |

### Frontend

| Technology | Role |
|---|---|
| **React 19** | UI framework — component-based, reactive state management |
| **Vite** | Build tool — instant hot reload, fast bundling |
| **Tailwind CSS v4** | Utility-first CSS (used for base styles) |
| **SVG** | All charts and visualizations are hand-drawn SVG — no charting libraries |

### Dataset

**MovieLens Latest Small** — 100,836 ratings from 610 users across 9,742 movies. Collected by GroupLens Research at the University of Minnesota.

---

## Project Structure

```
movie-rec-engine/
├── backend/
│   ├── app/
│   │   ├── api/routes.py          # REST endpoints
│   │   ├── core/config.py         # Path constants
│   │   ├── models/mf_model.py     # PyTorch MatrixFactorization model
│   │   ├── schemas/               # Pydantic response models
│   │   │   └── recommendation.py
│   │   ├── services/
│   │   │   ├── data_loader.py     # Load CSVs with pandas
│   │   │   ├── recommender.py     # Inference, explain, embeddings
│   │   │   └── trainer.py         # Training loop
│   │   └── main.py                # FastAPI app + CORS
│   ├── artifacts/models/          # Saved model weights + mappings
│   ├── data/raw/ml-latest-small/  # MovieLens dataset
│   ├── requirements.txt
│   └── venv/
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── SearchBar.jsx          # Movie search dropdown
│   │   │   ├── MovieCard.jsx          # Single recommendation card
│   │   │   ├── RecommendationList.jsx # Results table
│   │   │   ├── TrainingChart.jsx      # Animated training curves
│   │   │   ├── ExplainView.jsx        # Step-by-step explainer
│   │   │   └── EmbeddingMap.jsx       # PCA scatter plot
│   │   ├── App.jsx                    # Main app with tabs
│   │   └── index.css
│   └── package.json
└── README.md
```

---

## API Endpoints

| Method | Path | Description |
|---|---|---|
| GET | `/health` | Health check |
| GET | `/movies` | All movies (id + title) for search dropdown |
| GET | `/movies/{movie_id}/users` | Users who rated a specific movie |
| GET | `/recommend/{user_id}?top_n=10` | Top-N recommendations with scores |
| GET | `/training/history` | Epoch-by-epoch loss and RMSE |
| GET | `/explain/{user_id}?top_n=5` | Embedding breakdown for explainability |
| GET | `/embeddings/map` | PCA 2D projection of user + item embeddings |

---

## Visualizations

### Training Curves
Watch the model learn epoch by epoch. Press play to see the loss and RMSE lines draw in real-time with a progress bar, pulsating data points, and narration that explains what's happening at each stage (initial random guesses, rapid learning, overfitting risk, convergence).

### How It Works (5-Step Explainer)
An animated walkthrough of exactly how one recommendation is computed:

1. **User embedding** — see the 64-dimensional taste vector with intuitive guesses ("maybe likes action?")
2. **Movie embedding** — the movie's characteristic vector in a different color
3. **Element-wise multiplication** — rows light up one by one showing user × movie for each dimension, with commentary on whether it's a match or mismatch
4. **Running sum** — product boxes highlight sequentially as a big counter accumulates the dot product
5. **Final ranking** — the top 5 movies sorted by score with bar charts

### Embedding Map
A PCA projection that squishes the 64-dimensional embedding space down to 2D. Press play to watch 250 points (50 users + 200 movies) appear on the scatter plot. Hover to see labels. Users cluster near movies they'd enjoy — the model learned this entirely from rating data.

---

## Getting Started

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

Extract the dataset:
```bash
cd ..
unzip ml-latest-small.zip -d backend/data/raw/
```

Train the model (takes about 30 seconds):
```bash
cd backend
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
