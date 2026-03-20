import { motion } from "framer-motion";
import { useAuth } from "@/contexts/AuthContext";
import NotificationBell from "@/components/NotificationBell";
import type { AqiNotification } from "@/hooks/useAqiAlerts";

const getGreeting = () => {
  const hour = new Date().getHours();
  if (hour < 6) return { text: "Good Night", emoji: "🌙" };
  if (hour < 12) return { text: "Good Morning", emoji: "☀️" };
  if (hour < 17) return { text: "Good Afternoon", emoji: "🌤️" };
  if (hour < 21) return { text: "Good Evening", emoji: "🌅" };
  return { text: "Good Night", emoji: "🌙" };
};

interface GreetingHeaderProps {
  notifications?: AqiNotification[];
  unreadCount?: number;
  onMarkAsRead?: (id: string) => void;
  onMarkAllRead?: () => void;
  onClearAll?: () => void;
  aqiValue?: number | null;
}

const GreetingHeader = ({ notifications = [], unreadCount = 0, onMarkAsRead, onMarkAllRead, onClearAll, aqiValue }: GreetingHeaderProps) => {
  const { text, emoji } = getGreeting();
  const { profile, user } = useAuth();
  const displayName = profile?.full_name || user?.user_metadata?.full_name || user?.user_metadata?.name || "";
  const firstName = displayName ? displayName.split(" ")[0] : "";
  const currentDate = new Date().toLocaleDateString("en-IN", {
    weekday: "long",
    day: "numeric",
    month: "short",
  });

  const displayAqi = aqiValue ?? 42;
  const aqiColor = displayAqi < 50 ? "success" : displayAqi <= 100 ? "warning" : "destructive";

  return (
    <div className="px-5 pt-6 pb-2">
      <div className="flex items-start justify-between">
        <motion.div
          initial={{ opacity: 0, x: -10 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5 }}
        >
          <p className="text-xs text-muted-foreground font-medium tracking-wide">{currentDate}</p>
          <h1 className="text-2xl font-display font-extrabold mt-1 flex items-center gap-2">
            {text}{firstName ? `, ${firstName}` : ""}
            <motion.span
              animate={{ rotate: [0, 14, -8, 14, -4, 10, 0] }}
              transition={{ duration: 2.5, delay: 0.5 }}
              className="inline-block origin-[70%_80%]"
            >
              {emoji}
            </motion.span>
          </h1>
        </motion.div>
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.2, duration: 0.4 }}
          className="flex items-center gap-2"
        >
          <NotificationBell
            notifications={notifications}
            unreadCount={unreadCount}
            onMarkAsRead={onMarkAsRead ?? (() => {})}
            onMarkAllRead={onMarkAllRead ?? (() => {})}
            onClearAll={onClearAll ?? (() => {})}
          />
          <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-${aqiColor}/30 bg-${aqiColor}/10`}>
            <span className={`w-1.5 h-1.5 rounded-full bg-${aqiColor} animate-pulse`} />
            <span className={`text-xs font-semibold text-${aqiColor}`}>AQI {displayAqi}</span>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default GreetingHeader;
