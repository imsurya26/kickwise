"""
KICKWISE — Poisson Model Test Suite
Tests expected goal estimation, probability distribution validity, and scoreline ranking.
"""

import numpy as np
import pytest
from ml.poisson_model import PoissonGoalModel


def test_scoreline_matrix_shape_and_sum():
    """Verify that scoreline matrix sums to ~1.0 and has non-negative probabilities."""
    model = PoissonGoalModel.load()
    matrix = model.scoreline_matrix(lambda_home=1.8, lambda_away=1.1, max_goals=5)

    assert matrix.shape == (6, 6)
    assert (matrix.values >= 0.0).all()
    assert (matrix.values <= 1.0).all()
    # The sum of 0-5 goals should represent > 90% of the total distribution
    assert matrix.values.sum() > 0.90


def test_poisson_outcome_probabilities():
    """Verify that outcome probabilities satisfy P(H) + P(D) + P(A) = 1."""
    model = PoissonGoalModel.load()
    p_home, p_draw, p_away = model.outcome_probs_from_matrix(
        lambda_home=2.2, lambda_away=0.8, max_goals=6
    )

    assert 0.0 <= p_home <= 1.0
    assert 0.0 <= p_draw <= 1.0
    assert 0.0 <= p_away <= 1.0
    assert np.isclose(p_home + p_draw + p_away, 1.0, atol=1e-3)
    assert p_home > p_away


def test_poisson_model_predictions():
    """Verify that PoissonGoalModel generates goal rates and scoreline forecasts."""
    model = PoissonGoalModel.load()
    lam_home, lam_away = model.predict_goals("Bayern München", "FC Augsburg")

    assert lam_home > 0
    assert lam_away > 0
    top_scores = model.top_scorelines(lam_home, lam_away, top_n=5)
    assert len(top_scores) == 5
    assert "scoreline" in top_scores[0]
    assert "probability" in top_scores[0]
