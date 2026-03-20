import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

export interface AqiNotification {
  id: string;
  aqi_value: number;
  city_name: string;
  message: string;
  read: boolean;
  created_at: string;
}

export interface AlertPreferences {
  enabled: boolean;
  threshold: number;
}

export const useAqiAlerts = (currentAqi: number | null, cityName: string | null) => {
  const { user } = useAuth();
  const [preferences, setPreferences] = useState<AlertPreferences>({ enabled: true, threshold: 150 });
  const [notifications, setNotifications] = useState<AqiNotification[]>([]);
  const [showAlert, setShowAlert] = useState(false);
  const [alertDismissed, setAlertDismissed] = useState(false);

  // Fetch preferences
  useEffect(() => {
    if (!user) return;
    const fetch = async () => {
      const { data } = await supabase
        .from("aqi_alert_preferences")
        .select("enabled, threshold")
        .eq("user_id", user.id)
        .single();
      if (data) setPreferences(data);
    };
    fetch();
  }, [user]);

  // Fetch notifications
  const fetchNotifications = useCallback(async () => {
    if (!user) return;
    const { data } = await supabase
      .from("aqi_notifications")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(20);
    if (data) setNotifications(data as AqiNotification[]);
  }, [user]);

  useEffect(() => { fetchNotifications(); }, [fetchNotifications]);

  // Check AQI and trigger alert
  useEffect(() => {
    if (!user || !preferences.enabled || currentAqi === null || alertDismissed) return;
    if (currentAqi >= preferences.threshold) {
      setShowAlert(true);
      // Save notification to DB (deduplicate within 1 hour)
      const saveNotification = async () => {
        const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString();
        const { data: existing } = await supabase
          .from("aqi_notifications")
          .select("id")
          .eq("user_id", user.id)
          .gte("created_at", oneHourAgo)
          .limit(1);
        if (!existing || existing.length === 0) {
          const level = currentAqi >= 300 ? "Hazardous" : currentAqi >= 200 ? "Very Unhealthy" : "Unhealthy";
          await supabase.from("aqi_notifications").insert({
            user_id: user.id,
            aqi_value: currentAqi,
            city_name: cityName ?? "Unknown",
            message: `⚠️ AQI has reached ${currentAqi} (${level}) in ${cityName ?? "your area"}. Consider staying indoors and wearing a mask if going outside.`,
          });
          fetchNotifications();
        }
      };
      saveNotification();
    } else {
      setShowAlert(false);
    }
  }, [currentAqi, preferences, user, alertDismissed, cityName, fetchNotifications]);

  const dismissAlert = () => {
    setAlertDismissed(true);
    setShowAlert(false);
  };

  const updatePreferences = async (newPrefs: Partial<AlertPreferences>) => {
    if (!user) return;
    const updated = { ...preferences, ...newPrefs };
    setPreferences(updated);
    await supabase.from("aqi_alert_preferences").upsert({
      user_id: user.id,
      enabled: updated.enabled,
      threshold: updated.threshold,
    }, { onConflict: "user_id" });
  };

  const markAsRead = async (id: string) => {
    await supabase.from("aqi_notifications").update({ read: true }).eq("id", id);
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
  };

  const markAllRead = async () => {
    if (!user) return;
    await supabase.from("aqi_notifications").update({ read: true }).eq("user_id", user.id).eq("read", false);
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
  };

  const clearAll = async () => {
    if (!user) return;
    await supabase.from("aqi_notifications").delete().eq("user_id", user.id);
    setNotifications([]);
  };

  const unreadCount = notifications.filter(n => !n.read).length;

  return {
    preferences,
    notifications,
    showAlert,
    unreadCount,
    dismissAlert,
    updatePreferences,
    markAsRead,
    markAllRead,
    clearAll,
    fetchNotifications,
  };
};
