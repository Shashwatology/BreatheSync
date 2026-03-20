import { AlertTriangle, X, Shield } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface AqiAlertBannerProps {
  aqi: number;
  cityName: string;
  show: boolean;
  onDismiss: () => void;
}

const getAlertLevel = (aqi: number) => {
  if (aqi >= 300) return { label: "Hazardous", bg: "bg-destructive/20", border: "border-destructive/40", text: "text-destructive" };
  if (aqi >= 200) return { label: "Very Unhealthy", bg: "bg-destructive/15", border: "border-destructive/30", text: "text-destructive" };
  return { label: "Unhealthy", bg: "bg-warning/15", border: "border-warning/30", text: "text-warning" };
};

const AqiAlertBanner = ({ aqi, cityName, show, onDismiss }: AqiAlertBannerProps) => {
  const level = getAlertLevel(aqi);

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          initial={{ opacity: 0, y: -20, height: 0 }}
          animate={{ opacity: 1, y: 0, height: "auto" }}
          exit={{ opacity: 0, y: -20, height: 0 }}
          className={`mx-5 mb-3 rounded-2xl border ${level.border} ${level.bg} p-4 relative overflow-hidden`}
        >
          <button onClick={onDismiss} className="absolute top-3 right-3 p-1 rounded-full hover:bg-white/10 transition">
            <X className="w-4 h-4 text-muted-foreground" />
          </button>
          <div className="flex items-start gap-3">
            <div className={`p-2 rounded-xl ${level.bg}`}>
              <AlertTriangle className={`w-5 h-5 ${level.text}`} />
            </div>
            <div className="flex-1 pr-6">
              <p className={`text-sm font-semibold ${level.text}`}>
                {level.label} Air Quality — AQI {aqi}
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                {cityName} · Consider staying indoors and wearing a mask if going outside.
              </p>
              <div className="flex items-center gap-1.5 mt-2">
                <Shield className="w-3 h-3 text-primary" />
                <span className="text-[11px] text-primary font-medium">Protection recommended</span>
              </div>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default AqiAlertBanner;
