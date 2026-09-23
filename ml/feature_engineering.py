"""
KICKWISE — Feature Engineering
Constructs pre-match prediction features from match history and player metrics.
Strictly prevents target leakage — only uses information available before kick-off.
"""

from __future__ import annotations

import logging
from typing import Optional

import numpy as np
import pandas as pd

log = logging.getLogger("kickwise.features")

# ─── Position groups for aggregation ──────────────────────────────────────────
POSITION_GROUPS = {
    "GK": ["GK"],
    "DEF": ["DEF"],
    "MID": ["MID"],
    "FWD": ["FWD"],
}

# Weights for each group per feature type (attacking, possession, defensive)
ATTACKING_WEIGHTS = {"GK": 0.0, "DEF": 0.1, "MID": 0.35, "FWD": 0.55}
POSSESSION_WEIGHTS = {"GK": 0.05, "DEF": 0.2, "MID": 0.55, "FWD": 0.2}
DEFENSIVE_WEIGHTS = {"GK": 0.15, "DEF": 0.55, "MID": 0.25, "FWD": 0.05}
PRESSING_WEIGHTS = {"GK": 0.05, "DEF": 0.25, "MID": 0.45, "FWD": 0.25}

TARGET_LABEL_MAP = {
    "H": 0, "D": 1, "A": 2,
    "HOME_WIN": 0, "DRAW": 1, "AWAY_WIN": 2,
    "HOME": 0, "AWAY": 2,
}

# ─── Model features (in order) ─────────────────────────────────────────────────
FEATURE_NAMES = [
    # Rolling form
    "home_form_gf_last5", "home_form_ga_last5", "home_form_pts_last5",
    "home_form_xg_last5", "home_form_xga_last5",
    "away_form_gf_last5", "away_form_ga_last5", "away_form_pts_last5",
    "away_form_xg_last5", "away_form_xga_last5",
    # Form differentials
    "form_pts_diff", "form_gf_diff", "form_xg_diff",
    # H2H
    "h2h_home_win_rate", "h2h_goal_diff",
    # Rest
    "home_rest_days", "away_rest_days", "rest_advantage",
    # Home advantage
    "home_advantage",
    # Lineup-level attacking
    "home_lineup_xg90", "home_lineup_shots90", "home_lineup_goals90",
    "away_lineup_xg90", "away_lineup_shots90", "away_lineup_goals90",
    # Lineup-level creation
    "home_lineup_xa90", "home_lineup_key_passes90", "home_lineup_prog_passes90",
    "away_lineup_xa90", "away_lineup_key_passes90", "away_lineup_prog_passes90",
    # Lineup-level defensive
    "home_lineup_tackles90", "home_lineup_interceptions90", "home_lineup_clearances90",
    "away_lineup_tackles90", "away_lineup_interceptions90", "away_lineup_clearances90",
    # Lineup-level pressing
    "home_lineup_pressures90", "away_lineup_pressures90",
    # Differentials
    "xg90_diff", "xa90_diff", "tackles90_diff", "interceptions90_diff",
    "pressures90_diff", "shots90_diff",
    # Season shots / corners (from match history aggregates)
    "home_avg_shots", "away_avg_shots",
    "home_avg_shots_ot", "away_avg_shots_ot",
]


def _safe_mean(series: pd.Series, default: float = 0.0) -> float:
    v = series.dropna()
    return float(v.mean()) if len(v) > 0 else default


def _weighted_aggregate(
    player_df: pd.DataFrame,
    metric_col: str,
    weight_map: dict[str, float],
    default: float = 0.0,
) -> float:
    """
    Compute a position-weighted aggregate of a per-90 metric across a lineup.
    """
    if player_df.empty or metric_col not in player_df.columns:
        return default

    total_weight = 0.0
    weighted_sum = 0.0

    for pos, weight in weight_map.items():
        subset = player_df[player_df["position"] == pos]
        if subset.empty or weight == 0:
            continue
        vals = subset[metric_col].dropna()
        if vals.empty:
            continue
        weighted_sum += vals.mean() * weight
        total_weight += weight

    return round(weighted_sum / total_weight, 4) if total_weight > 0 else default


def compute_lineup_features(
    lineup_df: pd.DataFrame, prefix: str = ""
) -> dict[str, float]:
    """
    Compute team-level feature aggregates from a lineup's player metrics.
    Uses position-weighted aggregation.
    """
    p = f"{prefix}_" if prefix and not prefix.endswith("_") else prefix
    feat: dict[str, float] = {}

    # Attacking (xG, shots, goals)
    feat[f"{p}lineup_xg90"] = _weighted_aggregate(lineup_df, "xg_90", ATTACKING_WEIGHTS)
    feat[f"{p}lineup_shots90"] = _weighted_aggregate(lineup_df, "shots_90", ATTACKING_WEIGHTS)
    feat[f"{p}lineup_goals90"] = _weighted_aggregate(lineup_df, "goals_90", ATTACKING_WEIGHTS)

    # Creation (xA, key passes, progressive passes)
    feat[f"{p}lineup_xa90"] = _weighted_aggregate(lineup_df, "xa_90", POSSESSION_WEIGHTS)
    feat[f"{p}lineup_key_passes90"] = _weighted_aggregate(lineup_df, "key_passes_90", POSSESSION_WEIGHTS)
    feat[f"{p}lineup_prog_passes90"] = _weighted_aggregate(lineup_df, "progressive_passes_90", POSSESSION_WEIGHTS)

    # Defensive (tackles, interceptions, clearances)
    feat[f"{p}lineup_tackles90"] = _weighted_aggregate(lineup_df, "tackles_90", DEFENSIVE_WEIGHTS)
    feat[f"{p}lineup_interceptions90"] = _weighted_aggregate(lineup_df, "interceptions_90", DEFENSIVE_WEIGHTS)
    feat[f"{p}lineup_clearances90"] = _weighted_aggregate(lineup_df, "clearances_90", DEFENSIVE_WEIGHTS)

    # Pressing
    feat[f"{p}lineup_pressures90"] = _weighted_aggregate(lineup_df, "pressures_90", PRESSING_WEIGHTS)

    return feat



def build_training_features(
    match_df: pd.DataFrame,
    player_df: Optional[pd.DataFrame] = None,
) -> tuple[pd.DataFrame, pd.Series]:
    """
    Build the final feature matrix and target labels from match history.

    Target: 0=HOME_WIN, 1=DRAW, 2=AWAY_WIN
    All features are pre-match information only.

    Args:
        match_df: cleaned match history DataFrame
        player_df: player per-90 metrics (used to compute team-level season averages)

    Returns:
        (X, y) tuple of feature matrix and encoded target
    """
    df = match_df.copy().sort_values("match_date").reset_index(drop=True)

    # ── Target label ──────────────────────────────────────────────────────────
    target_col = "result" if "result" in df.columns else ("match_result" if "match_result" in df.columns else None)
    if target_col is None:
        raise ValueError("match_df missing 'result' or 'match_result' column")
    y = df[target_col].map(TARGET_LABEL_MAP)
    invalid = y.isna()
    if invalid.any():
        log.warning(f"Dropping {invalid.sum()} rows with unmapped result values")
        df = df[~invalid].copy()
        y = y[~invalid]

    y = y.astype(int)

    # ── Form features ─────────────────────────────────────────────────────────
    form_cols = [
        "home_form_gf_last5", "home_form_ga_last5", "home_form_pts_last5",
        "home_form_xg_last5", "home_form_xga_last5",
        "away_form_gf_last5", "away_form_ga_last5", "away_form_pts_last5",
        "away_form_xg_last5", "away_form_xga_last5",
    ]
    for col in form_cols:
        if col not in df.columns:
            df[col] = 1.3  # Default baseline form

    df["form_pts_diff"] = df["home_form_pts_last5"].fillna(1.5) - df["away_form_pts_last5"].fillna(1.5)
    df["form_gf_diff"] = df["home_form_gf_last5"].fillna(1.3) - df["away_form_ga_last5"].fillna(1.3)
    df["form_xg_diff"] = df["home_form_xg_last5"].fillna(1.3) - df["away_form_xg_last5"].fillna(1.3)

    # ── H2H features ─────────────────────────────────────────────────────────
    for h_col in ["h2h_home_wins", "h2h_draws", "h2h_away_wins", "h2h_home_goals", "h2h_away_goals"]:
        if h_col not in df.columns:
            df[h_col] = 0.0

    h2h_total = df[["h2h_home_wins", "h2h_draws", "h2h_away_wins"]].sum(axis=1)
    df["h2h_home_win_rate"] = np.where(
        h2h_total > 0,
        df["h2h_home_wins"] / h2h_total,
        0.38
    )
    df["h2h_goal_diff"] = df["h2h_home_goals"] - df["h2h_away_goals"]

    # ── Rest days ─────────────────────────────────────────────────────────────
    df["home_rest_days"] = df.get("home_rest_days", pd.Series(7.0, index=df.index)).fillna(7.0)
    df["away_rest_days"] = df.get("away_rest_days", pd.Series(7.0, index=df.index)).fillna(7.0)
    df["rest_advantage"] = df["home_rest_days"] - df["away_rest_days"]


    # ── Home advantage ────────────────────────────────────────────────────────
    df["home_advantage"] = 1.0

    # ── Lineup features from player aggregates ────────────────────────────────
    # For training, we use team-season averages instead of exact lineup
    # (exact lineup is used at prediction time)
    if player_df is not None and not player_df.empty:
        team_aggs = _build_team_season_aggregates(player_df)
        # Merge for home team
        home_aggs = team_aggs.rename(columns={"team": "home_team", "season": "season"})
        home_aggs = home_aggs.rename(columns={c: f"home_{c}" for c in home_aggs.columns if c.startswith("lineup_")})
        df = df.merge(home_aggs, on=["home_team", "season"], how="left")

        # Merge for away team
        away_aggs = team_aggs.rename(columns={"team": "away_team", "season": "season"})
        away_aggs = away_aggs.rename(columns={c: f"away_{c}" for c in away_aggs.columns if c.startswith("lineup_")})
        df = df.merge(away_aggs, on=["away_team", "season"], how="left")
    for feat in [
        "lineup_xg90", "lineup_shots90", "lineup_goals90",
        "lineup_xa90", "lineup_key_passes90", "lineup_prog_passes90",
        "lineup_tackles90", "lineup_interceptions90", "lineup_clearances90",
        "lineup_pressures90",
    ]:
        h_col = f"home_{feat}"
        a_col = f"away_{feat}"
        if h_col not in df.columns:
            df[h_col] = 0.35
        else:
            df[h_col] = df[h_col].fillna(0.35)

        if a_col not in df.columns:
            df[a_col] = 0.35
        else:
            df[a_col] = df[a_col].fillna(0.35)

    # ── Differentials ─────────────────────────────────────────────────────────
    df["xg90_diff"] = df["home_lineup_xg90"] - df["away_lineup_xg90"]
    df["xa90_diff"] = df["home_lineup_xa90"] - df["away_lineup_xa90"]
    df["tackles90_diff"] = df["home_lineup_tackles90"] - df["away_lineup_tackles90"]
    df["interceptions90_diff"] = df["home_lineup_interceptions90"] - df["away_lineup_interceptions90"]
    df["pressures90_diff"] = df["home_lineup_pressures90"] - df["away_lineup_pressures90"]
    df["shots90_diff"] = df["home_lineup_shots90"] - df["away_lineup_shots90"]


    # ── Historical shot averages ───────────────────────────────────────────────
    for col, default in [
        ("home_shots", "home_avg_shots"), ("away_shots", "away_avg_shots"),
        ("home_shots_on_target", "home_avg_shots_ot"), ("away_shots_on_target", "away_avg_shots_ot"),
    ]:
        if col in df.columns:
            df[default] = pd.to_numeric(df[col], errors="coerce").fillna(12.0)
        else:
            df[default] = 12.0

    # ── Select final feature columns ──────────────────────────────────────────
    available = [f for f in FEATURE_NAMES if f in df.columns]
    missing = [f for f in FEATURE_NAMES if f not in df.columns]
    if missing:
        log.warning(f"Features not available (will be filled with 0): {missing}")
        for f in missing:
            df[f] = 0.0

    X = df[FEATURE_NAMES].copy()
    X = X.fillna(0.0)

    log.info(f"Feature matrix built: {X.shape[0]} samples × {X.shape[1]} features")
    log.info(f"Target distribution: {y.value_counts().to_dict()}")

    return X, y


def _build_team_season_aggregates(player_df: pd.DataFrame) -> pd.DataFrame:
    """
    Compute team-season level weighted averages from the full squad,
    simulating a default lineup of 11 starters across all positions.
    """
    records = []
    for (team, season), group in player_df.groupby(["team", "season"]):
        feat_home = compute_lineup_features(group, prefix="lineup")
        records.append({"team": team, "season": season, **feat_home})

    return pd.DataFrame(records)



def build_simulation_features(
    home_team: str,
    away_team: str,
    home_lineup_df: pd.DataFrame,
    away_lineup_df: pd.DataFrame,
    match_df: pd.DataFrame,
    season: str,
) -> pd.DataFrame:
    """
    Build a single-row feature vector for a What-If simulation request.
    Uses exact player lineup + historical match context.
    """
    # Compute lineup features from selected players
    home_feat = compute_lineup_features(home_lineup_df, prefix="home")
    away_feat = compute_lineup_features(away_lineup_df, prefix="away")

    # Get recent form from match history
    team_matches_home = match_df[match_df["home_team"] == home_team].copy()
    team_matches_away = match_df[match_df["away_team"] == away_team].copy()

    def recent_form(home_flag: bool, team: str, n: int = 5) -> dict:
        col_prefix = "home" if home_flag else "away"
        col_team = "home_team" if home_flag else "away_team"
        recent = match_df[match_df[col_team] == team].sort_values("match_date").tail(n)
        if recent.empty:
            return {
                f"{col_prefix}_form_gf_last5": 1.5,
                f"{col_prefix}_form_ga_last5": 1.5,
                f"{col_prefix}_form_pts_last5": 1.0,
                f"{col_prefix}_form_xg_last5": 1.5,
                f"{col_prefix}_form_xga_last5": 1.5,
            }
        res_col = "result" if "result" in recent.columns else ("match_result" if "match_result" in recent.columns else None)
        if res_col is not None:
            pts = recent[res_col].apply(
                lambda r: 3 if (home_flag and str(r).startswith("H")) or (not home_flag and str(r).startswith("A"))
                else (1 if str(r).startswith("D") else 0)
            )
        else:
            pts = pd.Series([1.0] * len(recent), index=recent.index)

        hxg = recent.get(f"{col_prefix}_xg", pd.Series(dtype=float))
        axg = recent.get(f"{'away' if home_flag else 'home'}_xg", pd.Series(dtype=float))
        return {
            f"{col_prefix}_form_gf_last5": float(recent["home_goals" if home_flag else "away_goals"].mean()),
            f"{col_prefix}_form_ga_last5": float(recent["away_goals" if home_flag else "home_goals"].mean()),
            f"{col_prefix}_form_pts_last5": float(pts.mean()) if len(pts) > 0 else 1.0,
            f"{col_prefix}_form_xg_last5": float(hxg.mean()) if not hxg.empty else 1.5,
            f"{col_prefix}_form_xga_last5": float(axg.mean()) if not axg.empty else 1.5,
        }


    h_form = recent_form(True, home_team)
    a_form = recent_form(False, away_team)

    # H2H stats
    h2h = match_df[
        ((match_df["home_team"] == home_team) & (match_df["away_team"] == away_team)) |
        ((match_df["home_team"] == away_team) & (match_df["away_team"] == home_team))
    ].tail(5)

    if len(h2h) > 0:
        res_col = "result" if "result" in h2h.columns else ("match_result" if "match_result" in h2h.columns else None)
        if res_col is not None:
            is_h = h2h[res_col].astype(str).str.startswith("H")
            is_a = h2h[res_col].astype(str).str.startswith("A")
            hw = ((h2h["home_team"] == home_team) & is_h).sum() + \
                 ((h2h["away_team"] == home_team) & is_a).sum()
            aw = ((h2h["home_team"] == away_team) & is_h).sum() + \
                 ((h2h["away_team"] == away_team) & is_a).sum()
        else:
            hw, aw = 1, 1
        h2h_home_win_rate = hw / max(len(h2h), 1)
        h2h_goal_diff = (
            h2h[h2h["home_team"] == home_team]["home_goals"].sum() +
            h2h[h2h["away_team"] == home_team]["away_goals"].sum() -
            h2h[h2h["home_team"] == away_team]["home_goals"].sum() -
            h2h[h2h["away_team"] == away_team]["away_goals"].sum()
        ) / max(len(h2h), 1)
    else:
        h2h_home_win_rate = 0.33
        h2h_goal_diff = 0.0


    # Average shots from historical matches
    home_avg_shots = float(
        match_df[match_df["home_team"] == home_team]["home_shots"].dropna().mean()
    ) if "home_shots" in match_df.columns else 12.0
    away_avg_shots = float(
        match_df[match_df["away_team"] == away_team]["away_shots"].dropna().mean()
    ) if "away_shots" in match_df.columns else 11.0
    home_avg_shots_ot = float(
        match_df[match_df["home_team"] == home_team]["home_shots_on_target"].dropna().mean()
    ) if "home_shots_on_target" in match_df.columns else 4.5
    away_avg_shots_ot = float(
        match_df[match_df["away_team"] == away_team]["away_shots_on_target"].dropna().mean()
    ) if "away_shots_on_target" in match_df.columns else 4.0

    row = {
        **h_form, **a_form, **home_feat, **away_feat,
        "form_pts_diff": h_form["home_form_pts_last5"] - a_form["away_form_pts_last5"],
        "form_gf_diff": h_form["home_form_gf_last5"] - a_form["away_form_ga_last5"],
        "form_xg_diff": h_form["home_form_xg_last5"] - a_form["away_form_xg_last5"],
        "h2h_home_win_rate": h2h_home_win_rate,
        "h2h_goal_diff": h2h_goal_diff,
        "home_rest_days": 7.0,
        "away_rest_days": 7.0,
        "rest_advantage": 0.0,
        "home_advantage": 1.0,
        "xg90_diff": home_feat["home_lineup_xg90"] - away_feat["away_lineup_xg90"],
        "xa90_diff": home_feat["home_lineup_xa90"] - away_feat["away_lineup_xa90"],
        "tackles90_diff": home_feat["home_lineup_tackles90"] - away_feat["away_lineup_tackles90"],
        "interceptions90_diff": home_feat["home_lineup_interceptions90"] - away_feat["away_lineup_interceptions90"],
        "pressures90_diff": home_feat["home_lineup_pressures90"] - away_feat["away_lineup_pressures90"],
        "shots90_diff": home_feat["home_lineup_shots90"] - away_feat["away_lineup_shots90"],
        "home_avg_shots": home_avg_shots if not np.isnan(home_avg_shots) else 12.0,
        "away_avg_shots": away_avg_shots if not np.isnan(away_avg_shots) else 11.0,
        "home_avg_shots_ot": home_avg_shots_ot if not np.isnan(home_avg_shots_ot) else 4.5,
        "away_avg_shots_ot": away_avg_shots_ot if not np.isnan(away_avg_shots_ot) else 4.0,
    }

    df_row = pd.DataFrame([row])

    # Ensure all feature columns present
    for feat in FEATURE_NAMES:
        if feat not in df_row.columns:
            df_row[feat] = 0.0

    return df_row[FEATURE_NAMES].fillna(0.0)
