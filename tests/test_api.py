"""
KICKWISE — FastAPI Test Suite
Tests health, team rosters, and simulation endpoints using TestClient.
"""

import pytest
from fastapi.testclient import TestClient
from api.main import app

client = TestClient(app)


def test_health_endpoint():
    """Verify /health responds with 200 OK."""
    response = client.get("/health")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] in ["ok", "healthy"]


def test_teams_endpoint():
    """Verify /teams returns a list of Bundesliga teams."""
    response = client.get("/teams")
    assert response.status_code == 200
    data = response.json()
    assert "teams" in data
    assert len(data["teams"]) > 0


def test_players_endpoint():
    """Verify /players/{team} returns roster for team."""
    response = client.get("/players/Bayern%20M%C3%BCnchen")
    assert response.status_code == 200
    data = response.json()
    assert "players" in data
    assert len(data["players"]) > 0


def test_simulate_validation_error_same_team():
    """Verify /simulate rejects identical home and away teams."""
    payload = {
        "home_team": "Bayern München",
        "away_team": "Bayern München",
        "home_lineup": [],
        "away_lineup": [],
    }
    response = client.post("/simulate", json=payload)
    assert response.status_code == 422
