"""
KICKWISE — Dataset Validator
Runs standalone validation checks against raw and processed data,
printing a structured summary report.

Usage:
    python scripts/validate_dataset.py
"""

from __future__ import annotations

import logging
import sys
from pathlib import Path

import numpy as np
import pandas as pd
from dotenv import load_dotenv

ROOT = Path(__file__).resolve().parent.parent
DATA_RAW = ROOT / "data" / "raw"
DATA_PROCESSED = ROOT / "data" / "processed"

load_dotenv(ROOT / ".env")

logging.basicConfig(level=logging.INFO, format="%(levelname)-8s | %(message)s")
log = logging.getLogger("kickwise.validate")

# Thresholds
MAX_GOALS = 20
MIN_MINUTES = 1
MIN_ROWS_MATCH = 50


def validate_match_data(df: pd.DataFrame) -> list[str]:
    issues: list[str] = []

    req_cols = ["match_id", "home_team", "away_team", "home_goals", "away_goals", "result", "season", "match_date"]
    for c in req_cols:
        if c not in df.columns:
            issues.append(f"MISSING COLUMN: {c}")

    if len(df) < MIN_ROWS_MATCH:
        issues.append(f"TOO FEW ROWS: only {len(df)} match rows (expected >= {MIN_ROWS_MATCH})")

    dups = df.duplicated(subset=["season", "match_date", "home_team", "away_team"]).sum()
    if dups:
        issues.append(f"DUPLICATES: {dups} duplicate (season, date, home, away) rows")

    if "home_goals" in df.columns and "away_goals" in df.columns:
        bad = ((df["home_goals"] < 0) | (df["away_goals"] < 0) |
               (df["home_goals"] > MAX_GOALS) | (df["away_goals"] > MAX_GOALS))
        if bad.any():
            issues.append(f"IMPOSSIBLE GOALS: {bad.sum()} rows")

    if "result" in df.columns:
        valid_results = {"H", "D", "A"}
        invalid = ~df["result"].isin(valid_results)
        if invalid.any():
            issues.append(f"INVALID RESULT: {invalid.sum()} rows with unexpected result values")

    if "match_date" in df.columns:
        null_dates = df["match_date"].isna().sum()
        if null_dates:
            issues.append(f"NULL DATES: {null_dates} rows")

    null_target = df[["home_team", "away_team"]].isna().any(axis=1).sum()
    if null_target:
        issues.append(f"NULL TEAM NAMES: {null_target} rows")

    return issues


def validate_player_data(df: pd.DataFrame) -> list[str]:
    issues: list[str] = []

    if df.empty:
        issues.append("EMPTY PLAYER DATASET")
        return issues

    req_cols = ["player_id", "player_name", "team", "season", "minutes"]
    for c in req_cols:
        if c not in df.columns:
            issues.append(f"MISSING COLUMN: {c}")

    if "minutes" in df.columns:
        neg_min = (df["minutes"] < 0).sum()
        if neg_min:
            issues.append(f"NEGATIVE MINUTES: {neg_min} rows")
        zero_min = (df["minutes"] == 0).sum()
        if zero_min:
            issues.append(f"ZERO MINUTES: {zero_min} rows (these must be filtered before per-90 calc)")

    dups = df.duplicated(subset=["player_id", "season", "team"]).sum()
    if dups:
        issues.append(f"DUPLICATES: {dups} duplicate (player_id, season, team) rows")

    per90_cols = [c for c in df.columns if c.endswith("_90")]
    for col in per90_cols:
        inf_count = np.isinf(df[col].fillna(0)).sum()
        if inf_count:
            issues.append(f"INFINITE VALUES in {col}: {inf_count}")

    return issues


def check_probability_invariant(probs: list[float], tol: float = 0.01) -> bool:
    """Verify that outcome probabilities sum to approximately 1."""
    total = sum(probs)
    return abs(total - 1.0) <= tol


def main() -> int:
    log.info("=" * 60)
    log.info("KICKWISE — Dataset Validation Report")
    log.info("=" * 60)

    all_issues: list[str] = []
    warnings: int = 0
    errors: int = 0

    # ── Match data ─────────────────────────────────────────────────────────────
    match_parquet = DATA_PROCESSED / "match_history.parquet"
    if match_parquet.exists():
        df_match = pd.read_parquet(match_parquet)
        log.info(f"Match rows loaded: {len(df_match):,}")
        issues = validate_match_data(df_match)
        if issues:
            for i in issues:
                log.warning(f"  ⚠ {i}")
                all_issues.append(i)
                warnings += 1
        else:
            log.info("  ✓ Match data passed all checks")
    else:
        log.warning("  ⚠ match_history.parquet not found — run update_pipeline.py first")
        warnings += 1

    # ── Player data ─────────────────────────────────────────────────────────────
    player_parquet = DATA_PROCESSED / "player_metrics.parquet"
    if player_parquet.exists():
        df_player = pd.read_parquet(player_parquet)
        log.info(f"Player rows loaded: {len(df_player):,}")
        issues = validate_player_data(df_player)
        if issues:
            for i in issues:
                log.warning(f"  ⚠ {i}")
                all_issues.append(i)
                warnings += 1
        else:
            log.info("  ✓ Player data passed all checks")
    else:
        log.warning("  ⚠ player_metrics.parquet not found")
        warnings += 1

    # ── Summary ──────────────────────────────────────────────────────────────────
    log.info("─" * 60)
    log.info(f"Validation warnings : {warnings}")
    log.info(f"Validation errors   : {errors}")
    log.info(f"Total issues        : {len(all_issues)}")
    log.info("=" * 60)

    return 1 if errors > 0 else 0


if __name__ == "__main__":
    sys.exit(main())
