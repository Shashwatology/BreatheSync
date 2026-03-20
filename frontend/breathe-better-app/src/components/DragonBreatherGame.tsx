import { useState, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Trophy, RotateCcw, ArrowLeft } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

interface Cloud {
  id: number;
  x: number;
  y: number;
  width: number;
  speed: number;
  passed: boolean;
}

interface DragonBreatherGameProps {
  onBack: () => void;
}

const DRAGON_SIZE = 50;
const CLOUD_GAP = 120;
const GRAVITY = 1.2;
const BLOW_LIFT = -3.5;
const MIC_THRESHOLD = 0.06;

const DragonSVG = ({ flapping }: { flapping: boolean }) => (
  <svg width={DRAGON_SIZE} height={DRAGON_SIZE} viewBox="0 0 64 64" fill="none">
    {/* Body */}
    <ellipse cx="32" cy="36" rx="16" ry="14" fill="hsl(var(--success))" />
    <ellipse cx="32" cy="36" rx="13" ry="11" fill="hsl(var(--success))" opacity="0.7" />
    {/* Belly */}
    <ellipse cx="32" cy="40" rx="9" ry="8" fill="#A7F3D0" />
    {/* Head */}
    <circle cx="44" cy="24" r="10" fill="hsl(var(--success))" />
    <circle cx="44" cy="24" r="8" fill="#34D399" />
    {/* Eyes */}
    <circle cx="47" cy="22" r="3" fill="white" />
    <circle cx="48" cy="22" r="1.5" fill="#1F2937" />
    {/* Nostrils with fire */}
    <circle cx="52" cy="26" r="1" fill="#F59E0B" />
    <circle cx="52" cy="28" r="1" fill="#F59E0B" />
    {flapping && (
      <>
        <ellipse cx="54" cy="25" rx="3" ry="1.5" fill="#EF4444" opacity="0.8" />
        <ellipse cx="56" cy="27" rx="4" ry="2" fill="#F59E0B" opacity="0.6" />
      </>
    )}
    {/* Wings */}
    <motion.path
      d={flapping
        ? "M 28 28 Q 12 10 8 26 Q 14 22 22 30"
        : "M 28 28 Q 12 22 8 34 Q 14 28 22 32"
      }
      fill="#059669"
      opacity="0.8"
      animate={{ d: flapping
        ? "M 28 28 Q 12 10 8 26 Q 14 22 22 30"
        : "M 28 28 Q 12 22 8 34 Q 14 28 22 32"
      }}
      transition={{ duration: 0.15 }}
    />
    {/* Tail */}
    <path d="M 16 38 Q 6 42 4 52 Q 8 48 14 44" fill="#059669" opacity="0.7" />
    {/* Spikes */}
    <path d="M 38 16 L 40 10 L 42 16" fill="#F59E0B" />
    <path d="M 34 18 L 35 12 L 37 18" fill="#F59E0B" />
  </svg>
);

const CloudSVG = ({ width }: { width: number }) => (
  <svg width={width} height={40} viewBox={`0 0 ${width} 40`}>
    <ellipse cx={width * 0.3} cy="22" rx={width * 0.3} ry="16" fill="hsl(var(--muted))" opacity="0.85" />
    <ellipse cx={width * 0.6} cy="18" rx={width * 0.25} ry="14" fill="hsl(var(--muted))" opacity="0.9" />
    <ellipse cx={width * 0.45} cy="25" rx={width * 0.35} ry="12" fill="hsl(var(--border))" opacity="0.7" />
  </svg>
);

const DragonBreatherGame = ({ onBack }: DragonBreatherGameProps) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [gameSize, setGameSize] = useState({ width: 360, height: 500 });
  const [gameState, setGameState] = useState<"ready" | "playing" | "gameover">("ready");
  const [dragonY, setDragonY] = useState(250);
  const [velocity, setVelocity] = useState(0);
  const [score, setScore] = useState(0);
  const [timeLeft, setTimeLeft] = useState(60);
  const [clouds, setClouds] = useState<Cloud[]>([]);
  const [highScore, setHighScore] = useState(0);
  const [isBlowing, setIsBlowing] = useState(false);
  const [micError, setMicError] = useState(false);

  const animFrameRef = useRef<number>();
  const timerRef = useRef<ReturnType<typeof setInterval>>();
  const cloudIdRef = useRef(0);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const gameStateRef = useRef(gameState);
  const velocityRef = useRef(velocity);
  const dragonYRef = useRef(dragonY);
  const cloudsRef = useRef(clouds);
  const scoreRef = useRef(score);
  const gameSizeRef = useRef(gameSize);

  // Responsive sizing
  useEffect(() => {
    const updateSize = () => {
      if (containerRef.current) {
        const w = containerRef.current.clientWidth;
        const h = Math.min(Math.max(w * 1.3, 400), 600);
        const newSize = { width: w, height: h };
        setGameSize(newSize);
        gameSizeRef.current = newSize;
      }
    };
    updateSize();
    window.addEventListener("resize", updateSize);
    return () => window.removeEventListener("resize", updateSize);
  }, []);

  // Keep refs synced
  useEffect(() => { gameStateRef.current = gameState; }, [gameState]);
  useEffect(() => { velocityRef.current = velocity; }, [velocity]);
  useEffect(() => { dragonYRef.current = dragonY; }, [dragonY]);
  useEffect(() => { cloudsRef.current = clouds; }, [clouds]);
  useEffect(() => { scoreRef.current = score; }, [score]);

  const DRAGON_X = Math.max(gameSize.width * 0.15, 50);

  const getMicVolume = useCallback(() => {
    if (!analyserRef.current) return 0;
    const data = new Uint8Array(analyserRef.current.fftSize);
    analyserRef.current.getByteTimeDomainData(data);
    let sum = 0;
    for (let i = 0; i < data.length; i++) {
      const val = (data[i] - 128) / 128;
      sum += val * val;
    }
    return Math.sqrt(sum / data.length);
  }, []);

  const initMic = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;
      const ctx = new AudioContext();
      audioCtxRef.current = ctx;
      const source = ctx.createMediaStreamSource(stream);
      const analyser = ctx.createAnalyser();
      analyser.fftSize = 512;
      source.connect(analyser);
      analyserRef.current = analyser;
      setMicError(false);
    } catch {
      setMicError(true);
    }
  }, []);

  const spawnCloud = useCallback(() => {
    const gh = gameSizeRef.current.height;
    const gw = gameSizeRef.current.width;
    const gapY = 60 + Math.random() * (gh - CLOUD_GAP - 120);
    const w = 70 + Math.random() * 40;
    const topCloud: Cloud = {
      id: cloudIdRef.current++,
      x: gw + 10,
      y: gapY - CLOUD_GAP / 2 - 40,
      width: w,
      speed: 2 + Math.random(),
      passed: false,
    };
    const bottomCloud: Cloud = {
      id: cloudIdRef.current++,
      x: gw + 10,
      y: gapY + CLOUD_GAP / 2,
      width: w,
      speed: topCloud.speed,
      passed: false,
    };
    setClouds((prev) => [...prev, topCloud, bottomCloud]);
  }, []);

  const checkCollision = useCallback((dy: number, cloudList: Cloud[]) => {
    const gh = gameSizeRef.current.height;
    const dragonTop = dy;
    const dragonBottom = dy + DRAGON_SIZE;
    const dragonLeft = Math.max(gameSizeRef.current.width * 0.15, 50);
    const dragonRight = dragonLeft + DRAGON_SIZE;

    if (dragonTop < 0 || dragonBottom > gh) return true;

    for (const cloud of cloudList) {
      const cloudRight = cloud.x + cloud.width;
      const cloudBottom = cloud.y + 40;
      if (
        dragonRight > cloud.x + 10 &&
        dragonLeft < cloudRight - 10 &&
        dragonBottom > cloud.y + 5 &&
        dragonTop < cloudBottom - 5
      ) {
        return true;
      }
    }
    return false;
  }, []);

  const endGame = useCallback(async () => {
    setGameState("gameover");
    if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    if (timerRef.current) clearInterval(timerRef.current);

    const finalScore = Math.floor(scoreRef.current);

    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      await supabase.from("high_scores").insert({
        user_id: user.id,
        score: finalScore,
        game_duration_seconds: 60,
      });
    }

    if (finalScore > highScore) {
      setHighScore(finalScore);
      localStorage.setItem("dragonBreather_highScore", finalScore.toString());
    }
  }, [highScore]);

  const gameLoop = useCallback(() => {
    if (gameStateRef.current !== "playing") return;

    const vol = getMicVolume();
    const blowing = vol > MIC_THRESHOLD;
    setIsBlowing(blowing);

    let newVel = velocityRef.current + GRAVITY;
    if (blowing) {
      newVel += BLOW_LIFT * (1 + vol * 8);
    }
    newVel = Math.max(-8, Math.min(newVel, 8));

    const newY = dragonYRef.current + newVel;
    setVelocity(newVel);
    setDragonY(newY);

    const dragonLeft = Math.max(gameSizeRef.current.width * 0.15, 50);

    setClouds((prev) => {
      const updated = prev
        .map((c) => ({ ...c, x: c.x - c.speed }))
        .filter((c) => c.x + c.width > -20);

      let bonus = 0;
      for (const c of updated) {
        if (!c.passed && c.x + c.width < dragonLeft) {
          c.passed = true;
          bonus += 0.5;
        }
      }
      if (bonus > 0) setScore((s) => s + bonus);
      return updated;
    });

    if (checkCollision(newY, cloudsRef.current)) {
      endGame();
      return;
    }

    animFrameRef.current = requestAnimationFrame(gameLoop);
  }, [getMicVolume, checkCollision, endGame]);

  const [currentVolume, setCurrentVolume] = useState(0);

  // Separate loop for volume meter UI to not bottleneck the 60fps game loop
  useEffect(() => {
    let volFrame: number;
    const updateVol = () => {
      if (gameState === "playing" || gameState === "ready") {
        setCurrentVolume(getMicVolume());
      }
      volFrame = requestAnimationFrame(updateVol);
    };
    updateVol();
    return () => cancelAnimationFrame(volFrame);
  }, [getMicVolume, gameState]);

  // Load high score
  useEffect(() => {
    const loadHighScore = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data } = await supabase
          .from("high_scores")
          .select("score")
          .eq("user_id", user.id)
          .order("score", { ascending: false })
          .limit(1);
        if (data && data.length > 0) setHighScore(data[0].score);
      } else {
        const saved = localStorage.getItem("dragonBreather_highScore");
        if (saved) setHighScore(parseInt(saved, 10));
      }
    };
    loadHighScore();
  }, []);

  // Eagerly initialize mic on mount so the volume meter works and game starts faster
  useEffect(() => {
    initMic();
  }, [initMic]);

  const startGame = useCallback(async () => {
    if (!analyserRef.current) await initMic();

    const gh = gameSizeRef.current.height;
    setDragonY(gh / 2);
    setVelocity(0);
    setScore(0);
    setTimeLeft(60);
    setClouds([]);
    cloudIdRef.current = 0;
    setGameState("playing");

    timerRef.current = setInterval(() => {
      setTimeLeft((t) => {
        if (t <= 1) {
          endGame();
          return 0;
        }
        return t - 1;
      });
    }, 1000);

    const cloudSpawner = setInterval(() => {
      if (gameStateRef.current !== "playing") {
        clearInterval(cloudSpawner);
        return;
      }
      spawnCloud();
    }, 2000);

    animFrameRef.current = requestAnimationFrame(gameLoop);
  }, [initMic, endGame, spawnCloud, gameLoop]);

  // Cleanup
  useEffect(() => {
    return () => {
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
      if (timerRef.current) clearInterval(timerRef.current);
      if (streamRef.current) streamRef.current.getTracks().forEach((t) => t.stop());
      if (audioCtxRef.current) audioCtxRef.current.close();
    };
  }, []);

  return (
    <div ref={containerRef} className="flex flex-col items-center w-full">
      {/* HUD */}
      <div className="w-full flex items-center justify-between mb-3 px-1">
        <div className="flex items-center gap-3 text-sm font-semibold">
          <span className="text-primary tabular-nums">Score: {Math.floor(score)}</span>
          <span className={`tabular-nums ${timeLeft <= 10 ? "text-destructive animate-pulse" : "text-muted-foreground"}`}>
            {timeLeft}s
          </span>
        </div>
        <div className="flex items-center gap-1.5 text-xs text-muted-foreground bg-muted/50 px-2.5 py-1 rounded-lg">
          <Trophy className="w-3.5 h-3.5 text-warning" />
          <span className="font-semibold">{highScore}</span>
        </div>
      </div>

      {/* Game Area */}
      <div
        className="relative w-full overflow-hidden rounded-2xl border border-border bg-gradient-to-b from-sky-100 to-sky-50 dark:from-sky-950 dark:to-slate-900"
        style={{ height: gameSize.height }}
      >
        <AnimatePresence>
          {gameState === "ready" && (
            <motion.div
              key="ready"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 flex flex-col items-center justify-center z-10 bg-background/60 backdrop-blur-sm px-6"
            >
              <div className="mb-4">
                <DragonSVG flapping={false} />
              </div>
              <h3 className="font-display font-bold text-lg mb-2">Dragon Breather</h3>
              <p className="text-sm text-muted-foreground text-center mb-4">
                Blow into your mic to make the dragon fly and dodge the clouds!
              </p>

              {/* Volume Meter */}
              <div className="w-full max-w-[200px] mb-6">
                <div className="flex justify-between text-[10px] uppercase tracking-tighter text-muted-foreground mb-1 font-bold">
                  <span>Mic Input Level</span>
                  <span className={currentVolume > MIC_THRESHOLD ? "text-success" : ""}>
                    {currentVolume > MIC_THRESHOLD ? "Trigger Active" : "Silence"}
                  </span>
                </div>
                <div className="h-1.5 w-full bg-muted rounded-full overflow-hidden">
                  <motion.div 
                    className={`h-full ${currentVolume > MIC_THRESHOLD ? 'bg-success' : 'bg-primary'}`}
                    animate={{ width: `${Math.min(100, currentVolume * 500)}%` }}
                    transition={{ type: "spring", bounce: 0, duration: 0.1 }}
                  />
                </div>
                <div className="mt-1 flex justify-between">
                  <div className="w-0.5 h-1 bg-muted-foreground/30 ml-[30%]" title="threshold marker" />
                </div>
              </div>

              {micError && (
                <p className="text-xs text-destructive mb-3 text-center">
                  Microphone access required. Please allow mic access and try again.
                </p>
              )}
              <button
                onClick={async () => {
                  if (audioCtxRef.current?.state === "suspended") {
                    await audioCtxRef.current.resume();
                  }
                  startGame();
                }}
                className="gradient-primary text-primary-foreground font-semibold px-8 py-3 rounded-xl shadow-elevated glow-button press-effect"
              >
                Start Game
              </button>
            </motion.div>
          )}

          {gameState === "gameover" && (
            <motion.div
              key="gameover"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 flex flex-col items-center justify-center z-10 bg-background/70 backdrop-blur-sm px-6"
            >
              <h3 className="font-display font-bold text-2xl mb-1">Game Over!</h3>
              <p className="text-4xl font-bold text-primary mb-1">{Math.floor(score)}</p>
              <p className="text-sm text-muted-foreground mb-1">points</p>
              {Math.floor(score) >= highScore && score > 0 && (
                <p className="text-xs font-semibold text-warning mb-4 flex items-center gap-1">
                  <Trophy className="w-3.5 h-3.5" /> New High Score!
                </p>
              )}
              {Math.floor(score) < highScore && (
                <p className="text-xs text-muted-foreground mb-4">Best: {highScore}</p>
              )}
              <div className="flex gap-3">
                <button
                  onClick={startGame}
                  className="flex items-center gap-2 gradient-primary text-primary-foreground font-semibold px-6 py-3 rounded-xl shadow-elevated press-effect"
                >
                  <RotateCcw className="w-4 h-4" />
                  Play Again
                </button>
                <button
                  onClick={onBack}
                  className="px-6 py-3 rounded-xl border border-border font-semibold text-muted-foreground press-effect"
                >
                  Menu
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Decorative background clouds */}
        <div className="absolute top-[8%] left-[10%] opacity-20">
          <CloudSVG width={60} />
        </div>
        <div className="absolute top-[25%] right-[5%] opacity-15">
          <CloudSVG width={50} />
        </div>

        {/* Obstacle clouds */}
        {clouds.map((cloud) => (
          <div
            key={cloud.id}
            className="absolute"
            style={{ left: cloud.x, top: cloud.y, transition: "none" }}
          >
            <CloudSVG width={cloud.width} />
          </div>
        ))}

        {/* Dragon */}
        {gameState === "playing" && (
          <div
            className="absolute"
            style={{ left: DRAGON_X, top: dragonY, transition: "none" }}
          >
            <DragonSVG flapping={isBlowing} />
          </div>
        )}

        {/* Blow indicator */}
        {gameState === "playing" && isBlowing && (
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2">
            <span className="text-xs font-semibold text-success bg-success/10 px-3 py-1 rounded-full">
              🔥 Blowing!
            </span>
          </div>
        )}
      </div>
    </div>
  );
};

export default DragonBreatherGame;
