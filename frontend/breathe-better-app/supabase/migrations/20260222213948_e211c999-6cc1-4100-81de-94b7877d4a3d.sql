
-- Create high_scores table for Dragon Breather game
CREATE TABLE public.high_scores (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  score INTEGER NOT NULL,
  game_duration_seconds INTEGER NOT NULL DEFAULT 60,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.high_scores ENABLE ROW LEVEL SECURITY;

-- Users can view their own high scores
CREATE POLICY "Users can view their own high scores"
  ON public.high_scores FOR SELECT
  USING (auth.uid() = user_id);

-- Users can insert their own high scores
CREATE POLICY "Users can insert their own high scores"
  ON public.high_scores FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Public leaderboard: everyone can see top scores
CREATE POLICY "Anyone can view top scores"
  ON public.high_scores FOR SELECT
  USING (true);
