"""
KICKWISE — FastAPI Prediction Service
Provides the /simulate endpoint and supporting routes.

Run with:
    uvicorn api.main:app --host 0.0.0.0 --port 8000 --reload
"""

from __future__ import annotations

import datetime
import logging
import os
import sys
import time
import uuid
from pathlib import Path
from typing import Optional

from dotenv import load_dotenv
from fastapi import FastAPI, HTTPException, Request, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from pydantic import BaseModel, Field, field_validator

ROOT = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(ROOT))
load_dotenv(ROOT / ".env")

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s | %(levelname)-8s | %(name)s | %(message)s",
)
log = logging.getLogger("kickwise.api")

app = FastAPI(
    title="KICKWISE Prediction API",
    description="Bundesliga ML match prediction and tactical What-If simulator",
    version="1.0.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Restrict in production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ─── Minimum players required for a valid simulation ──────────────────────────
MIN_LINEUP_SIZE = 7
MAX_LINEUP_SIZE = 11


# ═══════════════════════════════════════════════════════════════════════════════
# SCHEMAS
# ═══════════════════════════════════════════════════════════════════════════════

class PlayerInput(BaseModel):
    player_id: str = Field(..., description="Stable player identifier")
    player_name: str
    team: str
    position: str = Field(default="MID", description="GK, DEF, MID, FWD")
    xg_90: float = Field(default=0.0, ge=0.0)
    xa_90: float = Field(default=0.0, ge=0.0)
    goals_90: float = Field(default=0.0, ge=0.0)
    assists_90: float = Field(default=0.0, ge=0.0)
    shots_90: float = Field(default=0.0, ge=0.0)
    shots_on_target_90: float = Field(default=0.0, ge=0.0)
    key_passes_90: float = Field(default=0.0, ge=0.0)
    progressive_passes_90: float = Field(default=0.0, ge=0.0)
    progressive_carries_90: float = Field(default=0.0, ge=0.0)
    tackles_90: float = Field(default=0.0, ge=0.0)
    interceptions_90: float = Field(default=0.0, ge=0.0)
    blocks_90: float = Field(default=0.0, ge=0.0)
    clearances_90: float = Field(default=0.0, ge=0.0)
    pressures_90: float = Field(default=0.0, ge=0.0)
    dribbles_completed_90: float = Field(default=0.0, ge=0.0)
    minutes: float = Field(default=90.0, ge=0.0)

    @field_validator("position")
    @classmethod
    def validate_position(cls, v: str) -> str:
        allowed = {"GK", "DEF", "MID", "FWD"}
        up = v.upper().strip()
        if up not in allowed:
            return "MID"  # graceful fallback
        return up


class SimulationRequest(BaseModel):
    home_team: str = Field(..., min_length=2)
    away_team: str = Field(..., min_length=2)
    home_lineup: list[PlayerInput] = Field(..., min_length=MIN_LINEUP_SIZE, max_length=MAX_LINEUP_SIZE)
    away_lineup: list[PlayerInput] = Field(..., min_length=MIN_LINEUP_SIZE, max_length=MAX_LINEUP_SIZE)
    season: str = Field(default="2023-24")

    @field_validator("home_team", "away_team")
    @classmethod
    def no_same_team(cls, v: str) -> str:
        return v.strip()


class PlayerResponse(BaseModel):
    player_id: str
    player_name: str
    team: str
    position: str
    xg_90: Optional[float]
    xa_90: Optional[float]
    goals_90: Optional[float]
    assists_90: Optional[float]
    shots_90: Optional[float]
    tackles_90: Optional[float]
    interceptions_90: Optional[float]
    pressures_90: Optional[float]
    minutes: Optional[float]


# ═══════════════════════════════════════════════════════════════════════════════
# MIDDLEWARE — request logging
# ═══════════════════════════════════════════════════════════════════════════════

@app.middleware("http")
async def log_requests(request: Request, call_next):
    req_id = str(uuid.uuid4())[:8]
    t0 = time.time()
    log.info(f"[{req_id}] {request.method} {request.url.path}")
    response = await call_next(request)
    duration = int((time.time() - t0) * 1000)
    log.info(f"[{req_id}] {response.status_code} — {duration}ms")
    return response


# ═══════════════════════════════════════════════════════════════════════════════
# ROUTES
# ═══════════════════════════════════════════════════════════════════════════════

@app.get("/")
async def root():
    return {
        "name": "KICKWISE Prediction & Tactical Simulation API",
        "status": "online",
        "version": "1.0.0",
        "docs": "/docs",
        "endpoints": {
            "health": "/health",
            "teams": "/teams",
            "players": "/players/{team}",
            "simulate": "POST /simulate",
            "swagger_ui": "/docs",
            "openapi": "/openapi.json",
        },
    }


@app.get("/health")
async def health():
    return {
        "status": "ok",
        "service": "kickwise-api",
        "timestamp": datetime.datetime.now(datetime.timezone.utc).isoformat(),
    }



@app.get("/teams")
async def list_teams():
    """Return all Bundesliga teams available in the system."""
    try:
        from ml.data_loader import load_teams
        teams = load_teams()
        return {"teams": teams, "count": len(teams)}
    except Exception as exc:
        log.error(f"Failed to load teams: {exc}")
        raise HTTPException(status_code=500, detail="Could not load teams")


@app.get("/players/{team}")
async def list_players(team: str, season: Optional[str] = None):
    """Return all players for a specific team."""
    try:
        from ml.data_loader import load_players_for_team
        df = load_players_for_team(team, season=season)
        if df.empty:
            raise HTTPException(
                status_code=404,
                detail=f"No players found for team '{team}'. Check team name or run seed_reference_data.py"
            )

        players = []
        for _, row in df.iterrows():
            players.append({
                "player_id": row.get("player_id", ""),
                "player_name": row.get("player_name", ""),
                "team": row.get("team", team),
                "position": row.get("position", "UNK"),
                "xg_90": _safe_float(row.get("xg_90")),
                "xa_90": _safe_float(row.get("xa_90")),
                "goals_90": _safe_float(row.get("goals_90")),
                "assists_90": _safe_float(row.get("assists_90")),
                "shots_90": _safe_float(row.get("shots_90")),
                "shots_on_target_90": _safe_float(row.get("shots_on_target_90")),
                "key_passes_90": _safe_float(row.get("key_passes_90")),
                "progressive_passes_90": _safe_float(row.get("progressive_passes_90")),
                "progressive_carries_90": _safe_float(row.get("progressive_carries_90")),
                "tackles_90": _safe_float(row.get("tackles_90")),
                "interceptions_90": _safe_float(row.get("interceptions_90")),
                "blocks_90": _safe_float(row.get("blocks_90")),
                "clearances_90": _safe_float(row.get("clearances_90")),
                "pressures_90": _safe_float(row.get("pressures_90")),
                "dribbles_completed_90": _safe_float(row.get("dribbles_completed_90")),
                "minutes": _safe_float(row.get("minutes")),
            })

        return {"team": team, "players": players, "count": len(players)}
    except HTTPException:
        raise
    except Exception as exc:
        log.error(f"Failed to load players for {team}: {exc}")
        raise HTTPException(status_code=500, detail="Could not load player data")


@app.post("/simulate")
async def simulate(request: SimulationRequest):
    """
    Run a tactical What-If simulation for a Bundesliga match.
    Returns win probabilities, expected goals, scoreline, radar, SHAP, and tactical summary.
    """
    req_id = str(uuid.uuid4())[:8]
    t0 = time.time()

    # Guard against same-team simulation
    if request.home_team.strip().lower() == request.away_team.strip().lower():
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="Home and away teams cannot be the same"
        )

    log.info(
        f"[{req_id}] Simulation: {request.home_team} vs {request.away_team} "
        f"| Home XI: {len(request.home_lineup)} | Away XI: {len(request.away_lineup)}"
    )

    try:
        from ml.predict import run_simulation

        home_players = [p.model_dump() for p in request.home_lineup]
        away_players = [p.model_dump() for p in request.away_lineup]

        result = run_simulation(
            home_team=request.home_team,
            away_team=request.away_team,
            home_lineup=home_players,
            away_lineup=away_players,
            season=request.season,
        )

        duration_ms = int((time.time() - t0) * 1000)
        log.info(
            f"[{req_id}] Simulation completed | "
            f"Score: {result['predicted_score']} | "
            f"Home win: {result['home_win_probability']:.2%} | "
            f"{duration_ms}ms"
        )

        # Async log to Supabase (fire-and-forget, non-blocking)
        _log_simulation_async(req_id, request, result, duration_ms)

        return result

    except FileNotFoundError as exc:
        log.warning(f"[{req_id}] Model not trained: {exc}")
        raise HTTPException(
            status_code=503,
            detail=(
                "Prediction model not found. "
                "Run `python ml/train_model.py` to train the model first."
            ),
        )
    except ValueError as exc:
        log.warning(f"[{req_id}] Validation error: {exc}")
        raise HTTPException(status_code=422, detail=str(exc))
    except Exception as exc:
        log.exception(f"[{req_id}] Simulation failed unexpectedly")
        raise HTTPException(
            status_code=500,
            detail="SIMULATION INTERRUPTED: The prediction engine could not complete this run. "
                   "Check the lineup configuration and try again.",
        )


def _log_simulation_async(req_id: str, request: SimulationRequest, result: dict, duration_ms: int) -> None:
    """
    Best-effort simulation audit log to Supabase.
    Failures here must never propagate to the API response.
    """
    try:
        supabase_url = os.getenv("SUPABASE_URL")
        supabase_key = os.getenv("SUPABASE_KEY")
        if not supabase_url or not supabase_key:
            return

        from supabase import create_client  # type: ignore
        supabase = create_client(supabase_url, supabase_key)
        supabase.table("simulation_log").insert({
            "request_id": req_id,
            "home_team": request.home_team,
            "away_team": request.away_team,
            "home_lineup": [p.model_dump() for p in request.home_lineup],
            "away_lineup": [p.model_dump() for p in request.away_lineup],
            "home_win_prob": result["home_win_probability"],
            "draw_prob": result["draw_probability"],
            "away_win_prob": result["away_win_probability"],
            "expected_home_goals": result["expected_home_goals"],
            "expected_away_goals": result["expected_away_goals"],
            "predicted_score": result["predicted_score"],
            "model_version": result["model_version"],
            "duration_ms": duration_ms,
        }).execute()
    except Exception:
        pass  # Non-critical


def _safe_float(v) -> Optional[float]:
    import math
    try:
        f = float(v)
        return None if math.isnan(f) else round(f, 4)
    except (TypeError, ValueError):
        return None
