"""
KICKWISE — Poisson Goal Model
Fits a Poisson regression model on home/away expected goals,
then generates scoreline probability matrices.

Using statsmodels GLM with Poisson family.
"""

from __future__ import annotations

import json
import logging
import math
from pathlib import Path
from typing import Optional

import numpy as np
import pandas as pd
import statsmodels.api as sm
import statsmodels.formula.api as smf

log = logging.getLogger("kickwise.poisson")
ROOT = Path(__file__).resolve().parent.parent
ARTIFACT_DIR = ROOT / "ml" / "artifacts"


class PoissonGoalModel:
    """
    Bivariate Poisson regression model for Bundesliga goal prediction.
    Fits separate home and away goal rate models using team attack/defence
    strength parameters.
    """

    def __init__(self):
        self.model_home: Optional[sm.GLMResultsWrapper] = None
        self.model_away: Optional[sm.GLMResultsWrapper] = None
        self.teams_: list[str] = []
        self.is_fitted: bool = False

    # ─────────────────────────────────────────────────────────────────────────
    # Training
    # ─────────────────────────────────────────────────────────────────────────

    def fit(self, match_df: pd.DataFrame) -> None:
        """
        Fit Poisson regression on match-level home/away goals.
        Uses team dummies for attack/defence strength estimation.
        """
        df = match_df.copy()

        required = ["home_team", "away_team", "home_goals", "away_goals"]
        for col in required:
            if col not in df.columns:
                raise ValueError(f"Missing required column: {col}")

        df["home_goals"] = pd.to_numeric(df["home_goals"], errors="coerce")
        df["away_goals"] = pd.to_numeric(df["away_goals"], errors="coerce")
        df = df.dropna(subset=["home_goals", "away_goals"])

        all_teams = sorted(set(df["home_team"].tolist() + df["away_team"].tolist()))
        self.teams_ = all_teams

        log.info(f"Fitting Poisson model on {len(df)} matches, {len(all_teams)} teams")

        # Build long-format dataset (one row per team per match)
        home_rows = df[["home_team", "away_team", "home_goals"]].copy()
        home_rows.columns = ["attack_team", "defence_team", "goals"]
        home_rows["home"] = 1

        away_rows = df[["away_team", "home_team", "away_goals"]].copy()
        away_rows.columns = ["attack_team", "defence_team", "goals"]
        away_rows["home"] = 0

        model_df = pd.concat([home_rows, away_rows], ignore_index=True)
        model_df["goals"] = model_df["goals"].astype(float)

        # Categorical encoding
        model_df["attack_team"] = pd.Categorical(model_df["attack_team"], categories=all_teams)
        model_df["defence_team"] = pd.Categorical(model_df["defence_team"], categories=all_teams)

        formula = "goals ~ home + C(attack_team) + C(defence_team)"

        try:
            poisson_model = smf.glm(
                formula=formula,
                data=model_df,
                family=sm.families.Poisson(),
            ).fit(disp=False)

            self.model_home = poisson_model
            self.is_fitted = True
            log.info(f"Poisson model fitted. AIC: {poisson_model.aic:.2f}")
        except Exception as exc:
            log.error(f"Poisson model fitting failed: {exc}")
            raise

    # ─────────────────────────────────────────────────────────────────────────
    # Prediction
    # ─────────────────────────────────────────────────────────────────────────

    def predict_goals(
        self,
        home_team: str,
        away_team: str,
    ) -> tuple[float, float]:
        """
        Predict expected home and away goals using fitted Poisson model.
        Falls back to historical mean if team is not in training data.
        """
        if not self.is_fitted:
            raise RuntimeError("Model not fitted — call fit() first")

        ht = home_team if home_team in self.teams_ else None
        at = away_team if away_team in self.teams_ else None

        try:
            # Home expected goals
            home_pred_df = pd.DataFrame({
                "attack_team": pd.Categorical([ht or self.teams_[0]], categories=self.teams_),
                "defence_team": pd.Categorical([at or self.teams_[0]], categories=self.teams_),
                "home": [1],
            })
            lambda_home = float(self.model_home.predict(home_pred_df)[0])

            # Away expected goals
            away_pred_df = pd.DataFrame({
                "attack_team": pd.Categorical([at or self.teams_[0]], categories=self.teams_),
                "defence_team": pd.Categorical([ht or self.teams_[0]], categories=self.teams_),
                "home": [0],
            })
            lambda_away = float(self.model_home.predict(away_pred_df)[0])

            # Clamp to reasonable bounds
            lambda_home = max(0.2, min(lambda_home, 6.0))
            lambda_away = max(0.2, min(lambda_away, 6.0))

            return round(lambda_home, 3), round(lambda_away, 3)

        except Exception as exc:
            log.warning(f"Prediction failed for {home_team} vs {away_team}: {exc}. Using defaults.")
            return 1.5, 1.1

    def predict_goals_with_lineup_adjustment(
        self,
        home_team: str,
        away_team: str,
        home_xg90: float,
        away_xg90: float,
        baseline_home_xg: Optional[float] = None,
        baseline_away_xg: Optional[float] = None,
    ) -> tuple[float, float]:
        """
        Predict xG with lineup-adjusted scaling factor.
        Scales the Poisson baseline by the ratio of lineup xG to team average xG.
        """
        base_home, base_away = self.predict_goals(home_team, away_team)

        # If baseline lineup xG values provided, scale accordingly
        if baseline_home_xg and baseline_home_xg > 0:
            home_scale = home_xg90 / baseline_home_xg
            base_home *= max(0.5, min(home_scale, 2.0))

        if baseline_away_xg and baseline_away_xg > 0:
            away_scale = away_xg90 / baseline_away_xg
            base_away *= max(0.5, min(away_scale, 2.0))

        return round(base_home, 3), round(base_away, 3)

    # ─────────────────────────────────────────────────────────────────────────
    # Scoreline probabilities
    # ─────────────────────────────────────────────────────────────────────────

    @staticmethod
    def poisson_pmf(k: int, lam: float) -> float:
        """Compute P(X = k) for Poisson(lam)."""
        if lam <= 0:
            return 1.0 if k == 0 else 0.0
        return math.exp(-lam) * (lam ** k) / math.factorial(k)

    def scoreline_matrix(
        self,
        lambda_home: float,
        lambda_away: float,
        max_goals: int = 8,
    ) -> pd.DataFrame:
        """
        Compute joint scoreline probability matrix P(home=i, away=j).
        Assumes independence of home and away goals (standard Dixon-Coles simplification).
        """
        matrix = np.zeros((max_goals + 1, max_goals + 1))
        for i in range(max_goals + 1):
            for j in range(max_goals + 1):
                matrix[i, j] = self.poisson_pmf(i, lambda_home) * self.poisson_pmf(j, lambda_away)
        return pd.DataFrame(matrix)

    def top_scorelines(
        self,
        lambda_home: float,
        lambda_away: float,
        top_n: int = 10,
        max_goals: int = 8,
    ) -> list[dict]:
        """
        Return the top-N most probable scorelines as a sorted list.
        """
        matrix = self.scoreline_matrix(lambda_home, lambda_away, max_goals)
        results = []
        for i in range(max_goals + 1):
            for j in range(max_goals + 1):
                results.append({
                    "scoreline": f"{i}-{j}",
                    "home_goals": i,
                    "away_goals": j,
                    "probability": round(float(matrix.iloc[i, j]), 5),
                })
        results.sort(key=lambda x: x["probability"], reverse=True)
        return results[:top_n]

    def outcome_probs_from_matrix(
        self,
        lambda_home: float,
        lambda_away: float,
        max_goals: int = 8,
    ) -> tuple[float, float, float]:
        """
        Derive P(home win), P(draw), P(away win) from scoreline matrix.
        """
        matrix = self.scoreline_matrix(lambda_home, lambda_away, max_goals)
        hw = sum(float(matrix.iloc[i, j]) for i in range(max_goals + 1) for j in range(max_goals + 1) if i > j)
        dr = sum(float(matrix.iloc[i, i]) for i in range(max_goals + 1))
        aw = sum(float(matrix.iloc[i, j]) for i in range(max_goals + 1) for j in range(max_goals + 1) if j > i)
        total = hw + dr + aw
        return round(hw / total, 4), round(dr / total, 4), round(aw / total, 4)

    def most_likely_score(
        self,
        lambda_home: float,
        lambda_away: float,
        max_goals: int = 8,
    ) -> str:
        top = self.top_scorelines(lambda_home, lambda_away, top_n=1, max_goals=max_goals)
        return top[0]["scoreline"] if top else "1-1"

    # ─────────────────────────────────────────────────────────────────────────
    # Persistence
    # ─────────────────────────────────────────────────────────────────────────

    def save(self, path: Optional[Path] = None) -> Path:
        """Save model parameters as JSON (coefficients + teams list)."""
        if not self.is_fitted:
            raise RuntimeError("Cannot save unfitted model")

        save_path = path or (ARTIFACT_DIR / "kickwise_poisson_params.json")
        ARTIFACT_DIR.mkdir(parents=True, exist_ok=True)

        params = {
            "teams": self.teams_,
            "coefficients": {k: float(v) for k, v in self.model_home.params.items()},
            "aic": float(self.model_home.aic),
            "bic": float(self.model_home.bic),
            "model_version": "bundesliga-poisson-v1",
        }

        with open(save_path, "w") as f:
            json.dump(params, f, indent=2)

        log.info(f"Poisson model saved: {save_path}")
        return save_path

    @classmethod
    def load(cls, path: Optional[Path] = None) -> "PoissonGoalModel":
        """
        Load a PoissonGoalModel from saved JSON parameters.
        Reconstructs a lightweight prediction-only model.
        """
        load_path = path or (ARTIFACT_DIR / "kickwise_poisson_params.json")
        if not load_path.exists():
            raise FileNotFoundError(f"Poisson model not found at {load_path}")

        with open(load_path) as f:
            params = json.load(f)

        instance = cls()
        instance.teams_ = params["teams"]

        # Reconstruct a minimal prediction wrapper using the saved coefficients
        instance._coefficients = params["coefficients"]
        instance.is_fitted = True
        instance._use_coefficient_mode = True

        log.info(f"Poisson model loaded from {load_path} ({len(instance.teams_)} teams)")
        return instance

    def _predict_from_coefficients(
        self,
        attack_team: str,
        defence_team: str,
        home: int,
    ) -> float:
        """
        Manual prediction from stored coefficients when model object is not available.
        log(lambda) = intercept + home + attack_team_coef + defence_team_coef
        """
        coefs = self._coefficients
        intercept = coefs.get("Intercept", 0.0)
        home_coef = coefs.get("home", 0.0) * home

        # Attack coefficient
        attack_key = f"C(attack_team)[T.{attack_team}]"
        attack_coef = coefs.get(attack_key, 0.0)

        # Defence coefficient
        defence_key = f"C(defence_team)[T.{defence_team}]"
        defence_coef = coefs.get(defence_key, 0.0)

        log_lambda = intercept + home_coef + attack_coef + defence_coef
        return math.exp(log_lambda)

    def predict_goals(self, home_team: str, away_team: str) -> tuple[float, float]:
        """Override to support coefficient-mode prediction after load()."""
        if not self.is_fitted:
            raise RuntimeError("Model not fitted")

        if getattr(self, "_use_coefficient_mode", False):
            ht = home_team if home_team in self.teams_ else self.teams_[0]
            at = away_team if away_team in self.teams_ else self.teams_[0]
            lam_home = self._predict_from_coefficients(ht, at, home=1)
            lam_away = self._predict_from_coefficients(at, ht, home=0)
            lam_home = max(0.2, min(lam_home, 6.0))
            lam_away = max(0.2, min(lam_away, 6.0))
            return round(lam_home, 3), round(lam_away, 3)

        return super().predict_goals(home_team, away_team)
