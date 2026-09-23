"""
KICKWISE — Model Utilities
Save, load, and version model artifacts.
"""

from __future__ import annotations

import json
import logging
import pickle
from pathlib import Path
from typing import Any, Optional

import numpy as np

log = logging.getLogger("kickwise.model_utils")

ROOT = Path(__file__).resolve().parent.parent
ARTIFACT_DIR = ROOT / "ml" / "artifacts"

MODEL_VERSION = "bundesliga-xgb-v1"
MODEL_FILENAME = "kickwise_xgb_model.ubj"
FEATURE_META_FILENAME = "feature_metadata.json"
PREPROCESSING_FILENAME = "preprocessing_config.pkl"


def get_artifact_path(filename: str) -> Path:
    ARTIFACT_DIR.mkdir(parents=True, exist_ok=True)
    return ARTIFACT_DIR / filename


def save_xgb_model(model, feature_names: list[str], metadata: dict) -> Path:
    """Save XGBoost model in UBJ format (binary JSON) and feature metadata."""
    model_path = get_artifact_path(MODEL_FILENAME)
    model.save_model(str(model_path))
    log.info(f"XGBoost model saved: {model_path}")

    meta_path = get_artifact_path(FEATURE_META_FILENAME)
    full_meta = {
        "model_version": MODEL_VERSION,
        "feature_names": feature_names,
        "n_features": len(feature_names),
        **metadata,
    }
    with open(meta_path, "w") as f:
        json.dump(full_meta, f, indent=2)
    log.info(f"Feature metadata saved: {meta_path}")

    return model_path


def load_xgb_model():
    """Load XGBoost model from artifact directory."""
    from xgboost import XGBClassifier  # type: ignore

    model_path = get_artifact_path(MODEL_FILENAME)
    if not model_path.exists():
        raise FileNotFoundError(
            f"XGBoost model not found at {model_path}. "
            "Run `python ml/train_model.py` to train first."
        )

    model = XGBClassifier()
    model.load_model(str(model_path))
    log.info(f"XGBoost model loaded from {model_path}")
    return model


def load_feature_metadata() -> dict:
    """Load feature metadata JSON."""
    meta_path = get_artifact_path(FEATURE_META_FILENAME)
    if not meta_path.exists():
        raise FileNotFoundError(f"Feature metadata not found: {meta_path}")
    with open(meta_path) as f:
        return json.load(f)


def save_preprocessing_config(config: Any) -> Path:
    """Save sklearn preprocessing pipeline as pickle."""
    pp_path = get_artifact_path(PREPROCESSING_FILENAME)
    with open(pp_path, "wb") as f:
        pickle.dump(config, f)
    log.info(f"Preprocessing config saved: {pp_path}")
    return pp_path


def load_preprocessing_config() -> Any:
    """Load preprocessing pipeline from pickle."""
    pp_path = get_artifact_path(PREPROCESSING_FILENAME)
    if not pp_path.exists():
        return None
    with open(pp_path, "rb") as f:
        return pickle.load(f)


def model_version() -> str:
    """Return the current model version string."""
    try:
        meta = load_feature_metadata()
        return meta.get("model_version", MODEL_VERSION)
    except Exception:
        return MODEL_VERSION
