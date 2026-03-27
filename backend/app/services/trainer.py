import json
import pickle

import numpy as np
import torch
import torch.nn as nn
from torch.utils.data import DataLoader, Dataset

from app.core.config import MODELS_DIR
from app.models.mf_model import MatrixFactorization
from app.services.data_loader import load_ratings


class RatingsDataset(Dataset):
    def __init__(self, users, items, ratings):
        self.users = torch.LongTensor(np.array(users, copy=True))
        self.items = torch.LongTensor(np.array(items, copy=True))
        self.ratings = torch.FloatTensor(np.array(ratings, copy=True))

    def __len__(self):
        return len(self.ratings)

    def __getitem__(self, idx):
        return self.users[idx], self.items[idx], self.ratings[idx]


def train():
    # Load and encode IDs
    df = load_ratings()

    user_ids = df["userId"].unique()
    item_ids = df["movieId"].unique()
    user_to_idx = {uid: i for i, uid in enumerate(user_ids)}
    item_to_idx = {iid: i for i, iid in enumerate(item_ids)}

    df["user_idx"] = df["userId"].map(user_to_idx)
    df["item_idx"] = df["movieId"].map(item_to_idx)

    # Train/test split (80/20)
    df = df.sample(frac=1, random_state=42).reset_index(drop=True)
    split = int(len(df) * 0.8)
    train_df = df.iloc[:split]
    test_df = df.iloc[split:]

    train_dataset = RatingsDataset(
        train_df["user_idx"].values,
        train_df["item_idx"].values,
        train_df["rating"].values,
    )
    test_dataset = RatingsDataset(
        test_df["user_idx"].values,
        test_df["item_idx"].values,
        test_df["rating"].values,
    )

    train_loader = DataLoader(train_dataset, batch_size=256, shuffle=True)
    test_loader = DataLoader(test_dataset, batch_size=256)

    # Model, optimizer, loss
    num_users = len(user_ids)
    num_items = len(item_ids)
    model = MatrixFactorization(num_users, num_items)
    optimizer = torch.optim.Adam(model.parameters(), lr=0.01)
    criterion = nn.MSELoss()

    # Training loop
    history = []
    for epoch in range(1, 21):
        model.train()
        train_loss = 0.0
        for users, items, ratings in train_loader:
            optimizer.zero_grad()
            preds = model(users, items)
            loss = criterion(preds, ratings)
            loss.backward()
            optimizer.step()
            train_loss += loss.item() * len(ratings)
        train_loss /= len(train_dataset)

        # Test RMSE
        model.set_eval_mode()
        test_se = 0.0
        with torch.no_grad():
            for users, items, ratings in test_loader:
                preds = model(users, items)
                test_se += ((preds - ratings) ** 2).sum().item()
        test_rmse = np.sqrt(test_se / len(test_dataset))

        history.append({
            "epoch": epoch,
            "train_loss": round(train_loss, 4),
            "test_rmse": round(test_rmse, 4),
        })
        print(f"Epoch {epoch:2d} | Train Loss: {train_loss:.4f} | Test RMSE: {test_rmse:.4f}")

    # Save model and mappings
    MODELS_DIR.mkdir(parents=True, exist_ok=True)
    torch.save(model.state_dict(), MODELS_DIR / "mf_model.pt")

    mappings = {"user_to_idx": user_to_idx, "item_to_idx": item_to_idx}
    with open(MODELS_DIR / "id_mappings.pkl", "wb") as f:
        pickle.dump(mappings, f)

    with open(MODELS_DIR / "training_history.json", "w") as f:
        json.dump(history, f)

    print(f"\nModel saved to {MODELS_DIR / 'mf_model.pt'}")
    print(f"ID mappings saved to {MODELS_DIR / 'id_mappings.pkl'}")
    print(f"Training history saved to {MODELS_DIR / 'training_history.json'}")


if __name__ == "__main__":
    train()
