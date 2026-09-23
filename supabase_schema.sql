-- ============================================================
-- KICKWISE — Supabase Schema
-- Production-grade Bundesliga ML Prediction Platform
-- ============================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================
-- TABLE: teams
-- Reference table for all Bundesliga teams
-- ============================================================
CREATE TABLE IF NOT EXISTS public.teams (
    team_id     TEXT PRIMARY KEY,          -- normalized slug, e.g. "Bayern München"
    team_name   TEXT NOT NULL,
    short_name  TEXT,
    country     TEXT DEFAULT 'Germany',
    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_teams_name ON public.teams (team_name);


-- ============================================================
-- TABLE: match_history
-- Historical Bundesliga match records
-- ============================================================
CREATE TABLE IF NOT EXISTS public.match_history (
    match_id          TEXT PRIMARY KEY,     -- derived: season_homeTeam_awayTeam_date
    season            TEXT NOT NULL,        -- e.g. "2022-23"
    match_date        DATE NOT NULL,
    home_team         TEXT NOT NULL,
    away_team         TEXT NOT NULL,
    home_goals        INTEGER NOT NULL CHECK (home_goals >= 0),
    away_goals        INTEGER NOT NULL CHECK (away_goals >= 0),
    result            TEXT NOT NULL CHECK (result IN ('H', 'D', 'A')),

    -- Pre-match context
    matchday          INTEGER,

    -- Home team performance metrics (pre-match rolling or available)
    home_shots        REAL,
    home_shots_on_target REAL,
    home_corners      REAL,
    home_fouls        REAL,
    home_yellow_cards INTEGER,
    home_red_cards    INTEGER,
    home_xg           REAL,

    -- Away team performance metrics
    away_shots        REAL,
    away_shots_on_target REAL,
    away_corners      REAL,
    away_fouls        REAL,
    away_yellow_cards INTEGER,
    away_red_cards    INTEGER,
    away_xg           REAL,

    -- Rolling form features (computed at ingestion time)
    home_form_gf_last5      REAL,    -- goals for, last 5 matches
    home_form_ga_last5      REAL,    -- goals against, last 5 matches
    home_form_pts_last5     REAL,    -- points, last 5 matches
    home_form_xg_last5      REAL,
    home_form_xga_last5     REAL,
    away_form_gf_last5      REAL,
    away_form_ga_last5      REAL,
    away_form_pts_last5     REAL,
    away_form_xg_last5      REAL,
    away_form_xga_last5     REAL,

    -- Head-to-head (last 5 meetings)
    h2h_home_wins    INTEGER,
    h2h_draws        INTEGER,
    h2h_away_wins    INTEGER,
    h2h_home_goals   REAL,
    h2h_away_goals   REAL,

    -- Rest days between matches
    home_rest_days   INTEGER,
    away_rest_days   INTEGER,

    -- Source metadata
    data_source       TEXT DEFAULT 'kaggle',
    raw_match_id      TEXT,

    -- Timestamps
    created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    -- Composite uniqueness: one match per team-pair per date per season
    CONSTRAINT uq_match UNIQUE (season, match_date, home_team, away_team)
);

CREATE INDEX IF NOT EXISTS idx_mh_season ON public.match_history (season);
CREATE INDEX IF NOT EXISTS idx_mh_date ON public.match_history (match_date);
CREATE INDEX IF NOT EXISTS idx_mh_home_team ON public.match_history (home_team);
CREATE INDEX IF NOT EXISTS idx_mh_away_team ON public.match_history (away_team);
CREATE INDEX IF NOT EXISTS idx_mh_result ON public.match_history (result);


-- ============================================================
-- TABLE: player_metrics_per_90
-- Player-level normalized per-90-minutes statistics
-- ============================================================
CREATE TABLE IF NOT EXISTS public.player_metrics_per_90 (
    player_id               TEXT NOT NULL,   -- stable identifier (name_team_season slug)
    player_name             TEXT NOT NULL,
    team                    TEXT NOT NULL,
    season                  TEXT NOT NULL,
    position                TEXT,            -- GK, DEF, MID, FWD
    nationality             TEXT,
    age                     INTEGER,

    -- Volume stats
    matches_played          INTEGER DEFAULT 0,
    minutes                 REAL DEFAULT 0 CHECK (minutes >= 0),

    -- Attacking per-90
    goals_90                REAL DEFAULT 0,
    assists_90              REAL DEFAULT 0,
    shots_90                REAL DEFAULT 0,
    shots_on_target_90      REAL DEFAULT 0,
    xg_90                   REAL DEFAULT 0,
    xa_90                   REAL DEFAULT 0,
    npxg_90                 REAL DEFAULT 0,   -- non-penalty xG

    -- Passing / Progression per-90
    key_passes_90           REAL DEFAULT 0,
    progressive_passes_90   REAL DEFAULT 0,
    progressive_carries_90  REAL DEFAULT 0,
    pass_completion_pct     REAL,

    -- Defensive per-90
    tackles_90              REAL DEFAULT 0,
    interceptions_90        REAL DEFAULT 0,
    blocks_90               REAL DEFAULT 0,
    clearances_90           REAL DEFAULT 0,

    -- Pressing per-90
    pressures_90            REAL DEFAULT 0,
    pressure_success_pct    REAL,

    -- Dribbling per-90
    dribbles_completed_90   REAL DEFAULT 0,

    -- GK-specific (nullable)
    gk_saves_90             REAL,
    gk_save_pct             REAL,
    gk_psxg_90              REAL,

    -- Data quality flag
    data_complete           BOOLEAN DEFAULT TRUE,

    -- Timestamps
    created_at              TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at              TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    -- Primary key: one row per player per team per season
    CONSTRAINT pk_player_metrics PRIMARY KEY (player_id, season, team)
);

CREATE INDEX IF NOT EXISTS idx_pm_player_name ON public.player_metrics_per_90 (player_name);
CREATE INDEX IF NOT EXISTS idx_pm_team ON public.player_metrics_per_90 (team);
CREATE INDEX IF NOT EXISTS idx_pm_season ON public.player_metrics_per_90 (season);
CREATE INDEX IF NOT EXISTS idx_pm_position ON public.player_metrics_per_90 (position);


-- ============================================================
-- TABLE: simulation_log
-- Audit log of all What-If simulation requests
-- ============================================================
CREATE TABLE IF NOT EXISTS public.simulation_log (
    sim_id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    request_id          TEXT,
    home_team           TEXT NOT NULL,
    away_team           TEXT NOT NULL,
    home_lineup         JSONB,
    away_lineup         JSONB,
    home_win_prob       REAL,
    draw_prob           REAL,
    away_win_prob       REAL,
    expected_home_goals REAL,
    expected_away_goals REAL,
    predicted_score     TEXT,
    model_version       TEXT,
    duration_ms         INTEGER,
    error               TEXT,
    created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_sl_home ON public.simulation_log (home_team);
CREATE INDEX IF NOT EXISTS idx_sl_away ON public.simulation_log (away_team);
CREATE INDEX IF NOT EXISTS idx_sl_created ON public.simulation_log (created_at);


-- ============================================================
-- TRIGGERS: auto-update updated_at timestamps
-- ============================================================
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_mh_updated ON public.match_history;
CREATE TRIGGER trg_mh_updated
    BEFORE UPDATE ON public.match_history
    FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

DROP TRIGGER IF EXISTS trg_pm_updated ON public.player_metrics_per_90;
CREATE TRIGGER trg_pm_updated
    BEFORE UPDATE ON public.player_metrics_per_90
    FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();


-- ============================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- Allows read, insert, and update operations for the anon / public role
-- ============================================================

ALTER TABLE public.teams ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow all operations for anon on teams" ON public.teams;
CREATE POLICY "Allow all operations for anon on teams"
    ON public.teams
    FOR ALL
    TO anon, authenticated, service_role
    USING (true)
    WITH CHECK (true);

ALTER TABLE public.match_history ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow all operations for anon on match_history" ON public.match_history;
CREATE POLICY "Allow all operations for anon on match_history"
    ON public.match_history
    FOR ALL
    TO anon, authenticated, service_role
    USING (true)
    WITH CHECK (true);

ALTER TABLE public.player_metrics_per_90 ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow all operations for anon on player_metrics_per_90" ON public.player_metrics_per_90;
CREATE POLICY "Allow all operations for anon on player_metrics_per_90"
    ON public.player_metrics_per_90
    FOR ALL
    TO anon, authenticated, service_role
    USING (true)
    WITH CHECK (true);

ALTER TABLE public.simulation_log ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow all operations for anon on simulation_log" ON public.simulation_log;
CREATE POLICY "Allow all operations for anon on simulation_log"
    ON public.simulation_log
    FOR ALL
    TO anon, authenticated, service_role
    USING (true)
    WITH CHECK (true);

