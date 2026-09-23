"""
KICKWISE — XGBoost Training Pipeline
Trains the multiclass outcome classifier (HOME_WIN / DRAW / AWAY_WIN)
using time-aware train/validation/test splits to prevent data leakage.

Usage:
    python ml/train_model.py
"""

from __future__ import annotations

import json
import logging
import sys
from pathlib import Path

import numpy as np
import pandas as pd
from dotenv import load_dotenv
from sklearn.metrics import (
    accuracy_score,
    brier_score_loss,
    classification_report,
    confusion_matrix,
    log_loss,
)
from sklearn.preprocessing import LabelBinarizer

ROOT = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(ROOT))

from ml.data_loader import load_match_history, load_player_metrics
from ml.feature_engineering import FEATURE_NAMES, build_training_features
from ml.model_utils import MODEL_VERSION, save_preprocessing_config, save_xgb_model
from ml.poisson_model import PoissonGoalModel

load_dotenv(ROOT / ".env")

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s | %(levelname)-8s | %(message)s",
    handlers=[logging.StreamHandler(sys.stdout)],
)
log = logging.getLogger("kickwise.train")

# ─── Reproducibility ──────────────────────────────────────────────────────────
RANDOM_SEED = 42
np.random.seed(RANDOM_SEED)


def chronological_split(
    X: pd.DataFrame,
    y: pd.Series,
    match_dates: pd.Series,
    val_frac: float = 0.15,
    test_frac: float = 0.15,
) -> tuple:
    """
    Time-aware train/val/test split.
    Ensures no future data leaks into the training window.
    """
    n = len(X)
    n_test = max(1, int(n * test_frac))
    n_val = max(1, int(n * val_frac))
    n_train = n - n_val - n_test

    if n_train < 50:
        raise ValueError(
            f"Insufficient training data: only {n_train} training samples. "
            "Run data ingestion first."
        )

    sort_idx = match_dates.argsort().values
    train_idx = sort_idx[:n_train]
    val_idx = sort_idx[n_train : n_train + n_val]
    test_idx = sort_idx[n_train + n_val :]

    return (
        X.iloc[train_idx], X.iloc[val_idx], X.iloc[test_idx],
        y.iloc[train_idx], y.iloc[val_idx], y.iloc[test_idx],
    )


def train_xgboost(X_train, y_train, X_val, y_val) -> tuple:
    """Train XGBClassifier with early stopping on validation set."""
    from xgboost import XGBClassifier  # type: ignore

    # Handle class imbalance — compute sample weights
    class_counts = pd.Series(y_train).value_counts().to_dict()
    total = len(y_train)
    sample_weights = pd.Series(y_train).map(
        lambda c: total / (3 * class_counts.get(c, 1))
    ).values

    model = XGBClassifier(
        n_estimators=500,
        max_depth=5,
        learning_rate=0.05,
        subsample=0.8,
        colsample_bytree=0.8,
        min_child_weight=3,
        gamma=0.1,
        reg_alpha=0.1,
        reg_lambda=1.0,
        objective="multi:softprob",
        num_class=3,
        eval_metric="mlogloss",
        random_state=RANDOM_SEED,
        early_stopping_rounds=30,
        n_jobs=-1,
        verbosity=0,
    )

    model.fit(
        X_train, y_train,
        sample_weight=sample_weights,
        eval_set=[(X_val, y_val)],
        verbose=False,
    )

    log.info(f"Best iteration: {model.best_iteration}")
    return model, model.best_score


def evaluate(model, X: pd.DataFrame, y: pd.Series, split_name: str) -> dict:
    """Compute and log evaluation metrics for a split."""
    y_pred = model.predict(X)
    y_prob = model.predict_proba(X)

    acc = accuracy_score(y, y_pred)
    ll = log_loss(y, y_prob, labels=[0, 1, 2])
    report = classification_report(y, y_pred, target_names=["HOME_WIN", "DRAW", "AWAY_WIN"], output_dict=True)
    cm = confusion_matrix(y, y_pred, labels=[0, 1, 2]).tolist()

    # Brier score (multi-class: average over classes)
    lb = LabelBinarizer()
    y_bin = lb.fit_transform(y)
    if y_bin.shape[1] == 1:
        y_bin = np.hstack([1 - y_bin, y_bin])
    brier = np.mean([brier_score_loss(y_bin[:, i], y_prob[:, i]) for i in range(3)])

    macro_f1 = report["macro avg"]["f1-score"]

    log.info(f"─── {split_name} Evaluation ───────────────────────────")
    log.info(f"  Accuracy     : {acc:.4f}")
    log.info(f"  Log Loss     : {ll:.4f}")
    log.info(f"  Macro F1     : {macro_f1:.4f}")
    log.info(f"  Brier Score  : {brier:.4f}")
    log.info(f"  Confusion Matrix:\n{pd.DataFrame(cm, index=['HOME','DRAW','AWAY'], columns=['HOME','DRAW','AWAY'])}")

    return {
        "accuracy": round(acc, 4),
        "log_loss": round(ll, 4),
        "macro_f1": round(macro_f1, 4),
        "brier_score": round(float(brier), 4),
        "confusion_matrix": cm,
        "classification_report": report,
    }


def main() -> int:
    log.info("+------------------------------------------+")
    log.info("|  KICKWISE XGBoost Training Pipeline       |")
    log.info("+------------------------------------------+")

    # ── Load data ─────────────────────────────────────────────────────────────
    log.info("Loading match history...")
    try:
        match_df = load_match_history(use_cache=True)
    except Exception as exc:
        log.error(f"Failed to load match history: {exc}")
        return 1

    log.info("Loading player metrics...")
    try:
        player_df = load_player_metrics(use_cache=True)
    except Exception as exc:
        log.warning(f"Player metrics unavailable: {exc}. Training without lineup features.")
        player_df = None

    # ── Feature engineering ───────────────────────────────────────────────────
    log.info("Building feature matrix...")
    try:
        X, y = build_training_features(match_df, player_df)
    except Exception as exc:
        log.error(f"Feature engineering failed: {exc}")
        return 1

    # ── Time-aware split ──────────────────────────────────────────────────────
    if "match_date" in match_df.columns:
        dates = match_df["match_date"].reset_index(drop=True)
        # Align dates with the (possibly filtered) X index
        dates = dates.iloc[X.index] if hasattr(X, "index") else dates
        dates = dates.reset_index(drop=True)
    else:
        dates = pd.Series(range(len(X)))

    X = X.reset_index(drop=True)
    y = y.reset_index(drop=True)

    try:
        X_train, X_val, X_test, y_train, y_val, y_test = chronological_split(X, y, dates)
    except ValueError as exc:
        log.error(str(exc))
        return 1

    log.info(f"Split sizes — Train: {len(X_train)}, Val: {len(X_val)}, Test: {len(X_test)}")

    # ── XGBoost training ──────────────────────────────────────────────────────
    log.info("Training XGBoost classifier...")
    try:
        model, best_score = train_xgboost(X_train, y_train, X_val, y_val)
    except Exception as exc:
        log.error(f"Training failed: {exc}")
        return 1

    # ── Evaluation ────────────────────────────────────────────────────────────
    val_metrics = evaluate(model, X_val, y_val, "VALIDATION")
    test_metrics = evaluate(model, X_test, y_test, "TEST")

    # ── Poisson model ─────────────────────────────────────────────────────────
    log.info("Training Poisson goal model...")
    poisson = PoissonGoalModel()
    try:
        poisson.fit(match_df)
        poisson.save()
    except Exception as exc:
        log.error(f"Poisson training failed: {exc}")
        return 1

    # ── Save XGBoost artifacts ────────────────────────────────────────────────
    log.info("Saving model artifacts...")
    training_metadata = {
        "train_samples": len(X_train),
        "val_samples": len(X_val),
        "test_samples": len(X_test),
        "val_metrics": val_metrics,
        "test_metrics": test_metrics,
        "random_seed": RANDOM_SEED,
        "xgb_best_iteration": model.best_iteration,
    }
    try:
        save_xgb_model(model, FEATURE_NAMES, training_metadata)
        save_preprocessing_config({"feature_names": FEATURE_NAMES})
    except Exception as exc:
        log.error(f"Artifact saving failed: {exc}")
        return 1

    log.info("═" * 50)
    log.info("✓ Training complete.")
    log.info(f"  Model version : {MODEL_VERSION}")
    log.info(f"  Test accuracy : {test_metrics['accuracy']:.4f}")
    log.info(f"  Test log loss : {test_metrics['log_loss']:.4f}")
    log.info(f"  Test macro F1 : {test_metrics['macro_f1']:.4f}")
    log.info("═" * 50)

    return 0


if __name__ == "__main__":
    sys.exit(main())
