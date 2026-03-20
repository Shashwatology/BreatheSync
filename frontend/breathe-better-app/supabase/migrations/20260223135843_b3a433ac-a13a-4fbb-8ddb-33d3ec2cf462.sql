
-- Create notification preferences table
CREATE TABLE public.notification_preferences (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  -- Notification types
  medication_reminders BOOLEAN NOT NULL DEFAULT true,
  breathing_reminders BOOLEAN NOT NULL DEFAULT true,
  aqi_alerts BOOLEAN NOT NULL DEFAULT true,
  travel_safe_alerts BOOLEAN NOT NULL DEFAULT false,
  -- Custom times (stored as HH:MM strings)
  medication_time TEXT NOT NULL DEFAULT '08:00',
  breathing_time TEXT NOT NULL DEFAULT '07:00',
  -- AQI threshold
  aqi_threshold INTEGER NOT NULL DEFAULT 150,
  -- Metadata
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id)
);

ALTER TABLE public.notification_preferences ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own notification preferences"
  ON public.notification_preferences FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own notification preferences"
  ON public.notification_preferences FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own notification preferences"
  ON public.notification_preferences FOR UPDATE
  USING (auth.uid() = user_id);

CREATE TRIGGER update_notification_preferences_updated_at
  BEFORE UPDATE ON public.notification_preferences
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();
