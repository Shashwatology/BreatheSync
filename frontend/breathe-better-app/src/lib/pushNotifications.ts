import { PushNotifications } from "@capacitor/push-notifications";
import { Capacitor } from "@capacitor/core";

export const initPushNotifications = async () => {
  if (!Capacitor.isNativePlatform()) {
    console.log("Push notifications only available on native platforms");
    return null;
  }

  // Request permission
  const permResult = await PushNotifications.requestPermissions();
  if (permResult.receive !== "granted") {
    console.warn("Push notification permission not granted");
    return null;
  }

  // Register for push
  await PushNotifications.register();

  // Listen for registration token
  PushNotifications.addListener("registration", (token) => {
    console.log("Push registration token:", token.value);
    // TODO: Send token to backend for storing per-user
    localStorage.setItem("pushToken", token.value);
  });

  PushNotifications.addListener("registrationError", (error) => {
    console.error("Push registration error:", error);
  });

  // Handle received notifications (foreground)
  PushNotifications.addListener("pushNotificationReceived", (notification) => {
    console.log("Push notification received:", notification);
  });

  // Handle notification tap (opens app)
  PushNotifications.addListener("pushNotificationActionPerformed", (action) => {
    console.log("Push notification action:", action);
    const data = action.notification.data;
    if (data?.route) {
      window.location.href = data.route;
    }
  });

  return true;
};

export const scheduleLocalReminder = async (title: string, body: string) => {
  // For local notifications on native, we'd use @capacitor/local-notifications
  // For now, log the intent — push notifications will be sent server-side
  console.log("Reminder scheduled:", { title, body });
};

// Notification preference types
export interface NotificationPreferences {
  breathingReminders: boolean;
  medicationReminders: boolean;
  dailyCheckIn: boolean;
  breathingTime: string; // HH:MM format
  medicationTimes: string[]; // array of HH:MM
}

export const defaultNotificationPrefs: NotificationPreferences = {
  breathingReminders: true,
  medicationReminders: true,
  dailyCheckIn: true,
  breathingTime: "09:00",
  medicationTimes: ["08:00", "18:00"],
};

export const getNotificationPrefs = (): NotificationPreferences => {
  const saved = localStorage.getItem("notificationPrefs");
  return saved ? JSON.parse(saved) : defaultNotificationPrefs;
};

export const saveNotificationPrefs = (prefs: NotificationPreferences) => {
  localStorage.setItem("notificationPrefs", JSON.stringify(prefs));
};
