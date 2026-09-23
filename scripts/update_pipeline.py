"""
KICKWISE — Bundesliga Data Ingestion & Update Pipeline
Fetches Bundesliga match + player data from Kaggle, cleans it,
computes per-90 metrics, and upserts into Supabase.

Usage:
    python scripts/update_pipeline.py
"""

from __future__ import annotations

import hashlib
import json
import logging
import math
import os
import re
import sys
import zipfile
from pathlib import Path
from typing import Any, Optional

import numpy as np
import pandas as pd
from dotenv import load_dotenv

# ─── Paths ────────────────────────────────────────────────────────────────────
ROOT = Path(__file__).resolve().parent.parent
DATA_RAW = ROOT / "data" / "raw"
DATA_PROCESSED = ROOT / "data" / "processed"

DATA_RAW.mkdir(parents=True, exist_ok=True)
DATA_PROCESSED.mkdir(parents=True, exist_ok=True)

load_dotenv(ROOT / ".env")

# ─── Logging ──────────────────────────────────────────────────────────────────
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s | %(levelname)-8s | %(name)s | %(message)s",
    handlers=[
        logging.StreamHandler(sys.stdout),
        logging.FileHandler(ROOT / "data" / "pipeline.log", encoding="utf-8"),
    ],
)
log = logging.getLogger("kickwise.pipeline")

# ─── Stats counters ───────────────────────────────────────────────────────────
STATS: dict[str, int] = {
    "rows_downloaded": 0,
    "rows_retained": 0,
    "rows_removed": 0,
    "players_processed": 0,
    "matches_processed": 0,
    "supabase_inserted": 0,
    "supabase_updated": 0,
    "validation_warnings": 0,
    "validation_errors": 0,
}

# ─── Team-name normalisation map ──────────────────────────────────────────────
TEAM_NORMALISATION: dict[str, str] = {
    "fc bayern münchen": "Bayern München",
    "fc bayern munich": "Bayern München",
    "bayern munich": "Bayern München",
    "bayer 04 leverkusen": "Bayer Leverkusen",
    "bayer leverkusen": "Bayer Leverkusen",
    "borussia dortmund": "Borussia Dortmund",
    "rb leipzig": "RB Leipzig",
    "rasenballsport leipzig": "RB Leipzig",
    "vfb stuttgart": "VfB Stuttgart",
    "eintracht frankfurt": "Eintracht Frankfurt",
    "sc freiburg": "SC Freiburg",
    "1. fc union berlin": "Union Berlin",
    "union berlin": "Union Berlin",
    "tsg 1899 hoffenheim": "Hoffenheim",
    "tsg hoffenheim": "Hoffenheim",
    "vfl wolfsburg": "Wolfsburg",
    "borussia mönchengladbach": "Borussia M'gladbach",
    "borussia monchengladbach": "Borussia M'gladbach",
    "borussia m'gladbach": "Borussia M'gladbach",
    "1. fc köln": "FC Köln",
    "fc köln": "FC Köln",
    "cologne": "FC Köln",
    "fc augsburg": "FC Augsburg",
    "augsburg": "FC Augsburg",
    "werder bremen": "Werder Bremen",
    "sv werder bremen": "Werder Bremen",
    "hertha berlin": "Hertha BSC",
    "hertha bsc": "Hertha BSC",
    "vfl bochum": "VfL Bochum",
    "bochum": "VfL Bochum",
    "fsv mainz 05": "Mainz 05",
    "mainz": "Mainz 05",
    "1. fsv mainz 05": "Mainz 05",
    "arminia bielefeld": "Arminia Bielefeld",
    "dsv arminia bielefeld": "Arminia Bielefeld",
    "fc schalke 04": "Schalke 04",
    "schalke 04": "Schalke 04",
    "schalke": "Schalke 04",
    "hamburger sv": "Hamburger SV",
    "hamburger": "Hamburger SV",
    "greuther furth": "Greuther Fürth",
    "spvgg greuther fürth": "Greuther Fürth",
    "1. fc heidenheim 1846": "Heidenheim",
    "heidenheim": "Heidenheim",
    "darmstadt 98": "Darmstadt 98",
    "sv darmstadt 98": "Darmstadt 98",
    "fc hansa rostock": "Hansa Rostock",
    "holstein kiel": "Holstein Kiel",
    "st. pauli": "St. Pauli",
    "fc st. pauli": "St. Pauli",
}

# ─── Kaggle datasets to try (in order) ────────────────────────────────────────
KAGGLE_DATASETS = [
    "hugomathien/soccer",
    "nizhib/football-events",
    "irkaal/football-events-from-sofascore",
    "davidcariboo/player-scores",
    "schochastics/football-data",
    "christianrupp/fbref-bundesliga-stats",
    "pablohfreitas/football-analytics-bundesliga-stats",
    "bkasimh/bundesliga-football-match-statistics",
    "mohamedhanyyy/football-bundesliga-dataset",
]

KAGGLE_SEARCH_TERMS = [
    "bundesliga",
    "german football",
    "german bundesliga",
]

MATCH_COLUMN_ALIASES: dict[str, list[str]] = {
    "home_team": ["hometeam", "home_team", "home team", "team_home", "squad"],
    "away_team": ["awayteam", "away_team", "away team", "team_away", "opponent"],
    "home_goals": ["fthg", "hg", "home_goals", "home_score", "hscore", "h_goals"],
    "away_goals": ["ftag", "ag", "away_goals", "away_score", "ascore", "a_goals"],
    "date": ["date", "match_date", "datetime", "matchdate", "gamedate"],
    "season": ["season", "season_year", "year"],
    "home_xg": ["home_xg", "xg_home", "hxg", "home_expected_goals", "hxg"],
    "away_xg": ["away_xg", "xg_away", "axg", "away_expected_goals", "axg"],
    "home_shots": ["hs", "home_shots", "shots_home"],
    "away_shots": ["as_", "as", "away_shots", "shots_away"],
    "home_shots_on_target": ["hst", "home_sot", "shots_on_target_home"],
    "away_shots_on_target": ["ast", "away_sot", "shots_on_target_away"],
    "home_corners": ["hc", "home_corners", "corners_home"],
    "away_corners": ["ac", "away_corners", "corners_away"],
    "home_fouls": ["hf", "home_fouls", "fouls_home"],
    "away_fouls": ["af", "away_fouls", "fouls_away"],
    "home_yellow": ["hy", "home_yellow", "yellow_cards_home"],
    "away_yellow": ["ay", "away_yellow", "yellow_cards_away"],
    "home_red": ["hr", "home_red", "red_cards_home"],
    "away_red": ["ar", "away_red", "red_cards_away"],
    "result": ["ftr", "result", "outcome", "full_time_result"],
}

PLAYER_COLUMN_ALIASES: dict[str, list[str]] = {
    "player_name": ["player", "name", "player_name", "full_name"],
    "team": ["team", "squad", "club", "team_name"],
    "season": ["season", "year", "season_year"],
    "position": ["position", "pos", "player_position"],
    "age": ["age"],
    "minutes": ["minutes", "min", "mins", "mp_minutes", "minutes_played"],
    "matches_played": ["mp", "matches", "games", "appearances"],
    "goals": ["goals", "gls", "g", "goal"],
    "assists": ["assists", "ast", "a", "assist"],
    "shots": ["shots", "sh", "total_shots"],
    "shots_on_target": ["shots_on_target", "sot", "son_target"],
    "xg": ["xg", "expected_goals", "exp_goals", "xg_"],
    "xa": ["xa", "xag", "expected_assists", "exp_assists"],
    "npxg": ["npxg", "non_penalty_xg"],
    "key_passes": ["key_passes", "kp", "keypasses"],
    "progressive_passes": ["progressive_passes", "prg_passes", "prog_passes", "prgp"],
    "progressive_carries": ["progressive_carries", "prg_carries", "prog_carries", "prgc"],
    "tackles": ["tackles", "tkl", "total_tackles"],
    "interceptions": ["interceptions", "int", "ints"],
    "blocks": ["blocks", "blk"],
    "clearances": ["clearances", "clr"],
    "pressures": ["pressures", "press"],
    "pressure_success": ["press_succ", "pressure_success", "successful_pressures"],
    "dribbles_completed": ["dribbles_completed", "succ_dribbles", "drib_succ", "carries_carries"],
    "pass_completion": ["pass_completion", "pass_pct", "cmp_pct", "completion_rate"],
    "nationality": ["nationality", "nation", "nat", "country"],
}


# ═══════════════════════════════════════════════════════════════════════════════
# KAGGLE AUTH
# ═══════════════════════════════════════════════════════════════════════════════

def setup_kaggle() -> None:
    """Configure Kaggle authentication from environment variables."""
    kaggle_dir = Path.home() / ".kaggle"
    kaggle_dir.mkdir(parents=True, exist_ok=True)
    kaggle_json = kaggle_dir / "kaggle.json"

    token = os.getenv("KAGGLE_API_TOKEN")
    username = os.getenv("KAGGLE_USERNAME")
    key = os.getenv("KAGGLE_KEY")

    if token and not kaggle_json.exists():
        # Modern token-based auth
        cred = {"key": token, "username": "kickwise_user"}
        kaggle_json.write_text(json.dumps(cred))
        kaggle_json.chmod(0o600)
        log.info("Kaggle auth configured via KAGGLE_API_TOKEN")
        return

    if username and key:
        cred = {"username": username, "key": key}
        kaggle_json.write_text(json.dumps(cred))
        kaggle_json.chmod(0o600)
        log.info("Kaggle auth configured via KAGGLE_USERNAME + KAGGLE_KEY")
        return

    if kaggle_json.exists():
        log.info("Kaggle auth using existing ~/.kaggle/kaggle.json")
        return

    raise RuntimeError(
        "Kaggle credentials missing. Set KAGGLE_API_TOKEN or KAGGLE_USERNAME+KAGGLE_KEY in .env"
    )


# ═══════════════════════════════════════════════════════════════════════════════
# KAGGLE DOWNLOAD
# ═══════════════════════════════════════════════════════════════════════════════

def download_kaggle_dataset(dataset_slug: str, dest: Path) -> Optional[Path]:
    """
    Download a Kaggle dataset and return the extraction directory.
    Returns None on failure.
    """
    import kaggle  # type: ignore

    out_dir = dest / dataset_slug.replace("/", "_")
    out_dir.mkdir(parents=True, exist_ok=True)

    try:
        log.info(f"Downloading Kaggle dataset: {dataset_slug}")
        kaggle.api.dataset_download_files(
            dataset_slug,
            path=str(out_dir),
            unzip=True,
            quiet=False,
        )
        files = list(out_dir.rglob("*.csv"))
        log.info(f"  → {len(files)} CSV files extracted to {out_dir}")
        return out_dir if files else None
    except Exception as exc:
        log.warning(f"  ✗ Failed to download {dataset_slug}: {exc}")
        return None


def search_and_download_bundesliga_data() -> list[Path]:
    """
    Try multiple Kaggle datasets to obtain Bundesliga match and player data.
    Returns list of directories that contain CSVs.
    """
    import kaggle  # type: ignore

    collected: list[Path] = []

    # Step 1: Try the known curated datasets
    for slug in KAGGLE_DATASETS:
        result = download_kaggle_dataset(slug, DATA_RAW)
        if result:
            collected.append(result)
        if len(collected) >= 3:
            break  # Have enough sources

    # Step 2: If still sparse, search Kaggle datasets programmatically
    if len(collected) < 2:
        for term in KAGGLE_SEARCH_TERMS:
            try:
                results = kaggle.api.dataset_list(search=term, sort_by="votes")
                for ds in results[:5]:
                    slug = f"{ds.ref}"
                    if slug not in KAGGLE_DATASETS:
                        result = download_kaggle_dataset(slug, DATA_RAW)
                        if result:
                            collected.append(result)
                            break
            except Exception as exc:
                log.warning(f"Kaggle search '{term}' failed: {exc}")

    return collected


# ═══════════════════════════════════════════════════════════════════════════════
# COLUMN MAPPING
# ═══════════════════════════════════════════════════════════════════════════════

def _normalise_col(c: str) -> str:
    return re.sub(r"[^a-z0-9_]", "_", c.lower().strip()).strip("_")


def map_columns(df: pd.DataFrame, alias_map: dict[str, list[str]]) -> pd.DataFrame:
    """
    Rename DataFrame columns to canonical names using alias_map.
    Any unmapped columns are preserved.
    """
    norm = {_normalise_col(c): c for c in df.columns}
    rename: dict[str, str] = {}

    for canonical, aliases in alias_map.items():
        if canonical in df.columns:
            continue
        for alias in aliases:
            alias_n = _normalise_col(alias)
            if alias_n in norm:
                rename[norm[alias_n]] = canonical
                break

    return df.rename(columns=rename)


# ═══════════════════════════════════════════════════════════════════════════════
# TEAM NORMALISATION
# ═══════════════════════════════════════════════════════════════════════════════

def normalise_team(name: Any) -> str:
    if not isinstance(name, str) or not name.strip():
        return ""
    key = name.strip().lower()
    return TEAM_NORMALISATION.get(key, name.strip())


# ═══════════════════════════════════════════════════════════════════════════════
# MATCH DATA PROCESSING
# ═══════════════════════════════════════════════════════════════════════════════

def discover_match_csv(directory: Path) -> list[Path]:
    """Find CSV files likely to contain match-level data."""
    candidates = []
    keywords = {"match", "game", "result", "fixture", "score", "bundesliga"}
    for f in directory.rglob("*.csv"):
        if any(k in f.name.lower() for k in keywords):
            candidates.append(f)
    # Also include all CSVs if nothing matched
    if not candidates:
        candidates = list(directory.rglob("*.csv"))
    return candidates


def infer_season(date: pd.Timestamp) -> str:
    """Derive season string from match date, e.g. '2022-23'."""
    if pd.isna(date):
        return "unknown"
    y, m = date.year, date.month
    if m >= 7:
        return f"{y}-{str(y+1)[-2:]}"
    return f"{y-1}-{str(y)[-2:]}"


def compute_rolling_form(df: pd.DataFrame) -> pd.DataFrame:
    """
    Compute rolling-5 form features for each team.
    Must be called BEFORE adding target labels to avoid leakage.
    """
    df = df.sort_values("date").reset_index(drop=True)

    team_history: dict[str, list[dict]] = {}

    form_rows = []
    for _, row in df.iterrows():
        ht, at = row["home_team"], row["away_team"]
        hg, ag = row["home_goals"], row["away_goals"]
        hxg = row.get("home_xg", np.nan)
        axg = row.get("away_xg", np.nan)

        def get_form(team: str, perspective: str) -> dict:
            hist = team_history.get(team, [])[-5:]
            if not hist:
                return {
                    f"{perspective}_form_gf_last5": np.nan,
                    f"{perspective}_form_ga_last5": np.nan,
                    f"{perspective}_form_pts_last5": np.nan,
                    f"{perspective}_form_xg_last5": np.nan,
                    f"{perspective}_form_xga_last5": np.nan,
                }
            gf = np.mean([h["gf"] for h in hist])
            ga = np.mean([h["ga"] for h in hist])
            pts = np.mean([h["pts"] for h in hist])
            xg_v = np.nanmean([h.get("xg", np.nan) for h in hist])
            xga_v = np.nanmean([h.get("xga", np.nan) for h in hist])
            return {
                f"{perspective}_form_gf_last5": round(gf, 3),
                f"{perspective}_form_ga_last5": round(ga, 3),
                f"{perspective}_form_pts_last5": round(pts, 3),
                f"{perspective}_form_xg_last5": round(float(xg_v) if not math.isnan(xg_v) else np.nan, 3)
                    if not math.isnan(float(xg_v) if not np.isnan(xg_v) else math.nan) else np.nan,
                f"{perspective}_form_xga_last5": round(float(xga_v) if not np.isnan(xga_v) else np.nan, 3)
                    if not np.isnan(xga_v) else np.nan,
            }

        home_form = get_form(ht, "home")
        away_form = get_form(at, "away")
        form_rows.append({**home_form, **away_form})

        # Update history after extracting form (prevent leakage)
        h_pts = 3 if hg > ag else (1 if hg == ag else 0)
        a_pts = 3 if ag > hg else (1 if hg == ag else 0)
        team_history.setdefault(ht, []).append({"gf": hg, "ga": ag, "pts": h_pts, "xg": hxg, "xga": axg})
        team_history.setdefault(at, []).append({"gf": ag, "ga": hg, "pts": a_pts, "xg": axg, "xga": hxg})

    form_df = pd.DataFrame(form_rows, index=df.index)
    return pd.concat([df, form_df], axis=1)


def compute_h2h(df: pd.DataFrame) -> pd.DataFrame:
    """Compute head-to-head stats (last 5 meetings) for each match row."""
    df = df.sort_values("date").reset_index(drop=True)
    h2h_store: dict[str, list[dict]] = {}

    h2h_rows = []
    for _, row in df.iterrows():
        ht, at = row["home_team"], row["away_team"]
        key = tuple(sorted([ht, at]))
        hist = h2h_store.get(str(key), [])[-5:]

        if not hist:
            h2h_rows.append({
                "h2h_home_wins": np.nan, "h2h_draws": np.nan, "h2h_away_wins": np.nan,
                "h2h_home_goals": np.nan, "h2h_away_goals": np.nan,
            })
        else:
            hw = sum(1 for h in hist if h["winner"] == ht)
            aw = sum(1 for h in hist if h["winner"] == at)
            dr = sum(1 for h in hist if h["winner"] == "draw")
            h2h_rows.append({
                "h2h_home_wins": hw,
                "h2h_draws": dr,
                "h2h_away_wins": aw,
                "h2h_home_goals": np.mean([h["home_gf"] for h in hist]),
                "h2h_away_goals": np.mean([h["away_gf"] for h in hist]),
            })

        winner = ht if row["home_goals"] > row["away_goals"] else (
            at if row["away_goals"] > row["home_goals"] else "draw"
        )
        h2h_store.setdefault(str(key), []).append({
            "winner": winner,
            "home_gf": row["home_goals"],
            "away_gf": row["away_goals"],
        })

    h2h_df = pd.DataFrame(h2h_rows, index=df.index)
    return pd.concat([df, h2h_df], axis=1)


def compute_rest_days(df: pd.DataFrame) -> pd.DataFrame:
    """Compute days since last match for each team."""
    df = df.sort_values("date").reset_index(drop=True)
    last_match: dict[str, pd.Timestamp] = {}
    rest_home, rest_away = [], []

    for _, row in df.iterrows():
        ht, at = row["home_team"], row["away_team"]
        d = row["date"]
        rest_home.append(int((d - last_match[ht]).days) if ht in last_match else np.nan)
        rest_away.append(int((d - last_match[at]).days) if at in last_match else np.nan)
        last_match[ht] = d
        last_match[at] = d

    df["home_rest_days"] = rest_home
    df["away_rest_days"] = rest_away
    return df


def process_matches(csv_files: list[Path]) -> pd.DataFrame:
    """
    Load, clean, enrich, and return a consolidated match DataFrame.
    """
    frames = []
    bundesliga_teams = set(TEAM_NORMALISATION.values())

    for csv_path in csv_files:
        try:
            raw = pd.read_csv(csv_path, low_memory=False)
            STATS["rows_downloaded"] += len(raw)
            log.info(f"  ↳ Loaded {len(raw):,} rows from {csv_path.name}")
        except Exception as exc:
            log.warning(f"  ✗ Could not read {csv_path}: {exc}")
            STATS["validation_warnings"] += 1
            continue

        df = map_columns(raw, MATCH_COLUMN_ALIASES)

        # Check required columns
        required = ["home_team", "away_team", "home_goals", "away_goals", "date"]
        missing = [c for c in required if c not in df.columns]
        if missing:
            log.warning(f"  ✗ Skipping {csv_path.name}: missing {missing}")
            STATS["validation_warnings"] += 1
            continue

        # Normalise teams
        df["home_team"] = df["home_team"].apply(normalise_team)
        df["away_team"] = df["away_team"].apply(normalise_team)

        # Filter to Bundesliga teams only
        mask = df["home_team"].isin(bundesliga_teams) | df["away_team"].isin(bundesliga_teams)
        df = df[mask].copy()
        if df.empty:
            log.info(f"  ↳ No Bundesliga rows in {csv_path.name}")
            continue

        # Parse dates
        df["date"] = pd.to_datetime(df["date"], errors="coerce", dayfirst=False)
        before = len(df)
        df = df.dropna(subset=["date"])
        removed = before - len(df)
        if removed:
            STATS["rows_removed"] += removed
            log.warning(f"  ⚠ Removed {removed} rows with invalid dates")

        # Numeric conversion
        for col in ["home_goals", "away_goals"]:
            df[col] = pd.to_numeric(df[col], errors="coerce")

        df = df.dropna(subset=["home_goals", "away_goals"])
        df["home_goals"] = df["home_goals"].astype(int)
        df["away_goals"] = df["away_goals"].astype(int)

        # Sanity checks
        bad_goals = (df["home_goals"] < 0) | (df["away_goals"] < 0) | \
                    (df["home_goals"] > 20) | (df["away_goals"] > 20)
        if bad_goals.any():
            STATS["validation_warnings"] += bad_goals.sum()
            log.warning(f"  ⚠ {bad_goals.sum()} rows with impossible goal counts")
            df = df[~bad_goals]

        # Derive result + season
        df["result"] = df.apply(
            lambda r: "H" if r["home_goals"] > r["away_goals"]
            else ("A" if r["away_goals"] > r["home_goals"] else "D"), axis=1
        )
        if "season" not in df.columns:
            df["season"] = df["date"].apply(infer_season)

        # XG columns (optional)
        for col in ["home_xg", "away_xg"]:
            if col in df.columns:
                df[col] = pd.to_numeric(df[col], errors="coerce")
            else:
                df[col] = np.nan

        # Shots / corners / cards (optional)
        for col in ["home_shots", "away_shots", "home_shots_on_target", "away_shots_on_target",
                    "home_corners", "away_corners", "home_fouls", "away_fouls",
                    "home_yellow", "away_yellow", "home_red", "away_red"]:
            if col in df.columns:
                df[col] = pd.to_numeric(df[col], errors="coerce")
            else:
                df[col] = np.nan

        df["data_source"] = csv_path.name
        frames.append(df)

    if not frames:
        raise RuntimeError("No valid Bundesliga match data found across all downloaded datasets.")

    combined = pd.concat(frames, ignore_index=True)

    # Deduplicate
    before = len(combined)
    combined = combined.drop_duplicates(subset=["season", "date", "home_team", "away_team"])
    STATS["rows_removed"] += before - len(combined)

    # Limit to 2018 onward (5 seasons back is ample, earlier is noise)
    combined = combined[combined["date"] >= pd.Timestamp("2018-07-01")]

    # Sort chronologically
    combined = combined.sort_values("date").reset_index(drop=True)

    # Rolling form + H2H + rest days
    log.info("Computing rolling form features...")
    combined = compute_rolling_form(combined)
    log.info("Computing H2H features...")
    combined = compute_h2h(combined)
    log.info("Computing rest days...")
    combined = compute_rest_days(combined)

    STATS["rows_retained"] += len(combined)
    STATS["matches_processed"] = len(combined)

    return combined


def build_match_id(row: pd.Series) -> str:
    slug = f"{row['season']}_{row['home_team']}_{row['away_team']}_{str(row['date'].date())}"
    return hashlib.md5(slug.encode()).hexdigest()[:16]


# ═══════════════════════════════════════════════════════════════════════════════
# PLAYER DATA PROCESSING
# ═══════════════════════════════════════════════════════════════════════════════

def discover_player_csv(directory: Path) -> list[Path]:
    keywords = {"player", "squad", "stat", "shooting", "passing", "defense", "possession", "keeper"}
    candidates = []
    for f in directory.rglob("*.csv"):
        if any(k in f.name.lower() for k in keywords):
            candidates.append(f)
    return candidates


def safe_per90(value: Any, minutes: float) -> float:
    """Compute per-90 metric safely. Returns NaN for zero/missing minutes."""
    try:
        v = float(value)
        m = float(minutes)
        if m <= 0 or math.isnan(v) or math.isnan(m):
            return np.nan
        return round(v / m * 90, 4)
    except (TypeError, ValueError):
        return np.nan


def build_player_id(name: str, team: str, season: str) -> str:
    slug = f"{name.lower().strip()}_{team.lower().strip()}_{season}"
    return hashlib.md5(slug.encode()).hexdigest()[:16]


def process_players(csv_files: list[Path]) -> pd.DataFrame:
    """Load, clean, compute per-90 metrics, and return a player DataFrame."""
    frames = []

    for csv_path in csv_files:
        try:
            raw = pd.read_csv(csv_path, low_memory=False)
        except Exception as exc:
            log.warning(f"  ✗ Could not read {csv_path}: {exc}")
            continue

        df = map_columns(raw, PLAYER_COLUMN_ALIASES)

        if "player_name" not in df.columns or "team" not in df.columns:
            continue

        # Normalise teams
        df["team"] = df["team"].apply(normalise_team)

        bundesliga_teams = set(TEAM_NORMALISATION.values())
        df = df[df["team"].isin(bundesliga_teams)].copy()
        if df.empty:
            continue

        # Numeric conversions
        for col in ["minutes", "goals", "assists", "shots", "shots_on_target",
                    "xg", "xa", "npxg", "key_passes", "progressive_passes",
                    "progressive_carries", "tackles", "interceptions", "blocks",
                    "clearances", "pressures", "pressure_success", "dribbles_completed",
                    "matches_played", "age"]:
            if col in df.columns:
                df[col] = pd.to_numeric(df[col], errors="coerce")

        # Require valid minutes
        if "minutes" not in df.columns:
            df["minutes"] = np.nan
        df = df[df["minutes"].notna() & (df["minutes"] > 0)].copy()

        # Derive season if not present
        if "season" not in df.columns:
            df["season"] = "2023-24"

        # Position normalisation
        if "position" in df.columns:
            pos_map = {"GK": "GK", "DF": "DEF", "MF": "MID", "FW": "FWD",
                       "G": "GK", "D": "DEF", "M": "MID", "F": "FWD",
                       "AM": "MID", "DM": "MID", "CM": "MID",
                       "CB": "DEF", "LB": "DEF", "RB": "DEF",
                       "LW": "FWD", "RW": "FWD", "ST": "FWD", "CF": "FWD"}
            df["position"] = df["position"].astype(str).str.upper().str.strip()
            df["position"] = df["position"].apply(
                lambda p: next((v for k, v in pos_map.items() if p.startswith(k)), p[:3])
            )
        else:
            df["position"] = "UNK"

        # Compute per-90 metrics
        mins = df["minutes"]
        for metric, col in [
            ("goals", "goals_90"), ("assists", "assists_90"),
            ("shots", "shots_90"), ("shots_on_target", "shots_on_target_90"),
            ("xg", "xg_90"), ("xa", "xa_90"), ("npxg", "npxg_90"),
            ("key_passes", "key_passes_90"), ("progressive_passes", "progressive_passes_90"),
            ("progressive_carries", "progressive_carries_90"),
            ("tackles", "tackles_90"), ("interceptions", "interceptions_90"),
            ("blocks", "blocks_90"), ("clearances", "clearances_90"),
            ("pressures", "pressures_90"), ("dribbles_completed", "dribbles_completed_90"),
        ]:
            if metric in df.columns:
                df[col] = df.apply(lambda r: safe_per90(r.get(metric), r["minutes"]), axis=1)
            else:
                df[col] = np.nan

        # Pass completion %
        if "pass_completion" in df.columns:
            df["pass_completion_pct"] = pd.to_numeric(df["pass_completion"], errors="coerce")
        else:
            df["pass_completion_pct"] = np.nan

        # Pressure success %
        if "pressure_success" in df.columns and "pressures" in df.columns:
            df["pressure_success_pct"] = (
                pd.to_numeric(df["pressure_success"], errors="coerce") /
                pd.to_numeric(df["pressures"], errors="coerce") * 100
            ).round(2)
        else:
            df["pressure_success_pct"] = np.nan

        # Build stable player_id
        df["player_id"] = df.apply(
            lambda r: build_player_id(str(r["player_name"]), str(r["team"]), str(r["season"])),
            axis=1,
        )

        frames.append(df)

    if not frames:
        return pd.DataFrame()

    players = pd.concat(frames, ignore_index=True)
    # Deduplicate: keep row with most minutes per player/season/team
    players = (
        players.sort_values("minutes", ascending=False)
        .drop_duplicates(subset=["player_id", "season", "team"])
        .reset_index(drop=True)
    )
    STATS["players_processed"] = len(players)
    return players


# ═══════════════════════════════════════════════════════════════════════════════
# SUPABASE UPSERT
# ═══════════════════════════════════════════════════════════════════════════════

def get_supabase_client():
    from supabase import create_client  # type: ignore

    url = os.getenv("SUPABASE_URL")
    key = os.getenv("SUPABASE_KEY")
    if not url or not key:
        raise RuntimeError("SUPABASE_URL and SUPABASE_KEY must be set in .env")
    return create_client(url, key)


def upsert_teams(supabase, match_df: pd.DataFrame) -> None:
    """Upsert team reference data."""
    teams = set(match_df["home_team"].tolist() + match_df["away_team"].tolist())
    rows = [{"team_id": t, "team_name": t} for t in sorted(teams) if t]
    if rows:
        supabase.table("teams").upsert(rows, on_conflict="team_id").execute()
        log.info(f"  → Upserted {len(rows)} teams")


def upsert_matches(supabase, match_df: pd.DataFrame) -> None:
    """Upsert match history in chunks."""
    match_df["match_id"] = match_df.apply(build_match_id, axis=1)

    def _safe_float(v) -> Optional[float]:
        try:
            f = float(v)
            return None if math.isnan(f) else round(f, 4)
        except (TypeError, ValueError):
            return None

    def _safe_int(v) -> Optional[int]:
        try:
            f = float(v)
            return None if math.isnan(f) else int(f)
        except (TypeError, ValueError):
            return None

    rows = []
    for _, r in match_df.iterrows():
        rows.append({
            "match_id": r["match_id"],
            "season": str(r["season"]),
            "match_date": str(r["date"].date()),
            "home_team": r["home_team"],
            "away_team": r["away_team"],
            "home_goals": int(r["home_goals"]),
            "away_goals": int(r["away_goals"]),
            "result": r["result"],
            "home_xg": _safe_float(r.get("home_xg")),
            "away_xg": _safe_float(r.get("away_xg")),
            "home_shots": _safe_float(r.get("home_shots")),
            "away_shots": _safe_float(r.get("away_shots")),
            "home_shots_on_target": _safe_float(r.get("home_shots_on_target")),
            "away_shots_on_target": _safe_float(r.get("away_shots_on_target")),
            "home_corners": _safe_float(r.get("home_corners")),
            "away_corners": _safe_float(r.get("away_corners")),
            "home_fouls": _safe_float(r.get("home_fouls")),
            "away_fouls": _safe_float(r.get("away_fouls")),
            "home_yellow_cards": _safe_int(r.get("home_yellow")),
            "away_yellow_cards": _safe_int(r.get("away_yellow")),
            "home_red_cards": _safe_int(r.get("home_red")),
            "away_red_cards": _safe_int(r.get("away_red")),
            "home_form_gf_last5": _safe_float(r.get("home_form_gf_last5")),
            "home_form_ga_last5": _safe_float(r.get("home_form_ga_last5")),
            "home_form_pts_last5": _safe_float(r.get("home_form_pts_last5")),
            "home_form_xg_last5": _safe_float(r.get("home_form_xg_last5")),
            "home_form_xga_last5": _safe_float(r.get("home_form_xga_last5")),
            "away_form_gf_last5": _safe_float(r.get("away_form_gf_last5")),
            "away_form_ga_last5": _safe_float(r.get("away_form_ga_last5")),
            "away_form_pts_last5": _safe_float(r.get("away_form_pts_last5")),
            "away_form_xg_last5": _safe_float(r.get("away_form_xg_last5")),
            "away_form_xga_last5": _safe_float(r.get("away_form_xga_last5")),
            "h2h_home_wins": _safe_int(r.get("h2h_home_wins")),
            "h2h_draws": _safe_int(r.get("h2h_draws")),
            "h2h_away_wins": _safe_int(r.get("h2h_away_wins")),
            "h2h_home_goals": _safe_float(r.get("h2h_home_goals")),
            "h2h_away_goals": _safe_float(r.get("h2h_away_goals")),
            "home_rest_days": _safe_int(r.get("home_rest_days")),
            "away_rest_days": _safe_int(r.get("away_rest_days")),
            "data_source": str(r.get("data_source", "kaggle")),
        })

    CHUNK = 200
    inserted = 0
    for i in range(0, len(rows), CHUNK):
        chunk = rows[i : i + CHUNK]
        try:
            supabase.table("match_history").upsert(
                chunk, on_conflict="season,match_date,home_team,away_team"
            ).execute()
            inserted += len(chunk)
        except Exception as exc:
            log.error(f"  ✗ Match upsert chunk {i//CHUNK} failed: {exc}")
            STATS["validation_errors"] += 1

    STATS["supabase_inserted"] += inserted
    log.info(f"  → Upserted {inserted} match records")


def upsert_players(supabase, player_df: pd.DataFrame) -> None:
    """Upsert player per-90 metrics in chunks."""
    if player_df.empty:
        log.warning("No player data to upsert")
        return

    def _safe(v) -> Optional[float]:
        try:
            f = float(v)
            return None if math.isnan(f) else round(f, 4)
        except (TypeError, ValueError):
            return None

    rows = []
    for _, r in player_df.iterrows():
        rows.append({
            "player_id": r["player_id"],
            "player_name": str(r["player_name"]),
            "team": str(r["team"]),
            "season": str(r["season"]),
            "position": str(r.get("position", "UNK")),
            "age": int(r["age"]) if pd.notna(r.get("age")) else None,
            "matches_played": int(r["matches_played"]) if pd.notna(r.get("matches_played")) else None,
            "minutes": _safe(r.get("minutes")),
            "goals_90": _safe(r.get("goals_90")),
            "assists_90": _safe(r.get("assists_90")),
            "shots_90": _safe(r.get("shots_90")),
            "shots_on_target_90": _safe(r.get("shots_on_target_90")),
            "xg_90": _safe(r.get("xg_90")),
            "xa_90": _safe(r.get("xa_90")),
            "npxg_90": _safe(r.get("npxg_90")),
            "key_passes_90": _safe(r.get("key_passes_90")),
            "progressive_passes_90": _safe(r.get("progressive_passes_90")),
            "progressive_carries_90": _safe(r.get("progressive_carries_90")),
            "tackles_90": _safe(r.get("tackles_90")),
            "interceptions_90": _safe(r.get("interceptions_90")),
            "blocks_90": _safe(r.get("blocks_90")),
            "clearances_90": _safe(r.get("clearances_90")),
            "pressures_90": _safe(r.get("pressures_90")),
            "pressure_success_pct": _safe(r.get("pressure_success_pct")),
            "dribbles_completed_90": _safe(r.get("dribbles_completed_90")),
            "pass_completion_pct": _safe(r.get("pass_completion_pct")),
            "data_complete": True,
        })

    CHUNK = 200
    inserted = 0
    for i in range(0, len(rows), CHUNK):
        chunk = rows[i : i + CHUNK]
        try:
            supabase.table("player_metrics_per_90").upsert(
                chunk, on_conflict="player_id,season,team"
            ).execute()
            inserted += len(chunk)
        except Exception as exc:
            log.error(f"  ✗ Player upsert chunk {i//CHUNK} failed: {exc}")
            STATS["validation_errors"] += 1

    STATS["supabase_inserted"] += inserted
    log.info(f"  → Upserted {inserted} player records")


# ═══════════════════════════════════════════════════════════════════════════════
# VALIDATION SUMMARY
# ═══════════════════════════════════════════════════════════════════════════════

def print_summary() -> None:
    log.info("=" * 60)
    log.info("KICKWISE DATA PIPELINE — SUMMARY")
    log.info("=" * 60)
    for k, v in STATS.items():
        log.info(f"  {k:<30} {v:>10,}")
    log.info("=" * 60)


# ═══════════════════════════════════════════════════════════════════════════════
# MAIN
# ═══════════════════════════════════════════════════════════════════════════════

def main() -> int:
    log.info("╔══════════════════════════════════════════╗")
    log.info("║  KICKWISE Data Ingestion Pipeline         ║")
    log.info("╚══════════════════════════════════════════╝")

    # Step 1: Kaggle auth
    try:
        setup_kaggle()
    except RuntimeError as exc:
        log.error(f"Kaggle setup failed: {exc}")
        return 1

    # Step 2: Download datasets
    log.info("Fetching Bundesliga data from Kaggle...")
    dataset_dirs = search_and_download_bundesliga_data()
    if not dataset_dirs:
        log.error("No Kaggle datasets could be downloaded. Aborting.")
        return 1
    log.info(f"Collected {len(dataset_dirs)} dataset source(s)")

    # Step 3: Discover CSVs
    match_csvs: list[Path] = []
    player_csvs: list[Path] = []
    for d in dataset_dirs:
        match_csvs.extend(discover_match_csv(d))
        player_csvs.extend(discover_player_csv(d))

    log.info(f"Match CSVs found: {len(match_csvs)}")
    log.info(f"Player CSVs found: {len(player_csvs)}")

    # Step 4: Process matches
    log.info("Processing match data...")
    try:
        match_df = process_matches(match_csvs)
    except RuntimeError as exc:
        log.error(f"Match processing failed: {exc}")
        return 1

    match_df.to_parquet(DATA_PROCESSED / "match_history.parquet", index=False)
    log.info(f"Match data saved: {len(match_df):,} rows")

    # Step 5: Process players
    log.info("Processing player data...")
    player_df = process_players(player_csvs)
    if not player_df.empty:
        player_df.to_parquet(DATA_PROCESSED / "player_metrics.parquet", index=False)
        log.info(f"Player data saved: {len(player_df):,} rows")
    else:
        log.warning("No player data processed — player table will not be updated")

    # Step 6: Supabase upsert
    log.info("Connecting to Supabase...")
    try:
        supabase = get_supabase_client()
    except RuntimeError as exc:
        log.error(f"Supabase connection failed: {exc}")
        return 1

    log.info("Upserting teams...")
    upsert_teams(supabase, match_df)

    log.info("Upserting matches...")
    upsert_matches(supabase, match_df)

    if not player_df.empty:
        log.info("Upserting players...")
        upsert_players(supabase, player_df)

    print_summary()

    if STATS["validation_errors"] > 0:
        log.error(f"Pipeline completed with {STATS['validation_errors']} errors.")
        return 1

    log.info("✓ Pipeline completed successfully.")
    return 0


if __name__ == "__main__":
    sys.exit(main())
