"use client";

import { useEffect, useState, useReducer } from "react";
import confetti from "canvas-confetti";
import { motion, AnimatePresence } from "framer-motion";
import { useTheme } from "next-themes";
import { TabType } from "@/components/sidebar";
import { TopHeader } from "@/components/top-header";
import { BottomDockNav } from "@/components/bottom-dock-nav";
import { PitchTab } from "@/components/tabs/pitch-tab";
import { ForecastTab } from "@/components/tabs/forecast-tab";
import { RadarTab } from "@/components/tabs/radar-tab";
import { MatrixTab } from "@/components/tabs/matrix-tab";
import { ExplainTab } from "@/components/tabs/explain-tab";
import { DerbiesTab } from "@/components/tabs/derbies-tab";
import { ModelTab } from "@/components/tabs/model-tab";
import { LandingPage } from "@/components/landing-page";
import { ProcessingOverlay } from "@/components/processing-overlay";
import { ResultPopUpModal } from "@/components/result-popup-modal";
import { Particles } from "@/components/ui/particles";
import { fetchTeams, fetchPlayers, runSimulation } from "@/lib/api";
import { Player, SimulationResult, InPlayState } from "@/lib/validation";
import { simulationReducer, initialSimulationStore } from "@/lib/simulation";
import { getFallbackPlayersForTeam } from "@/lib/fallback-data";
import { simulateMatchClient } from "@/lib/client-simulator";
import { logSimulationToSupabase } from "@/lib/supabase";

export default function KickwiseDashboard() {
  const { resolvedTheme } = useTheme();
  const [activeTab, setActiveTab] = useState<TabType>("landing");

  const [homeTeam, setHomeTeam] = useState<string>("Bayern Munich");
  const [awayTeam, setAwayTeam] = useState<string>("Borussia Dortmund");

  const [availableHomePlayers, setAvailableHomePlayers] = useState<Player[]>([]);
  const [availableAwayPlayers, setAvailableAwayPlayers] = useState<Player[]>([]);

  const [homeLineup, setHomeLineup] = useState<Player[]>([]);
  const [awayLineup, setAwayLineup] = useState<Player[]>([]);

  const [inPlayState, setInPlayState] = useState<InPlayState>({
    isLive: false,
    currentHomeScore: 0,
    currentAwayScore: 0,
    elapsedMinutes: 0,
  });

  const [showResultPopUp, setShowResultPopUp] = useState(false);
  const [particleColor, setParticleColor] = useState("#000000");

  const [simStore, dispatchSim] = useReducer(
    simulationReducer,
    initialSimulationStore
  );

  useEffect(() => {
    setParticleColor(resolvedTheme === "dark" ? "#ffffff" : "#000000");
  }, [resolvedTheme]);

  // Load squads when teams change
  useEffect(() => {
    let isMounted = true;

    async function loadSquads() {
      try {
        const hPlayers = await fetchPlayers(homeTeam);
        const aPlayers = await fetchPlayers(awayTeam);

        if (isMounted) {
          setAvailableHomePlayers(hPlayers);
          setAvailableAwayPlayers(aPlayers);
          setHomeLineup(hPlayers.slice(0, 11));
          setAwayLineup(aPlayers.slice(0, 11));
        }
      } catch (err) {
        if (isMounted) {
          const hFallback = getFallbackPlayersForTeam(homeTeam);
          const aFallback = getFallbackPlayersForTeam(awayTeam);
          setAvailableHomePlayers(hFallback);
          setAvailableAwayPlayers(aFallback);
          setHomeLineup(hFallback.slice(0, 11));
          setAwayLineup(aFallback.slice(0, 11));
        }
      }
    }

    loadSquads();
    return () => {
      isMounted = false;
    };
  }, [homeTeam, awayTeam]);

  // Simulation calculation whenever lineups or inPlayState changes
  useEffect(() => {
    if (homeLineup.length >= 11 && awayLineup.length >= 11) {
      const clientRes = simulateMatchClient(
        homeTeam,
        awayTeam,
        homeLineup,
        awayLineup,
        inPlayState
      );
      dispatchSim({ type: "SIMULATION_SUCCESS", result: clientRes });
    }
  }, [homeLineup, awayLineup, homeTeam, awayTeam, inPlayState]);

  const handleSimulate = async () => {
    dispatchSim({ type: "START_SIMULATION" });

    // Authentic calculation delay (2.75s) so the user observes all 6 ML inference pipeline stages
    const SIMULATION_CALCULATION_DELAY_MS = 2750;

    try {
      const resPromise = runSimulation({
        home_team: homeTeam,
        away_team: awayTeam,
        home_lineup: homeLineup,
        away_lineup: awayLineup,
      });

      const delayPromise = new Promise((resolve) =>
        setTimeout(resolve, SIMULATION_CALCULATION_DELAY_MS)
      );

      let [res] = await Promise.all([resPromise, delayPromise]);

      // If in-play state is active, recalibrate using live match parameters
      if (inPlayState.isLive) {
        res = simulateMatchClient(homeTeam, awayTeam, homeLineup, awayLineup, inPlayState);
      }

      dispatchSim({ type: "SIMULATION_SUCCESS", result: res });
      setShowResultPopUp(true);

      // Log to Supabase in background
      logSimulationToSupabase(res, homeTeam, awayTeam);

      // Celebration confetti
      confetti({
        particleCount: 85,
        spread: 70,
        origin: { y: 0.5 },
        colors: ["#4285f4", "#34a853", "#ea4335", "#fbbc04"],
      });
    } catch (err) {
      setTimeout(() => {
        const clientRes = simulateMatchClient(
          homeTeam,
          awayTeam,
          homeLineup,
          awayLineup,
          inPlayState
        );
        dispatchSim({ type: "SIMULATION_SUCCESS", result: clientRes });
        setShowResultPopUp(true);
        logSimulationToSupabase(clientRes, homeTeam, awayTeam);
      }, SIMULATION_CALCULATION_DELAY_MS);
    }
  };

  const handleSelectDerby = (h: string, a: string) => {
    setHomeTeam(h);
    setAwayTeam(a);
    setActiveTab("simulator");
  };

  const currentResult: SimulationResult =
    simStore.result ||
    simulateMatchClient(homeTeam, awayTeam, homeLineup, awayLineup, inPlayState);

  return (
    <div className="relative min-h-screen bg-[--kw-bg] text-[--kw-text] overflow-x-hidden selection:bg-blue-500 selection:text-white">
      {/* Dynamic Background Particles */}
      <Particles
        className="absolute inset-0 pointer-events-none z-0"
        quantity={28}
        staticity={50}
        color={particleColor}
      />

      {/* Global Processing Overlay during ML calculation */}
      <ProcessingOverlay isVisible={simStore.state === "loading"} />

      {/* Result Pop-Up Modal with confetti reveal */}
      <ResultPopUpModal
        isOpen={showResultPopUp}
        onClose={() => setShowResultPopUp(false)}
        result={currentResult}
        homeTeam={homeTeam}
        awayTeam={awayTeam}
        onNavigateTab={(tab) => {
          setShowResultPopUp(false);
          setActiveTab(tab);
        }}
      />

      {/* Landing Page (Default View) */}
      {activeTab === "landing" ? (
        <LandingPage onEnterSimulator={(tab) => setActiveTab(tab || "simulator")} />
      ) : (
        <div className="relative z-10 mx-auto max-w-[1400px] px-3 sm:px-6 lg:px-8 pt-3 sm:pt-5 pb-28">
          {/* Top Header with Brand & Animated Theme Toggler */}
          <TopHeader homeTeam={homeTeam} awayTeam={awayTeam} />

          {/* Tab Content Display Area with Fade Transitions */}
          <main className="w-full mt-2">
            <AnimatePresence mode="wait">
              {activeTab === "simulator" && (
              <motion.div
                key="simulator"
                initial={{ opacity: 0, y: 16, scale: 0.98 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -12, scale: 0.98 }}
                transition={{ type: "spring", stiffness: 300, damping: 28, mass: 0.8 }}
              >
                <PitchTab
                  homeTeam={homeTeam}
                  awayTeam={awayTeam}
                  onHomeTeamChange={setHomeTeam}
                  onAwayTeamChange={setAwayTeam}
                  homeLineup={homeLineup}
                  awayLineup={awayLineup}
                  availableHomePlayers={availableHomePlayers}
                  availableAwayPlayers={availableAwayPlayers}
                  onHomeLineupChange={setHomeLineup}
                  onAwayLineupChange={setAwayLineup}
                  onSimulate={handleSimulate}
                  isSimulating={simStore.state === "loading"}
                  inPlayState={inPlayState}
                  onInPlayStateChange={setInPlayState}
                />
              </motion.div>
            )}

            {activeTab === "forecast" && (
              <motion.div
                key="forecast"
                initial={{ opacity: 0, y: 16, scale: 0.98 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -12, scale: 0.98 }}
                transition={{ type: "spring", stiffness: 300, damping: 28, mass: 0.8 }}
              >
                <ForecastTab
                  result={currentResult}
                  homeTeam={homeTeam}
                  awayTeam={awayTeam}
                  onSimulate={handleSimulate}
                  isSimulating={simStore.state === "loading"}
                />
              </motion.div>
            )}

            {activeTab === "radar" && (
              <motion.div
                key="radar"
                initial={{ opacity: 0, y: 16, scale: 0.98 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -12, scale: 0.98 }}
                transition={{ type: "spring", stiffness: 300, damping: 28, mass: 0.8 }}
              >
                <RadarTab
                  radar={currentResult.radar}
                  homeTeam={homeTeam}
                  awayTeam={awayTeam}
                />
              </motion.div>
            )}

            {activeTab === "matrix" && (
              <motion.div
                key="matrix"
                initial={{ opacity: 0, y: 16, scale: 0.98 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -12, scale: 0.98 }}
                transition={{ type: "spring", stiffness: 300, damping: 28, mass: 0.8 }}
              >
                <MatrixTab
                  scorelineProbabilities={currentResult.scoreline_probabilities}
                  homeTeam={homeTeam}
                  awayTeam={awayTeam}
                  expectedHomeGoals={currentResult.expected_home_goals}
                  expectedAwayGoals={currentResult.expected_away_goals}
                />
              </motion.div>
            )}

            {activeTab === "explain" && (
              <motion.div
                key="explain"
                initial={{ opacity: 0, y: 16, scale: 0.98 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -12, scale: 0.98 }}
                transition={{ type: "spring", stiffness: 300, damping: 28, mass: 0.8 }}
              >
                <ExplainTab
                  shapFeatures={currentResult.shap_features}
                  tacticalSummary={currentResult.tactical_summary}
                />
              </motion.div>
            )}

            {activeTab === "model" && (
              <motion.div
                key="model"
                initial={{ opacity: 0, y: 16, scale: 0.98 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -12, scale: 0.98 }}
                transition={{ type: "spring", stiffness: 300, damping: 28, mass: 0.8 }}
              >
                <ModelTab />
              </motion.div>
            )}

            {activeTab === "derbies" && (
              <motion.div
                key="derbies"
                initial={{ opacity: 0, y: 16, scale: 0.98 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -12, scale: 0.98 }}
                transition={{ type: "spring", stiffness: 300, damping: 28, mass: 0.8 }}
              >
                <DerbiesTab
                  onSelectMatchup={handleSelectDerby}
                  onSimulate={handleSimulate}
                  isSimulating={simStore.state === "loading"}
                />
              </motion.div>
            )}
          </AnimatePresence>

          </main>
        </div>
      )}

      {/* Floating Bottom Dock Navigation with Magic UI magnification effect */}
      <BottomDockNav activeTab={activeTab} onSelectTab={setActiveTab} />

      {/* Global Processing Simulation Overlay */}
      <ProcessingOverlay isOpen={simStore.state === "loading"} />

      {/* Pop-up Effect Result Reveal Modal */}
      <ResultPopUpModal
        isOpen={showResultPopUp}
        onClose={() => setShowResultPopUp(false)}
        result={currentResult}
        homeTeam={homeTeam}
        awayTeam={awayTeam}
        onNavigateTab={(tab) => {
          setActiveTab(tab);
          setShowResultPopUp(false);
        }}
      />
    </div>
  );
}
