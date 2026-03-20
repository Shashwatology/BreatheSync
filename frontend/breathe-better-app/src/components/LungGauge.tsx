import { useState, useEffect } from "react";

interface LungGaugeProps {
  score: number;
  size?: number;
}

const LungGauge = ({ score, size = 160 }: LungGaugeProps) => {
  const [animatedScore, setAnimatedScore] = useState(0);
  const radius = (size - 16) / 2;
  const circumference = 2 * Math.PI * radius;
  const progress = (animatedScore / 100) * circumference;

  const getColor = () => {
    if (animatedScore >= 75) return "hsl(var(--success))";
    if (animatedScore >= 50) return "hsl(var(--warning))";
    return "hsl(var(--danger))";
  };

  // Animate score from 0 to target
  useEffect(() => {
    let frame: number;
    let start: number | null = null;
    const duration = 1200;

    const animate = (timestamp: number) => {
      if (!start) start = timestamp;
      const elapsed = timestamp - start;
      const progress = Math.min(elapsed / duration, 1);
      // Ease out cubic
      const eased = 1 - Math.pow(1 - progress, 3);
      setAnimatedScore(Math.round(eased * score));
      if (progress < 1) frame = requestAnimationFrame(animate);
    };

    frame = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(frame);
  }, [score]);

  const showGlow = animatedScore > 80;

  return (
    <div className="relative inline-flex items-center justify-center" style={{ width: size, height: size }}>
      {/* Glow effect for high scores */}
      {showGlow && (
        <div
          className="absolute inset-0 rounded-full animate-pulse"
          style={{
            background: `radial-gradient(circle, hsl(var(--success) / 0.15) 0%, transparent 70%)`,
            transform: "scale(1.3)",
          }}
        />
      )}
      <svg width={size} height={size} className="-rotate-90">
        <defs>
          <linearGradient id="scoreGradient" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#EF4444" />
            <stop offset="50%" stopColor="#F59E0B" />
            <stop offset="100%" stopColor="#22C55E" />
          </linearGradient>
        </defs>
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="hsl(var(--muted))"
          strokeWidth="8"
          opacity="0.3"
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="url(#scoreGradient)"
          strokeWidth="8"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={circumference - progress}
          className="transition-none"
          style={{ filter: showGlow ? "drop-shadow(0 0 6px hsl(142 71% 45% / 0.4))" : "none" }}
        />
      </svg>
      <div className="absolute flex flex-col items-center">
        <span className="text-3xl font-semibold font-display" style={{ color: getColor() }}>{animatedScore}</span>
        <span className="text-xs text-muted-foreground">/ 100</span>
      </div>
    </div>
  );
};

export default LungGauge;
