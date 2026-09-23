import { z } from "zod";

export const PlayerSchema = z.object({
  player_id: z.string().min(1),
  player_name: z.string().min(1),
  team: z.string().min(1),
  position: z.enum(["GK", "DEF", "MID", "FWD"]).default("MID"),
  xg_90: z.number().min(0).default(0),
  xa_90: z.number().min(0).default(0),
  goals_90: z.number().min(0).default(0),
  assists_90: z.number().min(0).default(0),
  shots_90: z.number().min(0).default(0),
  shots_on_target_90: z.number().min(0).default(0),
  key_passes_90: z.number().min(0).default(0),
  progressive_passes_90: z.number().min(0).default(0),
  progressive_carries_90: z.number().min(0).default(0),
  tackles_90: z.number().min(0).default(0),
  interceptions_90: z.number().min(0).default(0),
  blocks_90: z.number().min(0).default(0),
  clearances_90: z.number().min(0).default(0),
  pressures_90: z.number().min(0).default(0),
  dribbles_completed_90: z.number().min(0).default(0),
  minutes: z.number().min(0).default(90),
});

export const SimulationRequestSchema = z.object({
  home_team: z.string().min(2, "Home team required"),
  away_team: z.string().min(2, "Away team required"),
  home_lineup: z
    .array(PlayerSchema)
    .min(7, "At least 7 home players required")
    .max(11, "Maximum 11 home players"),
  away_lineup: z
    .array(PlayerSchema)
    .min(7, "At least 7 away players required")
    .max(11, "Maximum 11 away players"),
  season: z.string().default("2023-24"),
}).refine(
  (data) => data.home_team.trim().toLowerCase() !== data.away_team.trim().toLowerCase(),
  { message: "Home and away teams cannot be the same" }
);

export type Player = z.infer<typeof PlayerSchema>;
export type SimulationRequest = z.infer<typeof SimulationRequestSchema>;

export interface ShapFeature {
  feature: string;
  human_label: string;
  shap_value: number;
  impact: number;
  direction: "positive" | "negative";
  feature_value: number;
  tactical_interpretation: string;
}

export interface ScorelineProbability {
  scoreline: string;
  home_goals: number;
  away_goals: number;
  probability: number;
}

export interface RadarData {
  home: {
    attack: number;
    creation: number;
    midfield_control: number;
    pressing: number;
    defensive_stability: number;
    transition: number;
  };
  away: {
    attack: number;
    creation: number;
    midfield_control: number;
    pressing: number;
    defensive_stability: number;
    transition: number;
  };
  labels: string[];
}

export interface SimulationResult {
  home_win_probability: number;
  draw_probability: number;
  away_win_probability: number;
  expected_home_goals: number;
  expected_away_goals: number;
  predicted_score: string;
  scoreline_probabilities: ScorelineProbability[];
  radar: RadarData;
  shap_features: ShapFeature[];
  tactical_summary: string;
  model_version: string;
  generated_at: string;
  duration_ms: number;
}

export interface InPlayState {
  isLive: boolean;
  currentHomeScore: number;
  currentAwayScore: number;
  elapsedMinutes: number; // 0 (Pre-match), 15, 30, 45 (HT), 60, 75, 85, 90
  homeRedCards?: number;
  awayRedCards?: number;
}

export type SimulationState = "idle" | "loading" | "complete" | "error";

