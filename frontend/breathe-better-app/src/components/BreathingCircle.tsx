import { motion, AnimatePresence } from "framer-motion";
import { useEffect, useRef } from "react";
import { Haptics, ImpactStyle, NotificationType } from "@capacitor/haptics";

interface BreathingCircleProps {
  phase: "inhale" | "hold" | "exhale" | "idle";
  seconds: number;
  totalCycles: number;
  targetCycles: number;
}

const phaseConfig = {
  inhale: {
    scale: 1,
    label: "Breathe In...",
    bg: "from-blue-500/20 via-blue-400/10 to-blue-600/20",
    ringColor: "hsl(217, 91%, 60%)",
    glowColor: "hsl(217 91% 60% / 0.3)",
  },
  hold: {
    scale: 1,
    label: "Hold...",
    bg: "from-purple-500/20 via-purple-400/10 to-purple-600/20",
    ringColor: "hsl(270, 70%, 55%)",
    glowColor: "hsl(270 70% 55% / 0.3)",
  },
  exhale: {
    scale: 0.55,
    label: "Breathe Out...",
    bg: "from-emerald-500/20 via-emerald-400/10 to-emerald-600/20",
    ringColor: "hsl(160, 84%, 39%)",
    glowColor: "hsl(160 84% 39% / 0.3)",
  },
  idle: {
    scale: 0.55,
    label: "Ready",
    bg: "from-muted/30 via-muted/10 to-muted/30",
    ringColor: "hsl(var(--muted-foreground))",
    glowColor: "hsl(var(--muted-foreground) / 0.1)",
  },
};

const phaseDurations = { inhale: 4, hold: 7, exhale: 8, idle: 0.3 };

// Generate a chime using Web Audio API
const playChime = () => {
  try {
    const ctx = new AudioContext();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.type = "sine";
    osc.frequency.setValueAtTime(800, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(1200, ctx.currentTime + 0.08);
    osc.frequency.exponentialRampToValueAtTime(600, ctx.currentTime + 0.3);

    gain.gain.setValueAtTime(0.15, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.5);

    osc.start(ctx.currentTime);
    osc.stop(ctx.currentTime + 0.5);

    // Second harmonic for richness
    const osc2 = ctx.createOscillator();
    const gain2 = ctx.createGain();
    osc2.connect(gain2);
    gain2.connect(ctx.destination);
    osc2.type = "sine";
    osc2.frequency.setValueAtTime(1200, ctx.currentTime);
    osc2.frequency.exponentialRampToValueAtTime(1600, ctx.currentTime + 0.08);
    osc2.frequency.exponentialRampToValueAtTime(900, ctx.currentTime + 0.25);
    gain2.gain.setValueAtTime(0.08, ctx.currentTime);
    gain2.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.4);
    osc2.start(ctx.currentTime);
    osc2.stop(ctx.currentTime + 0.4);
  } catch {
    // Audio not available
  }
};

const BreathingCircle = ({ phase, seconds, totalCycles, targetCycles }: BreathingCircleProps) => {
  const config = phaseConfig[phase];
  const prevPhaseRef = useRef(phase);

  // Play chime on phase transition
  useEffect(() => {
    if (phase !== "idle" && phase !== prevPhaseRef.current) {
      playChime();
      // Haptic feedback via Capacitor Haptics (falls back to Vibration API on web)
      try {
        if (phase === "inhale") {
          Haptics.impact({ style: ImpactStyle.Light });
        } else if (phase === "hold") {
          Haptics.notification({ type: NotificationType.Warning });
        } else if (phase === "exhale") {
          Haptics.impact({ style: ImpactStyle.Heavy });
        }
      } catch {
        // Fallback for web browsers
        if (navigator.vibrate) {
          const pattern = phase === "inhale" ? [50] : phase === "hold" ? [30, 30, 30] : [80];
          navigator.vibrate(pattern);
        }
      }
    }
    prevPhaseRef.current = phase;
  }, [phase]);

  return (
    <div className="flex flex-col items-center gap-6">
      {/* Phase-shifting gradient background */}
      <motion.div
        className={`absolute inset-0 rounded-2xl bg-gradient-to-br ${config.bg} -z-10`}
        animate={{ opacity: phase === "idle" ? 0 : 1 }}
        transition={{ duration: 1 }}
      />

      {/* Cycle progress */}
      <div className="flex items-center gap-2 mb-2">
        {Array.from({ length: targetCycles }).map((_, i) => (
          <div
            key={i}
            className={`w-3 h-3 rounded-full transition-all duration-500 ${
              i < totalCycles
                ? "bg-primary scale-110"
                : "bg-muted border border-border"
            }`}
          />
        ))}
        <span className="text-xs text-muted-foreground ml-2">
          {totalCycles}/{targetCycles} cycles
        </span>
      </div>

      {/* Circle */}
      <div className="relative flex items-center justify-center" style={{ width: 240, height: 240 }}>
        {/* Outer glow ring */}
        <motion.div
          className="absolute rounded-full"
          style={{ width: 240, height: 240, boxShadow: `0 0 40px ${config.glowColor}` }}
          animate={{
            scale: phase === "inhale" ? [1, 1.08, 1.04] : phase === "exhale" ? [1.04, 1, 0.98] : [1, 1.05, 1],
            opacity: phase === "idle" ? 0.2 : 0.6,
          }}
          transition={{ duration: phaseDurations[phase], ease: "easeInOut", repeat: 0 }}
        />

        {/* Pulse ring */}
        <motion.div
          className="absolute rounded-full border-2"
          style={{ borderColor: config.ringColor, width: 230, height: 230, opacity: 0.2 }}
          animate={{
            scale: [1, 1.15, 1],
            opacity: [0.2, 0.05, 0.2],
          }}
          transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
        />

        {/* Main breathing circle */}
        <motion.div
          className="rounded-full flex items-center justify-center shadow-lg"
          style={{ width: 200, height: 200, backgroundColor: config.ringColor }}
          animate={{ scale: config.scale }}
          transition={{
            duration: phaseDurations[phase],
            ease: "easeInOut",
          }}
        >
          <div className="text-center">
            <AnimatePresence mode="wait">
              <motion.p
                key={phase}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.3 }}
                className="text-primary-foreground font-display font-bold text-lg"
              >
                {config.label}
              </motion.p>
            </AnimatePresence>
            {phase !== "idle" && (
              <motion.p
                key={seconds}
                initial={{ scale: 1.3, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className="text-primary-foreground/80 text-4xl font-bold mt-1 tabular-nums"
              >
                {seconds}
              </motion.p>
            )}
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default BreathingCircle;
