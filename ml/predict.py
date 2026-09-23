"""
KICKWISE — Prediction Engine
Loads trained model artifacts and runs single-match inference.
Uses cached model loading to avoid repeated disk I/O on every request.
"""

from __future__ import annotations

import datetime
import logging
import time
from functools import lru_cache
from pathlib import Path
from typing import Optional

import numpy as np
import pandas as pd

log = logging.getLogger("kickwise.predict")

ROOT = Path(__file__).resolve().parent.parent


@lru_cache(maxsize=1)
def _load_model_cached():
    """Cache XGBoost model in memory — loaded once, reused across requests."""
    from ml.model_utils import load_xgb_model, load_feature_metadata
    model = load_xgb_model()
    metadata = load_feature_metadata()
    log.info(f"Model loaded and cached: {metadata.get('model_version', 'unknown')}")
    return model, metadata


@lru_cache(maxsize=1)
def _load_poisson_cached():
    """Cache Poisson model in memory."""
    from ml.poisson_model import PoissonGoalModel
    model = PoissonGoalModel.load()
    return model


@lru_cache(maxsize=1)
def _load_match_df_cached():
    """Cache match history for simulation feature building."""
    from ml.data_loader import load_match_history
    return load_match_history(use_cache=True)


def _load_explainer_cached(model):
    """Build SHAP explainer from cached model (not lru_cached due to model arg)."""
    from ml.explain import SHAPExplainer
    return SHAPExplainer(model)


class PredictionResult:
    """Structured prediction result."""

    def __init__(self, **kwargs):
        self.__dict__.update(kwargs)

    def to_dict(self) -> dict:
        return self.__dict__


def run_simulation(
    home_team: str,
    away_team: str,
    home_lineup: list[dict],
    away_lineup: list[dict],
    season: str = "2023-24",
) -> dict:
    """
    Core simulation function.
    Loads model, builds feature vector from lineup, runs XGBoost + Poisson + SHAP.

    Args:
        home_team: Bundesliga team name (must match normalised names)
        away_team: Bundesliga team name
        home_lineup: list of player dicts with per-90 metrics
        away_lineup: list of player dicts with per-90 metrics
        season: season string for context lookups

    Returns:
        Full simulation result dict
    """
    t0 = time.time()

    log.info(f"Simulation started: {home_team} vs {away_team}")

    # ── Load artifacts ────────────────────────────────────────────────────────
    xgb_model, metadata = _load_model_cached()
    poisson_model = _load_poisson_cached()
    match_df = _load_match_df_cached()

    # ── Build lineup DataFrames ────────────────────────────────────────────────
    home_lineup_df = pd.DataFrame(home_lineup)
    away_lineup_df = pd.DataFrame(away_lineup)

    # Ensure position column exists
    if "position" not in home_lineup_df.columns:
        home_lineup_df["position"] = "MID"
    if "position" not in away_lineup_df.columns:
        away_lineup_df["position"] = "MID"

    # ── Feature engineering ────────────────────────────────────────────────────
    from ml.feature_engineering import build_simulation_features

    X_row = build_simulation_features(
        home_team=home_team,
        away_team=away_team,
        home_lineup_df=home_lineup_df,
        away_lineup_df=away_lineup_df,
        match_df=match_df,
        season=season,
    )

    # ── XGBoost inference ──────────────────────────────────────────────────────
    probs = xgb_model.predict_proba(X_row)[0]
    # probs[0]=HOME_WIN, probs[1]=DRAW, probs[2]=AWAY_WIN
    total = float(sum(probs))
    home_win_prob = round(float(probs[0]) / total, 4)
    draw_prob = round(float(probs[1]) / total, 4)
    away_win_prob = round(float(probs[2]) / total, 4)
    predicted_class = int(np.argmax(probs))

    # ── Poisson goal estimation ────────────────────────────────────────────────
    home_xg90 = float(X_row.get("home_lineup_xg90", pd.Series([1.5]))[0]) if hasattr(X_row, "get") \
        else float(X_row["home_lineup_xg90"].iloc[0])
    away_xg90 = float(X_row["away_lineup_xg90"].iloc[0])

    expected_home_goals, expected_away_goals = poisson_model.predict_goals_with_lineup_adjustment(
        home_team=home_team,
        away_team=away_team,
        home_xg90=home_xg90,
        away_xg90=away_xg90,
    )

    scorelines = poisson_model.top_scorelines(expected_home_goals, expected_away_goals, top_n=10)
    predicted_score = poisson_model.most_likely_score(expected_home_goals, expected_away_goals)

    # ── Radar metrics ──────────────────────────────────────────────────────────
    radar = _build_radar(X_row, home_team, away_team, home_lineup_df, away_lineup_df)

    # ── SHAP explainability ────────────────────────────────────────────────────
    try:
        explainer = _load_explainer_cached(xgb_model)
        shap_contributions = explainer.explain(X_row, predicted_class=predicted_class, top_n=8)
    except Exception as exc:
        log.warning(f"SHAP failed (non-fatal): {exc}")
        shap_contributions = []

    # ── Tactical summary ──────────────────────────────────────────────────────
    from ml.explain import generate_tactical_summary

    tactical_summary = generate_tactical_summary(
        contributions=shap_contributions,
        home_team=home_team,
        away_team=away_team,
        predicted_class=predicted_class,
        home_win_prob=home_win_prob,
        home_xg=expected_home_goals,
        away_xg=expected_away_goals,
    )

    duration_ms = int((time.time() - t0) * 1000)
    log.info(f"Simulation completed in {duration_ms}ms: {predicted_score}")

    return {
        "home_win_probability": home_win_prob,
        "draw_probability": draw_prob,
        "away_win_probability": away_win_prob,
        "expected_home_goals": expected_home_goals,
        "expected_away_goals": expected_away_goals,
        "predicted_score": predicted_score,
        "scoreline_probabilities": scorelines,
        "radar": radar,
        "shap_features": shap_contributions,
        "tactical_summary": tactical_summary,
        "model_version": metadata.get("model_version", "bundesliga-xgb-v1"),
        "generated_at": datetime.datetime.utcnow().isoformat() + "Z",
        "duration_ms": duration_ms,
    }


def _build_radar(
    X_row: pd.DataFrame,
    home_team: str,
    away_team: str,
    home_lineup_df: pd.DataFrame,
    away_lineup_df: pd.DataFrame,
) -> dict:
    """
    Compute the 6-dimension tactical radar values.
    Values are normalised 0–1 across the radar dimensions.
    """

    def _get(col: str, default: float = 0.0) -> float:
        try:
            return float(X_row[col].iloc[0])
        except Exception:
            return default

    # ATTACK — weighted xG + goals + shots
    home_attack = (_get("home_lineup_xg90") * 0.5 + _get("home_lineup_goals90") * 0.3 + _get("home_lineup_shots90") * 0.02)
    away_attack = (_get("away_lineup_xg90") * 0.5 + _get("away_lineup_goals90") * 0.3 + _get("away_lineup_shots90") * 0.02)

    # CREATION — xA + key passes
    home_creation = (_get("home_lineup_xa90") * 0.6 + _get("home_lineup_key_passes90") * 0.1)
    away_creation = (_get("away_lineup_xa90") * 0.6 + _get("away_lineup_key_passes90") * 0.1)

    # MIDFIELD CONTROL — interceptions + progressive passes
    home_mid = (_get("home_lineup_interceptions90") * 0.4 + _get("home_lineup_prog_passes90") * 0.05)
    away_mid = (_get("away_lineup_interceptions90") * 0.4 + _get("away_lineup_prog_passes90") * 0.05)

    # PRESSING — pressures
    home_press = _get("home_lineup_pressures90") * 0.04
    away_press = _get("away_lineup_pressures90") * 0.04

    # DEFENSIVE STABILITY — tackles + clearances
    home_def = (_get("home_lineup_tackles90") * 0.3 + _get("home_lineup_clearances90") * 0.1)
    away_def = (_get("away_lineup_tackles90") * 0.3 + _get("away_lineup_clearances90") * 0.1)

    # TRANSITION — form + rest
    home_trans = (_get("home_form_pts_last5") * 0.15 + max(0, _get("rest_advantage")) * 0.05)
    away_trans = (_get("away_form_pts_last5") * 0.15 + max(0, -_get("rest_advantage")) * 0.05)

    def norm_pair(h: float, a: float) -> tuple[float, float]:
        """Normalise a pair to [0, 1] relative to each other."""
        max_v = max(h, a, 0.001)
        return round(min(h / max_v, 1.0), 3), round(min(a / max_v, 1.0), 3)

    ha, aa = norm_pair(home_attack, away_attack)
    hc, ac = norm_pair(home_creation, away_creation)
    hm, am = norm_pair(home_mid, away_mid)
    hp, ap = norm_pair(home_press, away_press)
    hd, ad = norm_pair(home_def, away_def)
    ht, at_ = norm_pair(home_trans, away_trans)

    return {
        "home": {
            "attack": ha,
            "creation": hc,
            "midfield_control": hm,
            "pressing": hp,
            "defensive_stability": hd,
            "transition": ht,
        },
        "away": {
            "attack": aa,
            "creation": ac,
            "midfield_control": am,
            "pressing": ap,
            "defensive_stability": ad,
            "transition": at_,
        },
        "labels": ["ATTACK", "CREATION", "MIDFIELD CONTROL", "PRESSING", "DEFENSIVE STABILITY", "TRANSITION"],
    }
