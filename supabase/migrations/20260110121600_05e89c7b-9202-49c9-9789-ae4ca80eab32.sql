-- Create a table for daily walking statistics
CREATE TABLE public.daily_walk_stats (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  total_steps INTEGER NOT NULL DEFAULT 0,
  total_distance_km NUMERIC(10, 4) NOT NULL DEFAULT 0,
  total_coins INTEGER NOT NULL DEFAULT 0,
  sessions_count INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, date)
);

-- Enable Row Level Security
ALTER TABLE public.daily_walk_stats ENABLE ROW LEVEL SECURITY;

-- Create policies for user access
CREATE POLICY "Users can view their own daily stats" 
ON public.daily_walk_stats 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own daily stats" 
ON public.daily_walk_stats 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own daily stats" 
ON public.daily_walk_stats 
FOR UPDATE 
USING (auth.uid() = user_id);

-- Create index for faster queries
CREATE INDEX idx_daily_walk_stats_user_date ON public.daily_walk_stats(user_id, date);

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_daily_walk_stats_updated_at
BEFORE UPDATE ON public.daily_walk_stats
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();