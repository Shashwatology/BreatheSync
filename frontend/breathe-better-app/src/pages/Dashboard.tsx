import { useState, useCallback } from "react";
import { Wind, Mic, Activity, Pill, Droplets, Flame, Heart, Sparkles, TrendingUp, Bluetooth, Moon } from "lucide-react";
import { Link, useSearchParams, Navigate } from "react-router-dom";
import { motion } from "framer-motion";
import AppLayout from "@/components/AppLayout";
import BreathVisualization from "@/components/BreathVisualization";
import StatCard from "@/components/StatCard";
import EnvironmentalTrend from "@/components/EnvironmentalTrend";
import GreetingHeader from "@/components/GreetingHeader";
import HealthTipCarousel from "@/components/HealthTipCarousel";
import WeeklyProgress from "@/components/WeeklyProgress";
import AqiAlertBanner from "@/components/AqiAlertBanner";
import WelcomeOverlay from "@/components/WelcomeOverlay";
import HistoryIntake from "@/components/HistoryIntake";
import DigitalTwinPredictor from "@/components/DigitalTwinPredictor";
import { useEnvData } from "@/hooks/useEnvData";
import { useAqiAlerts } from "@/hooks/useAqiAlerts";
import { useAuth } from "@/contexts/AuthContext";

const container = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.08 },
  },
};

const item = {
  hidden: { opacity: 0, y: 16 },
  show: { opacity: 1, y: 0, transition: { duration: 0.45, ease: "easeOut" as const } },
};

const scoreValue = 78;

const getScoreGlowColor = (score: number) => {
  if (score >= 70) return { color: "var(--success)", label: "success" };
  if (score >= 50) return { color: "var(--warning)", label: "warning" };
  return { color: "var(--danger)", label: "danger" };
};

const Dashboard = () => {
  const { user, profile, loading: authLoading } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  const isWelcome = searchParams.get("welcome") === "true";
  const [showWelcome, setShowWelcome] = useState(isWelcome);

  // Mock trend data for the last 24 hours of AQI (stable to slightly worsening)
  const aqiTrend = [45, 48, 50, 55, 60, 58, 62, 65, 70, 68, 72, 75];

  const glow = getScoreGlowColor(scoreValue);
  const { data, loading } = useEnvData();

  const aqiValue = data?.aqi ?? null;
  const temp = data?.weather?.temp ?? null;

  const {
    notifications,
    unreadCount,
    showAlert,
    dismissAlert,
    markAsRead,
    markAllRead,
    clearAll,
  } = useAqiAlerts(aqiValue, data?.cityName ?? null);

  const displayName = profile?.full_name || user?.user_metadata?.full_name || user?.user_metadata?.name || "there";

  const handleWelcomeComplete = useCallback(() => {
    setShowWelcome(false);
    setSearchParams({}, { replace: true });
  }, [setSearchParams]);

  if (authLoading) return null;
  if (!user) return <Navigate to="/login" replace />;

  return (
    <>
      {showWelcome && (
        <WelcomeOverlay name={displayName} onComplete={handleWelcomeComplete} />
      )}
      <AppLayout>
        <GreetingHeader
          notifications={notifications}
          unreadCount={unreadCount}
          onMarkAsRead={markAsRead}
          onMarkAllRead={markAllRead}
          onClearAll={clearAll}
          aqiValue={aqiValue}
        />

        <AqiAlertBanner
          aqi={aqiValue ?? 0}
          cityName={data?.cityName ?? ""}
          show={showAlert}
          onDismiss={dismissAlert}
        />

        <motion.div
          variants={container}
          initial="hidden"
          animate="show"
          className="px-5 space-y-4 pb-6"
        >
          {/* Lung Voice Score — Hero Card */}
          <motion.div variants={item} className="glass-card text-center relative overflow-hidden">
            <motion.div
              className="absolute -top-20 left-1/2 -translate-x-1/2 w-60 h-60 rounded-full pointer-events-none"
              style={{ background: `radial-gradient(circle, hsl(${glow.color} / 0.15) 0%, transparent 70%)` }}
              animate={{ scale: [1, 1.2, 1], opacity: [0.4, 0.7, 0.4] }}
              transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
            />

            <div className="relative">
              <div className="flex items-center justify-center gap-2 mb-4">
                <Sparkles className="w-3.5 h-3.5 text-primary/60" />
                <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Lung Voice Score
                </h3>
                <Sparkles className="w-3.5 h-3.5 text-primary/60" />
              </div>
              <BreathVisualization score={scoreValue} />
              <div className="flex items-center justify-center gap-1.5 mt-2">
                <TrendingUp className="w-3.5 h-3.5 text-success" />
                <span className="text-xs font-semibold text-success">↑5 from yesterday</span>
              </div>
              <p className="text-xs text-muted-foreground mt-2 flex items-center justify-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-success animate-pulse" />
                Last checked: 2 hours ago
              </p>
              <Link
                to="/voice-check"
                className="glow-button press-effect inline-flex items-center gap-2 gradient-primary text-primary-foreground font-semibold px-6 py-3 rounded-xl mt-5 text-sm shadow-elevated"
              >
                <motion.div
                  animate={{ scale: [1, 1.2, 1] }}
                  transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                >
                  <Mic className="w-4 h-4" />
                </motion.div>
                Start Voice Check
              </Link>
            </div>
          </motion.div>

          {/* Digital Twin Forecast Component */}
          <motion.div variants={item}>
            <DigitalTwinPredictor currentAqi={aqiValue} cityName={data?.cityName ?? "Delhi"} />
          </motion.div>

          {/* Health Tip Carousel */}
          <motion.div variants={item}>
            <HealthTipCarousel />
          </motion.div>

          {/* Stat Grid */}
          <motion.div variants={item} className="grid grid-cols-2 gap-3">
            <StatCard icon={Wind} title="Breathing" value="3" subtitle="15 min today" variant="success">
              <div className="flex items-center gap-1 mt-2">
                <Flame className="w-3.5 h-3.5 text-warning" />
                <span className="text-[11px] font-semibold text-warning">7 day streak 🔥</span>
              </div>
            </StatCard>
            <Link to="/trigger-map">
              <StatCard
                icon={Activity}
                title="Risk Level"
                value={loading ? "..." : aqiValue !== null && aqiValue < 50 ? "Low" : aqiValue !== null && aqiValue <= 100 ? "Mod" : aqiValue !== null ? "High" : "--"}
                subtitle={loading ? "Loading..." : `AQI ${aqiValue ?? "--"} · ${temp ?? "--"}°C`}
                variant={aqiValue !== null && aqiValue < 50 ? "success" : aqiValue !== null && aqiValue <= 100 ? "default" : "default"}
              >
                {!loading && (
                    <EnvironmentalTrend 
                        data={aqiTrend} 
                        color={aqiValue !== null && aqiValue < 50 ? "hsl(142 71% 45%)" : aqiValue !== null && aqiValue <= 100 ? "hsl(38 92% 50%)" : "hsl(0 84% 60%)"} 
                    />
                )}
              </StatCard>
            </Link>
            <StatCard icon={Pill} title="Medication" value="86%" subtitle="Next: 6:00 PM" variant="default" />
            <StatCard icon={Droplets} title="Gut Health" value="Good" subtitle="3 foods logged" variant="success" />
          </motion.div>

          {/* Live Sensors */}
          <motion.div variants={item}>
            <div className="glass-card !p-4">
              <div className="flex items-center gap-2 mb-2">
                <div className="p-1.5 rounded-lg bg-primary/10">
                  <Bluetooth className="w-3.5 h-3.5 text-primary" />
                </div>
                <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Live Sensors</span>
              </div>
              <div className="flex items-center justify-between text-sm font-mono text-foreground/70">
                <span>VOC: <span className="text-muted-foreground">--</span></span>
                <span className="text-muted-foreground/30">|</span>
                <span>SpO2: <span className="text-muted-foreground">--</span></span>
                <span className="text-muted-foreground/30">|</span>
                <span>HR: <span className="text-muted-foreground">--</span></span>
              </div>
              <p className="text-[11px] text-muted-foreground mt-2">Connect device to see live data</p>
            </div>
          </motion.div>

          {/* Weekly Progress */}
          <motion.div variants={item}>
            <WeeklyProgress />
          </motion.div>

          {/* Quick Actions */}
          <motion.div variants={item}>
            <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3">
              Quick Actions
            </h3>
            <div className="grid grid-cols-2 gap-3 mb-4">
              <Link to="/lung-gym" className="glass-card hover-lift press-effect flex items-center gap-3 !p-4 group">
                <div className="p-2.5 rounded-xl bg-success/10 group-hover:bg-success/20 transition-colors">
                  <Wind className="w-5 h-5 text-success" />
                </div>
                <div>
                  <p className="text-sm font-semibold">Lung Gym</p>
                  <p className="text-[11px] text-muted-foreground">Start session</p>
                </div>
              </Link>
              <Link to="/gut-health" className="glass-card hover-lift press-effect flex items-center gap-3 !p-4 group">
                <div className="p-2.5 rounded-xl bg-accent/10 group-hover:bg-accent/20 transition-colors">
                  <Heart className="w-5 h-5 text-accent" />
                </div>
                <div>
                  <p className="text-sm font-semibold">Gut Health</p>
                  <p className="text-[11px] text-muted-foreground">Log food</p>
                </div>
              </Link>
              <Link to="/sleep-mode" className="glass-card hover-lift press-effect flex items-center gap-3 !p-4 group col-span-2 border-indigo-500/30 bg-indigo-500/5">
                <div className="p-2.5 rounded-xl bg-indigo-500/20 group-hover:bg-indigo-500/30 transition-colors">
                  <Moon className="w-5 h-5 text-indigo-400" />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-semibold text-indigo-100">Sleep Mode</p>
                  <p className="text-[11px] text-indigo-300">Acoustic Radar Monitoring</p>
                </div>
                <div className="w-2 h-2 rounded-full bg-indigo-500 animate-pulse" />
              </Link>
            </div>
            
            {/* Daily History Intake */}
            <HistoryIntake />
          </motion.div>

          <motion.div variants={item} className="text-center pt-2 pb-2">
            <p className="text-xs text-muted-foreground/60 italic">
              "Every breath is a step towards better health" 💙
            </p>
          </motion.div>
        </motion.div>
      </AppLayout>
    </>
  );
};

export default Dashboard;
