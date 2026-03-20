import { useState, useEffect, useCallback } from "react";
import { ArrowLeft, Flame, Trophy, Timer, Play, Pause, Wind, Zap, Clock, TrendingUp } from "lucide-react";
import { Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import AppLayout from "@/components/AppLayout";
import BreathingCircle from "@/components/BreathingCircle";
import DragonBreatherGame from "@/components/DragonBreatherGame";

type BreathPhase = "inhale" | "hold" | "exhale" | "idle";

const sessionHistory = [
  { date: "Today", type: "4-7-8 Breathing", duration: "5 min", score: 92, icon: "🫁" },
  { date: "Yesterday", type: "Dragon Breather", duration: "3 min", score: 85, icon: "🐉" },
  { date: "Feb 20", type: "4-7-8 Breathing", duration: "7 min", score: 88, icon: "🫁" },
];

const LungGym = () => {
  const [mode, setMode] = useState<"select" | "breathing" | "dragon">("select");
  const [phase, setPhase] = useState<BreathPhase>("idle");
  const [seconds, setSeconds] = useState(0);
  const [isActive, setIsActive] = useState(false);
  const [cycles, setCycles] = useState(0);
  const [sessionComplete, setSessionComplete] = useState(false);
  const TARGET_CYCLES = 4;

  const phases: { phase: BreathPhase; duration: number }[] = [
    { phase: "inhale", duration: 4 },
    { phase: "hold", duration: 7 },
    { phase: "exhale", duration: 8 },
  ];

  const runCycle = useCallback(() => {
    let phaseIndex = 0;
    let remaining = phases[0].duration;
    setPhase(phases[0].phase);
    setSeconds(remaining);

    const timer = setInterval(() => {
      remaining--;
      if (remaining <= 0) {
        phaseIndex++;
        if (phaseIndex >= phases.length) {
          phaseIndex = 0;
          setCycles((c) => {
            const next = c + 1;
            if (next >= 4) {
              clearInterval(timer);
              setIsActive(false);
              setPhase("idle");
              setSessionComplete(true);
            }
            return next;
          });
        }
        remaining = phases[phaseIndex].duration;
        setPhase(phases[phaseIndex].phase);
      }
      setSeconds(remaining);
    }, 1000);

    return timer;
  }, []);

  useEffect(() => {
    let timer: ReturnType<typeof setInterval> | undefined;
    if (isActive && mode === "breathing") {
      timer = runCycle();
    }
    return () => {
      if (timer) clearInterval(timer);
    };
  }, [isActive, mode, runCycle]);

  const toggleBreathing = () => {
    if (isActive) {
      setIsActive(false);
      setPhase("idle");
      setSeconds(0);
    } else {
      setIsActive(true);
      setCycles(0);
      setSessionComplete(false);
    }
  };

  const resetBreathing = () => {
    setSessionComplete(false);
    setCycles(0);
    setPhase("idle");
    setSeconds(0);
    setIsActive(false);
  };

  return (
    <AppLayout>
      <div className="px-4 sm:px-6 pt-5 pb-8 max-w-lg mx-auto w-full">
        {/* Header */}
        <div className="flex items-center gap-3 mb-5">
          {mode === "select" ? (
            <Link to="/dashboard" className="p-2 rounded-xl bg-muted/60 hover:bg-muted transition press-effect">
              <ArrowLeft className="w-5 h-5" />
            </Link>
          ) : (
            <button
              onClick={() => { resetBreathing(); setMode("select"); }}
              className="p-2 rounded-xl bg-muted/60 hover:bg-muted transition press-effect"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
          )}
          <div>
            <h1 className="text-xl font-display font-bold">Lung Gym</h1>
            <p className="text-xs text-muted-foreground">Train your breathing muscles</p>
          </div>
        </div>

        <AnimatePresence mode="wait">
          {mode === "select" && (
            <motion.div
              key="select"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -12 }}
              transition={{ duration: 0.3 }}
              className="space-y-5"
            >
              {/* Stats row */}
              <div className="grid grid-cols-3 gap-3">
                <div className="glass-card !p-3 text-center">
                  <div className="flex items-center justify-center gap-1.5 mb-1">
                    <Flame className="w-4 h-4 text-warning" />
                  </div>
                  <p className="text-lg font-bold text-warning">7</p>
                  <p className="text-[11px] text-muted-foreground">Day Streak</p>
                </div>
                <div className="glass-card !p-3 text-center">
                  <div className="flex items-center justify-center gap-1.5 mb-1">
                    <Trophy className="w-4 h-4 text-primary" />
                  </div>
                  <p className="text-lg font-bold text-primary">3</p>
                  <p className="text-[11px] text-muted-foreground">Badges</p>
                </div>
                <div className="glass-card !p-3 text-center">
                  <div className="flex items-center justify-center gap-1.5 mb-1">
                    <TrendingUp className="w-4 h-4 text-secondary" />
                  </div>
                  <p className="text-lg font-bold text-secondary">15m</p>
                  <p className="text-[11px] text-muted-foreground">Today</p>
                </div>
              </div>

              {/* Exercise cards */}
              <div className="space-y-3">
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Choose Exercise</p>

                {/* Guided Breathing Card */}
                <motion.button
                  onClick={() => setMode("breathing")}
                  className="w-full text-left rounded-2xl border border-primary/20 overflow-hidden press-effect group"
                  whileHover={{ scale: 1.01 }}
                  whileTap={{ scale: 0.98 }}
                  style={{ background: "linear-gradient(135deg, hsl(217 91% 60% / 0.08), hsl(270 70% 55% / 0.05))" }}
                >
                  <div className="p-5 flex items-start gap-4">
                    <div className="p-3 rounded-xl bg-primary/15 group-hover:bg-primary/25 transition-colors shrink-0">
                      <Wind className="w-6 h-6 text-primary" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-display font-bold text-base mb-0.5">Guided Breathing</h3>
                      <p className="text-sm text-muted-foreground mb-2">4-7-8 technique for deep relaxation</p>
                      <div className="flex items-center gap-3 text-xs text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <Clock className="w-3 h-3" /> ~76s per cycle
                        </span>
                        <span className="flex items-center gap-1">
                          <Zap className="w-3 h-3" /> 4 cycles
                        </span>
                      </div>
                    </div>
                    <div className="text-muted-foreground group-hover:text-primary transition-colors mt-1">
                      <Play className="w-5 h-5" />
                    </div>
                  </div>
                </motion.button>

                {/* Dragon Breather Card */}
                <motion.button
                  onClick={() => setMode("dragon")}
                  className="w-full text-left rounded-2xl border border-secondary/20 overflow-hidden press-effect group"
                  whileHover={{ scale: 1.01 }}
                  whileTap={{ scale: 0.98 }}
                  style={{ background: "linear-gradient(135deg, hsl(142 71% 45% / 0.08), hsl(160 84% 39% / 0.05))" }}
                >
                  <div className="p-5 flex items-start gap-4">
                    <div className="p-3 rounded-xl bg-secondary/15 group-hover:bg-secondary/25 transition-colors shrink-0">
                      <Flame className="w-6 h-6 text-secondary" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-display font-bold text-base mb-0.5">Dragon Breather</h3>
                      <p className="text-sm text-muted-foreground mb-2">Blow into mic to fly — fun breath training!</p>
                      <div className="flex items-center gap-3 text-xs text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <Timer className="w-3 h-3" /> 60s rounds
                        </span>
                        <span className="flex items-center gap-1">
                          <Trophy className="w-3 h-3" /> Beat your score
                        </span>
                      </div>
                    </div>
                    <div className="text-muted-foreground group-hover:text-secondary transition-colors mt-1">
                      <Play className="w-5 h-5" />
                    </div>
                  </div>
                </motion.button>
              </div>

              {/* Session History */}
              <div>
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-3">Recent Sessions</p>
                <div className="space-y-2">
                  {sessionHistory.map((s, i) => (
                    <motion.div
                      key={i}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: i * 0.08 }}
                      className="flex items-center justify-between glass-card !p-3.5 !rounded-xl"
                    >
                      <div className="flex items-center gap-3">
                        <span className="text-lg">{s.icon}</span>
                        <div>
                          <p className="text-sm font-semibold">{s.type}</p>
                          <p className="text-xs text-muted-foreground">{s.date} • {s.duration}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <span className="text-sm font-bold text-primary">{s.score}</span>
                        <p className="text-[10px] text-muted-foreground">score</p>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </div>
            </motion.div>
          )}

          {mode === "breathing" && (
            <motion.div
              key="breathing"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -12 }}
              transition={{ duration: 0.3 }}
              className="relative text-center py-4"
            >
              {sessionComplete ? (
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="py-8 glass-card"
                >
                  <div className="text-5xl mb-4">🧘</div>
                  <h3 className="font-display font-bold text-xl mb-2">Session Complete!</h3>
                  <p className="text-sm text-muted-foreground mb-2">
                    You completed {TARGET_CYCLES} cycles of 4-7-8 breathing
                  </p>
                  <p className="text-xs text-muted-foreground mb-6">Total time: ~{TARGET_CYCLES * 19} seconds</p>
                  <div className="flex gap-3 justify-center">
                    <button
                      onClick={() => { resetBreathing(); setIsActive(true); }}
                      className="flex items-center gap-2 gradient-primary text-primary-foreground font-semibold px-6 py-3 rounded-xl press-effect"
                    >
                      <Play className="w-5 h-5" />
                      Again
                    </button>
                    <button
                      onClick={() => { resetBreathing(); setMode("select"); }}
                      className="px-6 py-3 rounded-xl border border-border font-semibold text-muted-foreground press-effect"
                    >
                      Done
                    </button>
                  </div>
                </motion.div>
              ) : (
                <>
                  <p className="text-sm text-muted-foreground mb-4">4-7-8 Breathing Technique</p>

                  <div className="flex justify-center">
                    <BreathingCircle phase={phase} seconds={seconds} totalCycles={cycles} targetCycles={TARGET_CYCLES} />
                  </div>

                  <div className="flex gap-3 justify-center mt-8">
                    <button
                      onClick={toggleBreathing}
                      className="flex items-center gap-2 gradient-primary text-primary-foreground font-semibold px-8 py-3.5 rounded-xl glow-button press-effect"
                    >
                      {isActive ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5" />}
                      {isActive ? "Stop" : "Start"}
                    </button>
                  </div>
                </>
              )}
            </motion.div>
          )}

          {mode === "dragon" && (
            <motion.div
              key="dragon"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -12 }}
              transition={{ duration: 0.3 }}
            >
              <DragonBreatherGame onBack={() => setMode("select")} />
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </AppLayout>
  );
};

export default LungGym;
