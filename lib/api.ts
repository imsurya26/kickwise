import type { Player, SimulationResult } from "@/lib/validation";
import { getFallbackPlayersForTeam } from "@/lib/fallback-data";
import { simulateMatchClient } from "@/lib/client-simulator";
import { BUNDESLIGA_TEAMS } from "@/components/tactical-simulator";

const API_BASE =
  process.env.NEXT_PUBLIC_PREDICTION_API_URL ||
  process.env.PREDICTION_API_URL ||
  "http://127.0.0.1:8000";

export async function fetchTeams(): Promise<string[]> {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 2000);

    const res = await fetch(`${API_BASE}/teams`, {
      cache: "no-store",
      signal: controller.signal,
    });
    clearTimeout(timeoutId);

    if (res.ok) {
      const data = await res.json();
      if (Array.isArray(data.teams) && data.teams.length > 0) {
        return data.teams as string[];
      }
    }
  } catch (err) {
    // Graceful fallback to verified Bundesliga roster
  }
  return BUNDESLIGA_TEAMS;
}

export async function fetchPlayers(team: string): Promise<Player[]> {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 2000);

    const res = await fetch(
      `${API_BASE}/players/${encodeURIComponent(team)}`,
      {
        cache: "no-store",
        signal: controller.signal,
      }
    );
    clearTimeout(timeoutId);

    if (res.ok) {
      const data = await res.json();
      if (Array.isArray(data.players) && data.players.length > 0) {
        return data.players as Player[];
      }
    }
  } catch (err) {
    // Graceful fallback
  }
  return getFallbackPlayersForTeam(team);
}

export async function runSimulation(payload: {
  home_team: string;
  away_team: string;
  home_lineup: Player[];
  away_lineup: Player[];
  season?: string;
}): Promise<SimulationResult> {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000);

    const res = await fetch(`${API_BASE}/simulate`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
      cache: "no-store",
      signal: controller.signal,
    });
    clearTimeout(timeoutId);

    if (res.ok) {
      return (await res.json()) as SimulationResult;
    }
  } catch (err) {
    // Fallback to client simulator
  }

  // Fast, deterministic client fallback
  return simulateMatchClient(
    payload.home_team,
    payload.away_team,
    payload.home_lineup,
    payload.away_lineup
  );
}
