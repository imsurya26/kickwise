"""
KICKWISE — SHAP Explainability Engine
Extracts feature importance using SHAP TreeExplainer and converts
SHAP values into human-readable tactical breakdowns.
"""

from __future__ import annotations

import logging
import math
from typing import Optional

import numpy as np
import pandas as pd
import shap  # type: ignore

from ml.feature_engineering import FEATURE_NAMES

log = logging.getLogger("kickwise.explain")

# ─── Human-readable feature label mapping ─────────────────────────────────────
FEATURE_LABELS: dict[str, str] = {
    "home_form_gf_last5": "Home Recent Scoring Rate",
    "home_form_ga_last5": "Home Recent Goals Conceded",
    "home_form_pts_last5": "Home Recent Points",
    "home_form_xg_last5": "Home Recent xG",
    "home_form_xga_last5": "Home Recent xG Against",
    "away_form_gf_last5": "Away Recent Scoring Rate",
    "away_form_ga_last5": "Away Recent Goals Conceded",
    "away_form_pts_last5": "Away Recent Points",
    "away_form_xg_last5": "Away Recent xG",
    "away_form_xga_last5": "Away Recent xG Against",
    "form_pts_diff": "Form Points Differential",
    "form_gf_diff": "Form Goal Differential",
    "form_xg_diff": "xG Form Differential",
    "h2h_home_win_rate": "Head-to-Head Win Rate",
    "h2h_goal_diff": "Head-to-Head Goal Advantage",
    "home_rest_days": "Home Rest Days",
    "away_rest_days": "Away Rest Days",
    "rest_advantage": "Rest Day Advantage",
    "home_advantage": "Home Ground Advantage",
    "home_lineup_xg90": "Home Lineup xG per 90",
    "home_lineup_shots90": "Home Lineup Shots per 90",
    "home_lineup_goals90": "Home Lineup Goals per 90",
    "away_lineup_xg90": "Away Lineup xG per 90",
    "away_lineup_shots90": "Away Lineup Shots per 90",
    "away_lineup_goals90": "Away Lineup Goals per 90",
    "home_lineup_xa90": "Home Lineup xA per 90",
    "home_lineup_key_passes90": "Home Key Passes per 90",
    "home_lineup_prog_passes90": "Home Progressive Passes per 90",
    "away_lineup_xa90": "Away Lineup xA per 90",
    "away_lineup_key_passes90": "Away Key Passes per 90",
    "away_lineup_prog_passes90": "Away Progressive Passes per 90",
    "home_lineup_tackles90": "Home Tackles per 90",
    "home_lineup_interceptions90": "Home Interceptions per 90",
    "home_lineup_clearances90": "Home Clearances per 90",
    "away_lineup_tackles90": "Away Tackles per 90",
    "away_lineup_interceptions90": "Away Interceptions per 90",
    "away_lineup_clearances90": "Away Clearances per 90",
    "home_lineup_pressures90": "Home Pressing Intensity",
    "away_lineup_pressures90": "Away Pressing Intensity",
    "xg90_diff": "xG Lineup Advantage",
    "xa90_diff": "xA Lineup Advantage",
    "tackles90_diff": "Tackle Dominance",
    "interceptions90_diff": "Midfield Interception Advantage",
    "pressures90_diff": "Pressing Advantage",
    "shots90_diff": "Shot Volume Advantage",
    "home_avg_shots": "Home Historical Shot Rate",
    "away_avg_shots": "Away Historical Shot Rate",
    "home_avg_shots_ot": "Home Shots on Target Rate",
    "away_avg_shots_ot": "Away Shots on Target Rate",
}

TACTICAL_INTERPRETATIONS: dict[str, dict[str, str]] = {
    "form_pts_diff": {
        "positive": "The home side has been collecting more points recently, suggesting better current form.",
        "negative": "The away side is in superior form, arriving with more momentum.",
    },
    "form_xg_diff": {
        "positive": "The home side's attack is generating higher expected threat over recent matches.",
        "negative": "The away attack is creating more quality chances in recent form.",
    },
    "h2h_home_win_rate": {
        "positive": "Historical meetings favour the home side — they tend to find solutions in this fixture.",
        "negative": "The away side has the better head-to-head record at this venue.",
    },
    "interceptions90_diff": {
        "positive": "The home midfield recovers more possession in central zones, limiting transition opportunities.",
        "negative": "The away midfield is more disruptive — higher interception rate limits home progression.",
    },
    "xg90_diff": {
        "positive": "The selected home lineup generates significantly more attacking quality per 90.",
        "negative": "The away lineup creates more expected threat — their attackers are the dangerous unit.",
    },
    "xa90_diff": {
        "positive": "Home creators are feeding more dangerous positions — higher xA lineup metric.",
        "negative": "Away creators provide more chance-creation quality in this lineup.",
    },
    "pressures90_diff": {
        "positive": "The home side presses more aggressively, likely to regain possession in dangerous areas.",
        "negative": "The away side's pressing intensity is higher, which may disrupt home build-up.",
    },
    "tackles90_diff": {
        "positive": "The home defensive block wins more duels per 90, providing a solid defensive platform.",
        "negative": "The away side contests more duels successfully — defensive solidity advantage.",
    },
    "home_advantage": {
        "positive": "Playing at home provides crowd support and familiarity of surroundings.",
        "negative": "Despite home advantage, the model signals overall away strength.",
    },
    "rest_advantage": {
        "positive": "The home side had more recovery time — fresher legs may provide a late-game edge.",
        "negative": "The away side is better rested, which can contribute to higher intensity.",
    },
    "shots90_diff": {
        "positive": "Home lineup generates more shot volume — quantity of opportunities may compensate for quality.",
        "negative": "The away side creates more shot volume — higher threat through sheer quantity.",
    },
    "home_lineup_xg90": {
        "positive": "Home attackers are generating high xG per 90 — a credible offensive threat.",
        "negative": "Home attacking output is lower — fewer quality scoring positions expected.",
    },
    "away_lineup_interceptions90": {
        "positive": "Away midfield interception rate is high — they may strangle home possession cycles.",
        "negative": "Away midfield interception rate is low — home can play through more easily.",
    },
}

DEFAULT_INTERPRETATION = (
    "This feature reflects a measurable performance difference between the two teams "
    "that the model weighted as influential in estimating the outcome."
)


def _tactical_interpretation(feature: str, direction: str) -> str:
    entry = TACTICAL_INTERPRETATIONS.get(feature)
    if entry:
        return entry.get(direction, DEFAULT_INTERPRETATION)
    return DEFAULT_INTERPRETATION


class SHAPExplainer:
    """
    Wraps SHAP TreeExplainer for the XGBoost model.
    Converts raw SHAP values into ranked, annotated feature contributions.
    """

    def __init__(self, model, feature_names: Optional[list[str]] = None):
        self.model = model
        self.feature_names = feature_names or FEATURE_NAMES
        self._explainer = shap.TreeExplainer(model)
        log.info("SHAP TreeExplainer initialised")

    def explain(
        self,
        X_row: pd.DataFrame,
        predicted_class: int,
        top_n: int = 8,
    ) -> list[dict]:
        """
        Compute SHAP values for a single prediction row.

        Args:
            X_row: single-row DataFrame (shape 1 × n_features)
            predicted_class: 0=HOME_WIN, 1=DRAW, 2=AWAY_WIN
            top_n: number of top features to return

        Returns:
            List of feature contribution dicts, sorted by abs(impact) descending.
        """
        shap_values = self._explainer.shap_values(X_row)

        # shap_values shape: (n_classes, 1, n_features) or (1, n_features, n_classes)
        if isinstance(shap_values, list):
            # List of arrays, one per class
            class_shap = shap_values[predicted_class][0]
        elif hasattr(shap_values, "ndim") and shap_values.ndim == 3:
            class_shap = shap_values[0, :, predicted_class]
        else:
            class_shap = shap_values[0]

        feature_values = X_row.iloc[0].to_dict()

        contributions = []
        for i, feat_name in enumerate(self.feature_names):
            shap_val = float(class_shap[i]) if i < len(class_shap) else 0.0
            feat_val = feature_values.get(feat_name, 0.0)
            if math.isnan(shap_val):
                shap_val = 0.0

            human_label = FEATURE_LABELS.get(feat_name, feat_name.replace("_", " ").title())
            direction = "positive" if shap_val > 0 else "negative"
            interp = _tactical_interpretation(feat_name, direction)

            contributions.append({
                "feature": feat_name,
                "human_label": human_label,
                "shap_value": round(shap_val, 4),
                "impact": round(abs(shap_val), 4),
                "direction": direction,
                "feature_value": round(float(feat_val), 4) if isinstance(feat_val, (int, float)) else feat_val,
                "tactical_interpretation": interp,
            })

        # Sort by absolute impact descending
        contributions.sort(key=lambda x: x["impact"], reverse=True)
        return contributions[:top_n]

    def top_positive(self, contributions: list[dict], n: int = 3) -> list[dict]:
        return [c for c in contributions if c["direction"] == "positive"][:n]

    def top_negative(self, contributions: list[dict], n: int = 3) -> list[dict]:
        return [c for c in contributions if c["direction"] == "negative"][:n]


def generate_tactical_summary(
    contributions: list[dict],
    home_team: str,
    away_team: str,
    predicted_class: int,
    home_win_prob: float,
    home_xg: float,
    away_xg: float,
) -> str:
    """
    Generate plain-English tactical summary from SHAP contributions.
    Never fabricates a reason not grounded in model features.
    """
    outcome_label = {0: f"{home_team} win", 1: "Draw", 2: f"{away_team} win"}[predicted_class]
    prob_pct = round(home_win_prob * 100, 1)

    positives = [c for c in contributions if c["direction"] == "positive"][:2]
    negatives = [c for c in contributions if c["direction"] == "negative"][:1]

    lines = [
        f"MODEL ESTIMATE: {outcome_label.upper()} ({prob_pct}% home win probability).",
        f"Expected goals: {home_team} {home_xg:.2f} — {away_xg:.2f} {away_team}.",
        "",
    ]

    if positives:
        primary = positives[0]
        lines.append(f"PRIMARY DRIVER: {primary['human_label']}")
        lines.append(f"IMPACT: Positive (SHAP +{primary['shap_value']:.3f})")
        lines.append(f"TACTICAL INTERPRETATION: {primary['tactical_interpretation']}")
        lines.append("")

    if len(positives) > 1:
        secondary = positives[1]
        lines.append(f"SUPPORTING SIGNAL: {secondary['human_label']}")
        lines.append(f"  {secondary['tactical_interpretation']}")
        lines.append("")

    if negatives:
        counter = negatives[0]
        lines.append(f"COUNTER-SIGNAL: {counter['human_label']}")
        lines.append(f"IMPACT: Negative (SHAP {counter['shap_value']:.3f})")
        lines.append(f"  {counter['tactical_interpretation']}")
        lines.append("")

    lines.append(
        "NOTE: These are model estimates based on historical patterns and "
        "lineup metrics. SHAP values indicate feature influence, not causal certainty."
    )

    return "\n".join(lines)
