"use client";

import { Player, InPlayState } from "@/lib/validation";
import { TacticalSimulator } from "@/components/tactical-simulator";
import { LiveMatchController } from "@/components/live-match-controller";

interface PitchTabProps {
  homeTeam: string;
  awayTeam: string;
  onHomeTeamChange: (team: string) => void;
  onAwayTeamChange: (team: string) => void;
  homeLineup: Player[];
  awayLineup: Player[];
  availableHomePlayers: Player[];
  availableAwayPlayers: Player[];
  onHomeLineupChange: (lineup: Player[]) => void;
  onAwayLineupChange: (lineup: Player[]) => void;
  onSimulate: () => void;
  isSimulating: boolean;
  inPlayState: InPlayState;
  onInPlayStateChange: (state: InPlayState) => void;
}

export function PitchTab({
  homeTeam,
  awayTeam,
  onHomeTeamChange,
  onAwayTeamChange,
  homeLineup,
  awayLineup,
  availableHomePlayers,
  availableAwayPlayers,
  onHomeLineupChange,
  onAwayLineupChange,
  onSimulate,
  isSimulating,
  inPlayState,
  onInPlayStateChange,
}: PitchTabProps) {
  return (
    <div className="w-full space-y-4">
      {/* Live Match State / In-Play Score Controller */}
      <LiveMatchController
        inPlayState={inPlayState}
        onChange={onInPlayStateChange}
        homeTeam={homeTeam}
        awayTeam={awayTeam}
      />

      <div className="w-full bg-[--kw-surface] rounded-2xl border border-[--kw-border] p-2 sm:p-4 shadow-sm">
        <TacticalSimulator
          homeTeam={homeTeam}
          awayTeam={awayTeam}
          onHomeTeamChange={onHomeTeamChange}
          onAwayTeamChange={onAwayTeamChange}
          homeLineup={homeLineup}
          awayLineup={awayLineup}
          availableHomePlayers={availableHomePlayers}
          availableAwayPlayers={availableAwayPlayers}
          onHomeLineupChange={onHomeLineupChange}
          onAwayLineupChange={onAwayLineupChange}
          onSimulate={onSimulate}
          isSimulating={isSimulating}
        />
      </div>
    </div>
  );
}
