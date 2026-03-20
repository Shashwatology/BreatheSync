import { motion } from "framer-motion";

const days = ["M", "T", "W", "T", "F", "S", "S"];
const data = [65, 72, 0, 85, 78, 90, 0]; // 0 = not done

const WeeklyProgress = () => {
  const todayIndex = new Date().getDay(); // 0=Sun
  const adjustedToday = todayIndex === 0 ? 6 : todayIndex - 1; // Mon=0

  return (
    <div className="glass-card !p-4">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">This Week</h3>
        <span className="text-xs text-success font-medium">5/7 days</span>
      </div>
      <div className="flex items-end justify-between gap-1.5">
        {days.map((day, i) => {
          const value = data[i];
          const isToday = i === adjustedToday;
          const height = value ? Math.max(20, (value / 100) * 48) : 8;

          return (
            <div key={i} className="flex flex-col items-center gap-1.5 flex-1">
              <motion.div
                initial={{ height: 0 }}
                animate={{ height }}
                transition={{ delay: i * 0.08, duration: 0.5, ease: "easeOut" }}
                className={`w-full max-w-[28px] rounded-lg transition-colors ${
                  value > 0
                    ? isToday
                      ? "bg-gradient-to-t from-primary to-sky-400"
                      : "bg-primary/40"
                    : "bg-white/5"
                }`}
              />
              <span
                className={`text-[10px] font-medium ${
                  isToday ? "text-primary" : "text-muted-foreground"
                }`}
              >
                {day}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default WeeklyProgress;
