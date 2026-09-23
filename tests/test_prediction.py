"""
KICKWISE — Prediction Engine Test Suite
Tests model artifact loading, prediction outputs, and SHAP explainability contract.
"""

import pytest
from ml.predict import run_simulation


def test_predict_simulation_outcome_contract():
    """Verify that run_simulation returns the complete structured payload."""
    sample_home_lineup = [
        {"position": "GK", "xg_90": 0.0, "xa_90": 0.01, "tackles_90": 0.2, "interceptions_90": 0.1, "pressures_90": 0.4, "minutes": 900},
        {"position": "DEF", "xg_90": 0.08, "xa_90": 0.15, "tackles_90": 2.4, "interceptions_90": 1.7, "pressures_90": 11.0, "minutes": 900},
        {"position": "DEF", "xg_90": 0.05, "xa_90": 0.02, "tackles_90": 2.6, "interceptions_90": 2.0, "pressures_90": 10.0, "minutes": 900},
        {"position": "DEF", "xg_90": 0.06, "xa_90": 0.03, "tackles_90": 2.5, "interceptions_90": 1.9, "pressures_90": 9.8, "minutes": 900},
        {"position": "DEF", "xg_90": 0.09, "xa_90": 0.22, "tackles_90": 2.1, "interceptions_90": 1.5, "pressures_90": 14.0, "minutes": 900},
        {"position": "MID", "xg_90": 0.18, "xa_90": 0.28, "tackles_90": 2.3, "interceptions_90": 1.6, "pressures_90": 18.0, "minutes": 900},
        {"position": "MID", "xg_90": 0.22, "xa_90": 0.32, "tackles_90": 2.0, "interceptions_90": 1.3, "pressures_90": 17.0, "minutes": 900},
        {"position": "MID", "xg_90": 0.42, "xa_90": 0.45, "tackles_90": 1.4, "interceptions_90": 0.8, "pressures_90": 16.5, "minutes": 900},
        {"position": "FWD", "xg_90": 0.45, "xa_90": 0.25, "tackles_90": 1.1, "interceptions_90": 0.6, "pressures_90": 14.2, "minutes": 900},
        {"position": "FWD", "xg_90": 0.92, "xa_90": 0.28, "tackles_90": 0.7, "interceptions_90": 0.4, "pressures_90": 11.5, "minutes": 900},
        {"position": "FWD", "xg_90": 0.40, "xa_90": 0.35, "tackles_90": 1.2, "interceptions_90": 0.7, "pressures_90": 15.0, "minutes": 900},
    ]

    sample_away_lineup = [
        {"position": "GK", "xg_90": 0.0, "xa_90": 0.01, "tackles_90": 0.3, "interceptions_90": 0.2, "pressures_90": 0.4, "minutes": 900},
        {"position": "DEF", "xg_90": 0.06, "xa_90": 0.10, "tackles_90": 2.8, "interceptions_90": 1.9, "pressures_90": 13.0, "minutes": 900},
        {"position": "DEF", "xg_90": 0.07, "xa_90": 0.05, "tackles_90": 2.7, "interceptions_90": 2.1, "pressures_90": 12.0, "minutes": 900},
        {"position": "DEF", "xg_90": 0.05, "xa_90": 0.04, "tackles_90": 2.5, "interceptions_90": 1.8, "pressures_90": 11.0, "minutes": 900},
        {"position": "DEF", "xg_90": 0.07, "xa_90": 0.12, "tackles_90": 2.9, "interceptions_90": 1.6, "pressures_90": 15.0, "minutes": 900},
        {"position": "MID", "xg_90": 0.12, "xa_90": 0.18, "tackles_90": 3.0, "interceptions_90": 2.0, "pressures_90": 19.0, "minutes": 900},
        {"position": "MID", "xg_90": 0.16, "xa_90": 0.26, "tackles_90": 2.2, "interceptions_90": 1.4, "pressures_90": 17.0, "minutes": 900},
        {"position": "MID", "xg_90": 0.30, "xa_90": 0.38, "tackles_90": 1.5, "interceptions_90": 0.9, "pressures_90": 16.0, "minutes": 900},
        {"position": "FWD", "xg_90": 0.38, "xa_90": 0.22, "tackles_90": 1.3, "interceptions_90": 0.7, "pressures_90": 15.5, "minutes": 900},
        {"position": "FWD", "xg_90": 0.75, "xa_90": 0.20, "tackles_90": 0.8, "interceptions_90": 0.5, "pressures_90": 12.5, "minutes": 900},
        {"position": "FWD", "xg_90": 0.35, "xa_90": 0.24, "tackles_90": 1.4, "interceptions_90": 0.8, "pressures_90": 16.0, "minutes": 900},
    ]

    res = run_simulation(
        home_team="Bayern München",
        away_team="Borussia Dortmund",
        home_lineup=sample_home_lineup,
        away_lineup=sample_away_lineup,
    )

    assert "home_win_probability" in res
    assert "draw_probability" in res
    assert "away_win_probability" in res
    assert "expected_home_goals" in res
    assert "expected_away_goals" in res
    assert "scoreline_probabilities" in res
    assert "radar" in res
    assert "shap_features" in res
    assert "tactical_summary" in res
    assert isinstance(res["tactical_summary"], str)
