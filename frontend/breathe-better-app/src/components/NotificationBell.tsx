import { Bell, Check, Trash2, X } from "lucide-react";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import type { AqiNotification } from "@/hooks/useAqiAlerts";

interface NotificationBellProps {
  notifications: AqiNotification[];
  unreadCount: number;
  onMarkAsRead: (id: string) => void;
  onMarkAllRead: () => void;
  onClearAll: () => void;
}

const NotificationBell = ({ notifications, unreadCount, onMarkAsRead, onMarkAllRead, onClearAll }: NotificationBellProps) => {
  const [open, setOpen] = useState(false);

  return (
    <div className="relative">
      <button onClick={() => setOpen(!open)} className="relative p-2 rounded-xl hover:bg-white/5 transition">
        <Bell className="w-5 h-5 text-muted-foreground" />
        {unreadCount > 0 && (
          <motion.span
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            className="absolute -top-0.5 -right-0.5 w-4.5 h-4.5 min-w-[18px] flex items-center justify-center text-[10px] font-bold bg-destructive text-destructive-foreground rounded-full"
          >
            {unreadCount}
          </motion.span>
        )}
      </button>

      <AnimatePresence>
        {open && (
          <>
            <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
            <motion.div
              initial={{ opacity: 0, y: -10, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -10, scale: 0.95 }}
              className="absolute right-0 top-12 z-50 w-80 max-h-96 overflow-y-auto rounded-2xl border border-white/10 shadow-elevated"
              style={{ background: "rgba(11,18,32,0.95)", backdropFilter: "blur(20px)" }}
            >
              <div className="flex items-center justify-between p-4 border-b border-white/5">
                <h3 className="text-sm font-semibold">Notifications</h3>
                <div className="flex gap-1">
                  {unreadCount > 0 && (
                    <button onClick={onMarkAllRead} className="p-1.5 rounded-lg hover:bg-white/5 transition" title="Mark all read">
                      <Check className="w-3.5 h-3.5 text-muted-foreground" />
                    </button>
                  )}
                  {notifications.length > 0 && (
                    <button onClick={onClearAll} className="p-1.5 rounded-lg hover:bg-white/5 transition" title="Clear all">
                      <Trash2 className="w-3.5 h-3.5 text-muted-foreground" />
                    </button>
                  )}
                  <button onClick={() => setOpen(false)} className="p-1.5 rounded-lg hover:bg-white/5 transition">
                    <X className="w-3.5 h-3.5 text-muted-foreground" />
                  </button>
                </div>
              </div>

              {notifications.length === 0 ? (
                <div className="p-6 text-center">
                  <Bell className="w-8 h-8 text-muted-foreground/30 mx-auto mb-2" />
                  <p className="text-xs text-muted-foreground">No notifications yet</p>
                </div>
              ) : (
                <div className="divide-y divide-white/5">
                  {notifications.map((n) => (
                    <button
                      key={n.id}
                      onClick={() => onMarkAsRead(n.id)}
                      className={`w-full text-left p-4 hover:bg-white/5 transition ${!n.read ? "bg-primary/5" : ""}`}
                    >
                      <div className="flex items-start gap-2">
                        {!n.read && <span className="w-2 h-2 rounded-full bg-primary mt-1.5 shrink-0" />}
                        <div className={!n.read ? "" : "pl-4"}>
                          <p className="text-xs text-foreground/80">{n.message}</p>
                          <p className="text-[10px] text-muted-foreground mt-1">
                            {new Date(n.created_at).toLocaleString()}
                          </p>
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
};

export default NotificationBell;
