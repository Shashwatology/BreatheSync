import { ArrowLeft, Bell, Clock, Shield, Wind, Pill, Activity, AlertTriangle, Save } from "lucide-react";
import { Link } from "react-router-dom";
import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import AppLayout from "@/components/AppLayout";
import { Switch } from "@/components/ui/switch";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface NotifPrefs {
  medication_reminders: boolean;
  breathing_reminders: boolean;
  aqi_alerts: boolean;
  travel_safe_alerts: boolean;
  medication_time: string;
  breathing_time: string;
  aqi_threshold: number;
}

const defaultPrefs: NotifPrefs = {
  medication_reminders: true,
  breathing_reminders: true,
  aqi_alerts: true,
  travel_safe_alerts: false,
  medication_time: "08:00",
  breathing_time: "07:00",
  aqi_threshold: 150,
};

const thresholdOptions = [
  { value: 50, label: "50 (Strict)", color: "text-success" },
  { value: 100, label: "100 (Moderate)", color: "text-accent" },
  { value: 150, label: "150 (Standard)", color: "text-warning" },
  { value: 200, label: "200 (Relaxed)", color: "text-destructive" },
];

const NotificationSettings = () => {
  const { user } = useAuth();
  const [prefs, setPrefs] = useState<NotifPrefs>(defaultPrefs);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [hasRecord, setHasRecord] = useState(false);

  useEffect(() => {
    if (!user) return;
    const fetch = async () => {
      setLoading(true);
      const { data } = await supabase
        .from("notification_preferences")
        .select("*")
        .eq("user_id", user.id)
        .maybeSingle();

      if (data) {
        setPrefs({
          medication_reminders: data.medication_reminders,
          breathing_reminders: data.breathing_reminders,
          aqi_alerts: data.aqi_alerts,
          travel_safe_alerts: data.travel_safe_alerts,
          medication_time: data.medication_time,
          breathing_time: data.breathing_time,
          aqi_threshold: data.aqi_threshold,
        });
        setHasRecord(true);
      }
      setLoading(false);
    };
    fetch();
  }, [user]);

  const handleSave = async () => {
    if (!user) return;
    setSaving(true);

    const payload = { ...prefs, user_id: user.id };

    let error;
    if (hasRecord) {
      ({ error } = await supabase
        .from("notification_preferences")
        .update(prefs)
        .eq("user_id", user.id));
    } else {
      ({ error } = await supabase
        .from("notification_preferences")
        .insert(payload));
      if (!error) setHasRecord(true);
    }

    setSaving(false);
    if (error) {
      toast.error("Failed to save preferences");
      console.error(error);
    } else {
      toast.success("Notification preferences saved!");
    }
  };

  const update = <K extends keyof NotifPrefs>(key: K, value: NotifPrefs[K]) => {
    setPrefs((p) => ({ ...p, [key]: value }));
  };

  const Toggle = ({
    icon: Icon,
    iconColor,
    label,
    description,
    checked,
    onChange,
    children,
  }: {
    icon: any;
    iconColor: string;
    label: string;
    description: string;
    checked: boolean;
    onChange: (v: boolean) => void;
    children?: React.ReactNode;
  }) => (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="glass-card !p-4 space-y-3"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-3">
          <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${iconColor}`}>
            <Icon className="w-4.5 h-4.5" />
          </div>
          <div>
            <p className="text-sm font-semibold">{label}</p>
            <p className="text-[11px] text-muted-foreground mt-0.5">{description}</p>
          </div>
        </div>
        <Switch checked={checked} onCheckedChange={onChange} />
      </div>
      {checked && children && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: "auto" }}
          exit={{ opacity: 0, height: 0 }}
          className="pl-12"
        >
          {children}
        </motion.div>
      )}
    </motion.div>
  );

  if (loading) {
    return (
      <AppLayout>
        <div className="px-5 pt-6 pb-6 space-y-4">
          <div className="shimmer h-10 rounded-xl" />
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="shimmer h-24 rounded-2xl" />
          ))}
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="px-5 pt-6 pb-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <Link to="/profile" className="p-2 rounded-xl bg-muted hover:bg-muted/80 transition">
              <ArrowLeft className="w-5 h-5" />
            </Link>
            <div>
              <h1 className="text-xl font-display font-bold">Notifications</h1>
              <p className="text-[11px] text-muted-foreground">Manage your alerts & reminders</p>
            </div>
          </div>
          <button
            onClick={handleSave}
            disabled={saving}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium gradient-primary text-primary-foreground press-effect disabled:opacity-50"
          >
            <Save className="w-3.5 h-3.5" />
            {saving ? "Saving..." : "Save"}
          </button>
        </div>

        <div className="space-y-3">
          {/* Medication Reminders */}
          <Toggle
            icon={Pill}
            iconColor="bg-primary/15 text-primary"
            label="Medication Reminders"
            description="Get reminded to take your asthma medications on time"
            checked={prefs.medication_reminders}
            onChange={(v) => update("medication_reminders", v)}
          >
            <div className="flex items-center gap-2">
              <Clock className="w-3.5 h-3.5 text-muted-foreground" />
              <span className="text-xs text-muted-foreground">Remind at</span>
              <input
                type="time"
                value={prefs.medication_time}
                onChange={(e) => update("medication_time", e.target.value)}
                className="text-xs bg-muted rounded-lg px-2.5 py-1.5 border-none outline-none focus:ring-2 focus:ring-primary/30 text-foreground"
              />
              <span className="text-[10px] text-muted-foreground">daily</span>
            </div>
          </Toggle>

          {/* Breathing Reminders */}
          <Toggle
            icon={Activity}
            iconColor="bg-success/15 text-success"
            label="Breathing Exercise Reminders"
            description="Daily reminders to practice breathing exercises"
            checked={prefs.breathing_reminders}
            onChange={(v) => update("breathing_reminders", v)}
          >
            <div className="flex items-center gap-2">
              <Clock className="w-3.5 h-3.5 text-muted-foreground" />
              <span className="text-xs text-muted-foreground">Remind at</span>
              <input
                type="time"
                value={prefs.breathing_time}
                onChange={(e) => update("breathing_time", e.target.value)}
                className="text-xs bg-muted rounded-lg px-2.5 py-1.5 border-none outline-none focus:ring-2 focus:ring-primary/30 text-foreground"
              />
              <span className="text-[10px] text-muted-foreground">daily</span>
            </div>
          </Toggle>

          {/* AQI Alerts */}
          <Toggle
            icon={Wind}
            iconColor="bg-warning/15 text-warning"
            label="Air Quality Alerts"
            description="Get notified when AQI exceeds your safety threshold"
            checked={prefs.aqi_alerts}
            onChange={(v) => update("aqi_alerts", v)}
          >
            <div className="space-y-2">
              <p className="text-[11px] text-muted-foreground">Alert when AQI exceeds:</p>
              <div className="flex flex-wrap gap-1.5">
                {thresholdOptions.map((opt) => (
                  <button
                    key={opt.value}
                    onClick={() => update("aqi_threshold", opt.value)}
                    className={`px-3 py-1.5 rounded-full text-[11px] font-medium transition-all press-effect ${
                      prefs.aqi_threshold === opt.value
                        ? "gradient-primary text-primary-foreground shadow-glow"
                        : "bg-muted text-muted-foreground hover:bg-muted/80"
                    }`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>
          </Toggle>

          {/* Travel Safe Alerts */}
          <Toggle
            icon={Shield}
            iconColor="bg-accent/15 text-accent"
            label="Travel Safe Alerts"
            description="Get proactive alerts about air quality at your saved destinations"
            checked={prefs.travel_safe_alerts}
            onChange={(v) => update("travel_safe_alerts", v)}
          />

          {/* Info card */}
          <div className="glass-card !p-4 border-primary/10 mt-4">
            <div className="flex items-start gap-2.5">
              <AlertTriangle className="w-4 h-4 text-muted-foreground mt-0.5 shrink-0" />
              <div>
                <p className="text-xs text-muted-foreground">
                  Push notifications require the native app (APK/IPA). In-app alerts work in the browser preview. 
                  Changes are saved to your account and sync across devices.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </AppLayout>
  );
};

export default NotificationSettings;
