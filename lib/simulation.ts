import type { SimulationRequest, SimulationResult, SimulationState, Player } from "@/lib/validation";

export type SimulationAction =
  | { type: "START_SIMULATION" }
  | { type: "SIMULATION_SUCCESS"; result: SimulationResult }
  | { type: "SIMULATION_ERROR"; error: string }
  | { type: "RESET" };

export interface SimulationStore {
  state: SimulationState;
  result: SimulationResult | null;
  error: string | null;
}

export function simulationReducer(
  store: SimulationStore,
  action: SimulationAction
): SimulationStore {
  switch (action.type) {
    case "START_SIMULATION":
      return { state: "loading", result: null, error: null };
    case "SIMULATION_SUCCESS":
      return { state: "complete", result: action.result, error: null };
    case "SIMULATION_ERROR":
      return { state: "error", result: null, error: action.error };
    case "RESET":
      return { state: "idle", result: null, error: null };
    default:
      return store;
  }
}

export const initialSimulationStore: SimulationStore = {
  state: "idle",
  result: null,
  error: null,
};

/** Compute summary stats for a given lineup */
export function computeLineupSummary(players: Player[]) {
  if (!players.length) return null;

  const avg = (key: keyof Player) => {
    const vals = players.map((p) => (p[key] as number) || 0);
    return vals.reduce((a, b) => a + b, 0) / vals.length;
  };

  return {
    avg_xg_90: avg("xg_90"),
    avg_xa_90: avg("xa_90"),
    avg_tackles_90: avg("tackles_90"),
    avg_interceptions_90: avg("interceptions_90"),
    avg_pressures_90: avg("pressures_90"),
    avg_shots_90: avg("shots_90"),
    positions: players.map((p) => p.position),
    player_count: players.length,
  };
}
