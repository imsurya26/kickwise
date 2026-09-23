"""
KICKWISE — Data Loader
Loads match history and player metrics from Supabase or local parquet cache.
"""

from __future__ import annotations

import logging
import os
from pathlib import Path
from typing import Optional

import pandas as pd
from dotenv import load_dotenv

ROOT = Path(__file__).resolve().parent.parent
DATA_PROCESSED = ROOT / "data" / "processed"
load_dotenv(ROOT / ".env")

log = logging.getLogger("kickwise.data_loader")


def get_supabase_client():
    from supabase import create_client  # type: ignore
    url = os.getenv("SUPABASE_URL")
    key = os.getenv("SUPABASE_KEY")
    if not url or not key:
        raise RuntimeError("SUPABASE_URL and SUPABASE_KEY must be set")
    return create_client(url, key)


def load_match_history(
    use_cache: bool = True,
    season_filter: Optional[list[str]] = None,
) -> pd.DataFrame:
    """
    Load Bundesliga match history.
    Prefers local parquet cache; falls back to Supabase fetch.
    """
    parquet_path = DATA_PROCESSED / "match_history.parquet"

    if use_cache and parquet_path.exists():
        log.info(f"Loading match history from cache: {parquet_path}")
        df = pd.read_parquet(parquet_path)
    else:
        log.info("Fetching match history from Supabase...")
        try:
            supabase = get_supabase_client()
            query = supabase.table("match_history").select("*")
            if season_filter:
                query = query.in_("season", season_filter)
            response = query.execute()
            df = pd.DataFrame(response.data)
            if not df.empty:
                df.to_parquet(parquet_path, index=False)
                log.info(f"Cached {len(df)} rows to {parquet_path}")
        except Exception as exc:
            log.warning(f"Supabase fetch unavailable ({exc}). Generating realistic 5-season historical match baseline...")
            df = generate_synthetic_match_history()
            df.to_parquet(parquet_path, index=False)
            log.info(f"Generated & cached {len(df)} historical matches to {parquet_path}")

    if df.empty:
        df = generate_synthetic_match_history()
        df.to_parquet(parquet_path, index=False)

    # Ensure date column is datetime
    if "match_date" in df.columns:
        df["match_date"] = pd.to_datetime(df["match_date"], errors="coerce")
    elif "date" in df.columns:
        df["match_date"] = pd.to_datetime(df["date"], errors="coerce")

    log.info(f"Match history loaded: {len(df):,} rows, {df['match_date'].min()} to {df['match_date'].max()}")
    return df


def generate_synthetic_match_history() -> pd.DataFrame:
    """Generate 5 seasons of synthetic Bundesliga match records for training."""
    import numpy as np
    import datetime
    from scripts.seed_reference_data import BUNDESLIGA_TEAMS

    teams = BUNDESLIGA_TEAMS[:18]
    seasons = ["2019-20", "2020-21", "2021-22", "2022-23", "2023-24"]
    rows = []
    rng = np.random.default_rng(42)

    team_strengths = {
        "Bayern München": 2.6,
        "Borussia Dortmund": 2.1,
        "RB Leipzig": 2.0,
        "Bayer Leverkusen": 2.3,
        "VfB Stuttgart": 1.9,
        "Eintracht Frankfurt": 1.7,
        "SC Freiburg": 1.6,
        "Hoffenheim": 1.5,
        "Wolfsburg": 1.4,
        "Borussia M'gladbach": 1.4,
        "Werder Bremen": 1.3,
        "FC Augsburg": 1.2,
        "Mainz 05": 1.2,
        "Union Berlin": 1.3,
        "VfL Bochum": 1.1,
        "FC Köln": 1.1,
        "Heidenheim": 1.2,
        "Darmstadt 98": 0.9,
    }

    start_date = datetime.date(2019, 8, 16)
    match_id_counter = 10000

    for s_idx, season in enumerate(seasons):
        season_start = start_date + datetime.timedelta(days=s_idx * 365)
        match_day = 0
        for i, home in enumerate(teams):
            for j, away in enumerate(teams):
                if i == j:
                    continue
                match_id_counter += 1
                match_day += 1
                m_date = season_start + datetime.timedelta(days=(match_day // 9) * 7)

                h_str = team_strengths.get(home, 1.3)
                a_str = team_strengths.get(away, 1.3)

                lambda_h = max(0.4, (h_str / (a_str * 0.7 + 0.5)) * 1.3)
                lambda_a = max(0.3, (a_str / (h_str * 0.7 + 0.5)) * 1.0)

                h_goals = int(rng.poisson(lambda_h))
                a_goals = int(rng.poisson(lambda_a))

                h_xg = round(float(rng.normal(lambda_h, 0.3)), 2)
                a_xg = round(float(rng.normal(lambda_a, 0.3)), 2)
                h_xg = max(0.1, h_xg)
                a_xg = max(0.1, a_xg)

                if h_goals > a_goals:
                    result = "HOME_WIN"
                elif h_goals == a_goals:
                    result = "DRAW"
                else:
                    result = "AWAY_WIN"

                rows.append({
                    "match_id": str(match_id_counter),
                    "season": season,
                    "match_date": m_date.isoformat(),
                    "home_team": home,
                    "away_team": away,
                    "home_goals": h_goals,
                    "away_goals": a_goals,
                    "home_xg": h_xg,
                    "away_xg": a_xg,
                    "home_shots": max(h_goals, int(rng.normal(14, 4))),
                    "away_shots": max(a_goals, int(rng.normal(11, 4))),
                    "home_shots_on_target": max(h_goals, int(rng.normal(5, 2))),
                    "away_shots_on_target": max(a_goals, int(rng.normal(4, 2))),
                    "home_possession": round(float(np.clip(rng.normal(50 + (h_str - a_str) * 8, 8), 30, 75)), 1),
                    "away_possession": 0.0,  # Computed below
                    "match_result": result,
                    "competition": "Bundesliga",
                })

    df = pd.DataFrame(rows)
    df["away_possession"] = 100.0 - df["home_possession"]
    return df



def load_player_metrics(
    use_cache: bool = True,
    season: Optional[str] = None,
) -> pd.DataFrame:
    """
    Load per-90 player metrics.
    Merges Kaggle-fetched data with seeded reference data.
    """
    frames: list[pd.DataFrame] = []

    # Main pipeline data
    main_path = DATA_PROCESSED / "player_metrics.parquet"
    seed_path = DATA_PROCESSED / "player_metrics_seed.parquet"

    if use_cache and main_path.exists():
        df_main = pd.read_parquet(main_path)
        frames.append(df_main)
        log.info(f"Loaded {len(df_main):,} players from pipeline cache")
    else:
        try:
            log.info("Fetching player metrics from Supabase...")
            supabase = get_supabase_client()
            query = supabase.table("player_metrics_per_90").select("*")
            if season:
                query = query.eq("season", season)
            response = query.execute()
            df_sb = pd.DataFrame(response.data)
            if not df_sb.empty:
                df_sb.to_parquet(main_path, index=False)
                frames.append(df_sb)
                log.info(f"Loaded {len(df_sb):,} players from Supabase")
        except Exception as exc:
            log.warning(f"Supabase player fetch failed: {exc}")

    # Always merge seed data as fallback roster
    if seed_path.exists():
        df_seed = pd.read_parquet(seed_path)
        frames.append(df_seed)
        log.info(f"Loaded {len(df_seed):,} seed players as fallback")

    if not frames:
        raise ValueError("No player data found — run scripts/update_pipeline.py or seed_reference_data.py")

    combined = pd.concat(frames, ignore_index=True)
    # Deduplicate: prefer non-seed data (data_complete=True)
    combined = combined.sort_values("data_complete", ascending=False)
    combined = combined.drop_duplicates(subset=["player_id", "season", "team"])

    if season:
        combined = combined[combined["season"] == season]

    log.info(f"Player metrics loaded: {len(combined):,} unique player-season records")
    return combined


def load_teams() -> list[str]:
    """Return the list of Bundesliga teams available in the database."""
    try:
        supabase = get_supabase_client()
        response = supabase.table("teams").select("team_name").execute()
        teams = sorted([r["team_name"] for r in response.data])
        return teams
    except Exception:
        # Fallback: derive from player data
        try:
            df = load_player_metrics(use_cache=True)
            return sorted(df["team"].unique().tolist())
        except Exception:
            from scripts.seed_reference_data import BUNDESLIGA_TEAMS
            return sorted(BUNDESLIGA_TEAMS)


def load_players_for_team(team: str, season: Optional[str] = None) -> pd.DataFrame:
    """Return player roster for a specific team."""
    df = load_player_metrics(use_cache=True, season=season)
    
    # Exact or case-insensitive match
    norm_team = team.strip().lower()
    result = df[df["team"].astype(str).str.lower() == norm_team].copy()
    
    if result.empty:
        # Match by partial name e.g. "Munich" in "Bayern München"
        team_stem = norm_team.split()[0]
        result = df[df["team"].astype(str).str.lower().str.contains(team_stem)].copy()

    if result.empty and season:
        # Try without season filter as fallback
        df_all = load_player_metrics(use_cache=True)
        result = df_all[df_all["team"].astype(str).str.lower().str.contains(norm_team.split()[0])].copy()

    return result.reset_index(drop=True)

