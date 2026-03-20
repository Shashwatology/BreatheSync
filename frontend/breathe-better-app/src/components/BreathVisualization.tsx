import { motion } from "framer-motion";
import { Wind } from "lucide-react";

interface BreathVisualizationProps {
  score: number;
}

const getScoreColor = (score: number) => {
  if (score >= 70) return { primary: "var(--success)", secondary: "hsl(142 71% 45% / 0.3)" };
  if (score >= 50) return { primary: "var(--warning)", secondary: "hsl(38 92% 50% / 0.3)" };
  return { primary: "var(--danger)", secondary: "hsl(0 84% 60% / 0.3)" };
};

const getBreathingDuration = (score: number) => {
  // Higher score = slower, more relaxed breathing (e.g. 5s cycle)
  // Lower score = faster, stressed breathing (e.g. 2s cycle)
  if (score >= 70) return 4.5;
  if (score >= 50) return 3;
  return 1.8;
};

export default function BreathVisualization({ score }: BreathVisualizationProps) {
  const colors = getScoreColor(score);
  const breathDuration = getBreathingDuration(score);

  return (
    <div className="relative w-48 h-48 mx-auto flex items-center justify-center my-6 perspective-1000">
      
      {/* Outer ambient glow */}
      <motion.div
        className="absolute inset-0 rounded-full blur-2xl"
        style={{ backgroundColor: colors.secondary }}
        animate={{ 
          scale: [0.8, 1.2, 0.8],
          opacity: [0.3, 0.6, 0.3] 
        }}
        transition={{
          duration: breathDuration,
          ease: "easeInOut",
          repeat: Infinity
        }}
      />

      {/* Organic expanding shape 1 */}
      <motion.div
        className="absolute w-full h-full border border-white/20 rounded-[40%_60%_70%_30%/40%_50%_60%_50%]"
        animate={{
          rotate: 360,
          scale: [0.9, 1.1, 0.9],
          borderRadius: [
            "40% 60% 70% 30% / 40% 50% 60% 50%",
            "60% 40% 30% 70% / 50% 60% 50% 40%",
            "40% 60% 70% 30% / 40% 50% 60% 50%"
          ]
        }}
        transition={{
          rotate: { duration: 20, ease: "linear", repeat: Infinity },
          scale: { duration: breathDuration, ease: "easeInOut", repeat: Infinity },
          borderRadius: { duration: 8, ease: "easeInOut", repeat: Infinity }
        }}
        style={{ borderColor: colors.primary }}
      />
      
      {/* Organic expanding shape 2 */}
      <motion.div
        className="absolute w-5/6 h-5/6 border-[1.5px] border-white/30 rounded-[60%_40%_30%_70%/50%_60%_50%_40%]"
        animate={{
          rotate: -360,
          scale: [0.85, 1.15, 0.85],
          borderRadius: [
            "60% 40% 30% 70% / 50% 60% 50% 40%",
            "40% 60% 70% 30% / 40% 50% 60% 50%",
            "60% 40% 30% 70% / 50% 60% 50% 40%"
          ]
        }}
        transition={{
          rotate: { duration: 25, ease: "linear", repeat: Infinity },
          scale: { duration: breathDuration, ease: "easeInOut", repeat: Infinity },
          borderRadius: { duration: 10, ease: "easeInOut", repeat: Infinity }
        }}
        style={{ borderColor: colors.primary, opacity: 0.6 }}
      />

      {/* Central Core Score Display */}
      <motion.div 
        className="relative z-10 flex flex-col items-center justify-center w-32 h-32 rounded-full glass-card border flex items-center justify-center shadow-xl"
        style={{
          boxShadow: `0 0 40px ${colors.secondary}`,
          borderColor: 'rgba(255,255,255,0.1)'
        }}
        animate={{
            scale: [0.98, 1.05, 0.98]
        }}
        transition={{
            duration: breathDuration,
            ease: "easeInOut",
            repeat: Infinity
        }}
      >
        <Wind className="w-5 h-5 mb-1 opacity-80" style={{ color: colors.primary }} />
        <span className="font-display font-bold text-4xl tracking-tighter text-white drop-shadow-md">
          {score}
        </span>
        <span className="text-[10px] font-semibold uppercase tracking-wider text-white/50 mt-1">
          LVS / 100
        </span>
      </motion.div>
    </div>
  );
}
