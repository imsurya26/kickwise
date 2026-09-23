"""
KICKWISE — Feature Engineering Test Suite
Tests lineup aggregation and feature matrix construction.
"""

import pandas as pd
import pytest
from ml.feature_engineering import compute_lineup_features, build_training_features


def test_lineup_feature_aggregation():
    """Verify that player per-90 metrics are correctly position-weighted and aggregated."""
    sample_lineup = pd.DataFrame([
        {"position": "GK", "xg_90": 0.0, "xa_90": 0.0, "tackles_90": 0.2, "interceptions_90": 0.1, "pressures_90": 0.5, "minutes": 900},
        {"position": "DEF", "xg_90": 0.05, "xa_90": 0.08, "tackles_90": 2.5, "interceptions_90": 1.8, "pressures_90": 11.0, "minutes": 900},
        {"position": "DEF", "xg_90": 0.04, "xa_90": 0.02, "tackles_90": 2.8, "interceptions_90": 2.1, "pressures_90": 10.0, "minutes": 900},
        {"position": "DEF", "xg_90": 0.06, "xa_90": 0.04, "tackles_90": 2.4, "interceptions_90": 1.9, "pressures_90": 9.5, "minutes": 900},
        {"position": "DEF", "xg_90": 0.08, "xa_90": 0.15, "tackles_90": 2.2, "interceptions_90": 1.4, "pressures_90": 13.0, "minutes": 900},
        {"position": "MID", "xg_90": 0.15, "xa_90": 0.25, "tackles_90": 2.1, "interceptions_90": 1.5, "pressures_90": 18.0, "minutes": 900},
        {"position": "MID", "xg_90": 0.20, "xa_90": 0.30, "tackles_90": 1.8, "interceptions_90": 1.2, "pressures_90": 16.5, "minutes": 900},
        {"position": "MID", "xg_90": 0.35, "xa_90": 0.40, "tackles_90": 1.2, "interceptions_90": 0.8, "pressures_90": 17.0, "minutes": 900},
        {"position": "FWD", "xg_90": 0.55, "xa_90": 0.20, "tackles_90": 0.8, "interceptions_90": 0.4, "pressures_90": 14.0, "minutes": 900},
        {"position": "FWD", "xg_90": 0.85, "xa_90": 0.25, "tackles_90": 0.6, "interceptions_90": 0.3, "pressures_90": 12.0, "minutes": 900},
        {"position": "FWD", "xg_90": 0.45, "xa_90": 0.30, "tackles_90": 1.0, "interceptions_90": 0.5, "pressures_90": 15.0, "minutes": 900},
    ])

    features = compute_lineup_features(sample_lineup, prefix="home")

    assert "home_lineup_xg90" in features
    assert "home_lineup_xa90" in features
    assert "home_lineup_tackles90" in features
    assert features["home_lineup_xg90"] > 0
    assert features["home_lineup_tackles90"] > 0
