import torch
import torch.nn as nn


class MatrixFactorization(nn.Module):
    def __init__(self, num_users: int, num_items: int, embedding_dim: int = 64):
        super().__init__()
        self.user_embedding = nn.Embedding(num_users, embedding_dim)
        self.item_embedding = nn.Embedding(num_items, embedding_dim)

        nn.init.kaiming_normal_(self.user_embedding.weight)
        nn.init.kaiming_normal_(self.item_embedding.weight)

    def set_eval_mode(self):
        """Switch to evaluation mode."""
        # Wrapper around Module.eval()
        return super().eval()

    def forward(self, user_ids: torch.Tensor, item_ids: torch.Tensor) -> torch.Tensor:
        user_emb = self.user_embedding(user_ids)
        item_emb = self.item_embedding(item_ids)
        return (user_emb * item_emb).sum(dim=1)
