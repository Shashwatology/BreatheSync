import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { BrainCircuit, AlertTriangle, ShieldCheck, Activity } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";

interface ForecastData {
  probability_percent: number;
  forecast_window_hours: number;
  primary_factor: string;
  alert_message: string;
  recommended_action: string;
}

export default function DigitalTwinPredictor({ currentAqi, cityName }: { currentAqi: number | null, cityName: string | null }) {
  const { profile } = useAuth();
  const [data, setData] = useState<ForecastData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchForecast = async () => {
      if (!cityName) return;
      
      setLoading(true);
      try {
        // Mock triggers payload that would normally be fetched from the DB
        const triggers = "dust,pollen,cold air";
        // Mock historical user score
        const avgScore = 78;

        const res = await fetch(`http://localhost:8000/api/environment/digital-twin-forecast?city=${cityName}&history_score=${avgScore}&reported_triggers=${triggers}`);
        const forecast = await res.json();
        setData(forecast);
      } catch (error) {
        console.error("Failed to fetch digital twin forecast", error);
      } finally {
        setLoading(false);
      }
    };

    fetchForecast();
  }, [currentAqi, cityName]);

  if (loading || !data) {
    return (
      <div className="glass-card animate-pulse p-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <BrainCircuit className="w-5 h-5 text-muted-foreground/50" />
          <div className="h-4 w-32 bg-muted-foreground/20 rounded"></div>
        </div>
      </div>
    );
  }

  const isHighRisk = data.probability_percent > 65;
  const isModerateRisk = data.probability_percent > 35;

  const bgStyle = isHighRisk 
    ? "from-destructive/10 to-destructive/5 border-destructive/20" 
    : isModerateRisk 
      ? "from-warning/10 to-warning/5 border-warning/20"
      : "from-success/10 to-success/5 border-success/20";
      
  const textStyle = isHighRisk 
    ? "text-destructive" 
    : isModerateRisk 
      ? "text-warning"
      : "text-success";

  return (
    <motion.div 
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className={`glass-card overflow-hidden relative bg-gradient-to-br ${bgStyle} border backdrop-blur-md !p-0`}
    >
      <div className="p-4 border-b border-white/5 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <BrainCircuit className={`w-4 h-4 ${textStyle}`} />
          <h3 className="text-xs font-bold uppercase tracking-wider text-foreground/80">
            Digital Twin Forecast
          </h3>
        </div>
        <span className="text-[10px] text-muted-foreground bg-muted/50 px-2 py-0.5 rounded-full">
          {data.forecast_window_hours}HR
        </span>
      </div>

      <div className="p-4 flex gap-4">
        {/* Probability Score */}
        <div className="flex flex-col items-center justify-center min-w-[3.5rem]">
          <div className="relative flex items-center justify-center w-14 h-14">
            <svg className="w-14 h-14 transform -rotate-90">
              <circle
                cx="28"
                cy="28"
                r="24"
                stroke="currentColor"
                strokeWidth="4"
                fill="transparent"
                className="text-muted/30"
              />
              <motion.circle
                cx="28"
                cy="28"
                r="24"
                stroke="currentColor"
                strokeWidth="4"
                fill="transparent"
                strokeDasharray="150"
                strokeDashoffset={150 - (150 * data.probability_percent) / 100}
                className={textStyle}
                style={{ strokeLinecap: "round" }}
                initial={{ strokeDashoffset: 150 }}
                animate={{ strokeDashoffset: 150 - (150 * data.probability_percent) / 100 }}
                transition={{ duration: 1.5, ease: "easeOut" }}
              />
            </svg>
            <div className="absolute flex flex-col items-center">
              <span className={`text-base font-bold font-display ${textStyle}`}>
                {data.probability_percent}%
              </span>
            </div>
          </div>
          <span className="text-[9px] uppercase tracking-wider mt-1 text-muted-foreground/80 text-center leading-tight">
            Attack<br/>Risk
          </span>
        </div>

        {/* Predictive Logic */}
        <div className="flex-1 flex flex-col justify-center">
          <div className="flex items-start gap-1.5 mb-1.5">
            {isHighRisk ? (
              <AlertTriangle className="w-3.5 h-3.5 mt-0.5 text-destructive shrink-0" />
            ) : isModerateRisk ? (
              <Activity className="w-3.5 h-3.5 mt-0.5 text-warning shrink-0" />
            ) : (
              <ShieldCheck className="w-3.5 h-3.5 mt-0.5 text-success shrink-0" />
            )}
            <p className="text-sm font-medium leading-tight text-foreground/90">
              {data.alert_message}
            </p>
          </div>
          
          <div className="bg-background/50 rounded-lg p-2 mt-2 border border-white/5">
            <p className="text-[11px] font-medium text-muted-foreground flex items-center gap-1.5">
              <span className="w-1 h-1 rounded-full bg-primary" />
              <span className="opacity-70">AI Suggests:</span> {data.recommended_action}
            </p>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
