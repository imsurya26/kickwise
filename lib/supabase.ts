import { createClient } from "@supabase/supabase-js";
import type { SimulationResult } from "@/lib/validation";

// Public (anon) client — safe for browser, read-only operations
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "https://ipbhdkyemvvlbsqbnxnm.supabase.co";
const supabaseAnonKey =
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImlwYmhka3llbXZ2bGJzcWJueG5tIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODk5Nzc2ODIsImV4cCI6MjEwNTU1MzY4Mn0.UEKDZqL3tvgLoK0HoMTULx8VIuNU0KFnQj1o9W6Eu6w";

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Server-side client
export function createServerClient() {
  const url = process.env.SUPABASE_URL || supabaseUrl;
  const key = process.env.SUPABASE_KEY || supabaseAnonKey;
  return createClient(url, key);
}

// Log match simulation outcome directly into Supabase 'simulation_log' table
export async function logSimulationToSupabase(
  result: SimulationResult,
  homeTeam: string,
  awayTeam: string
): Promise<void> {
  try {
    const { error } = await supabase.from("simulation_log").insert({
      home_team: homeTeam,
      away_team: awayTeam,
      home_win_prob: result.home_win_probability,
      draw_prob: result.draw_probability,
      away_win_prob: result.away_win_probability,
      expected_home_goals: result.expected_home_goals,
      expected_away_goals: result.expected_away_goals,
      predicted_score: result.predicted_score,
      model_version: result.model_version,
      duration_ms: result.duration_ms,
      created_at: new Date().toISOString(),
    });

    if (error) {
      console.warn("[kickwise] Supabase simulation logging notice:", error.message);
    } else {
      console.log("[kickwise] Successfully saved simulation to Supabase simulation_log!");
    }
  } catch (err) {
    console.warn("[kickwise] Supabase write skipped (offline or table pending):", err);
  }
}
