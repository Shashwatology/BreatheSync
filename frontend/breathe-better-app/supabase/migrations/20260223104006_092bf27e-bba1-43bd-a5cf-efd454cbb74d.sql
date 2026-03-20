
-- Table for user AQI alert preferences
CREATE TABLE public.aqi_alert_preferences (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  enabled BOOLEAN NOT NULL DEFAULT true,
  threshold INTEGER NOT NULL DEFAULT 150,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id)
);

-- Table for notification history
CREATE TABLE public.aqi_notifications (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  aqi_value INTEGER NOT NULL,
  city_name TEXT NOT NULL,
  message TEXT NOT NULL,
  read BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.aqi_alert_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.aqi_notifications ENABLE ROW LEVEL SECURITY;

-- RLS policies for alert preferences
CREATE POLICY "Users can view their own alert preferences"
  ON public.aqi_alert_preferences FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own alert preferences"
  ON public.aqi_alert_preferences FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own alert preferences"
  ON public.aqi_alert_preferences FOR UPDATE USING (auth.uid() = user_id);

-- RLS policies for notifications
CREATE POLICY "Users can view their own notifications"
  ON public.aqi_notifications FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own notifications"
  ON public.aqi_notifications FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own notifications"
  ON public.aqi_notifications FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own notifications"
  ON public.aqi_notifications FOR DELETE USING (auth.uid() = user_id);

-- Trigger for updated_at
CREATE TRIGGER update_aqi_alert_preferences_updated_at
  BEFORE UPDATE ON public.aqi_alert_preferences
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();
