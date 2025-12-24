-- Create locations table for storing location history
CREATE TABLE public.locations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  latitude DOUBLE PRECISION NOT NULL,
  longitude DOUBLE PRECISION NOT NULL,
  accuracy DOUBLE PRECISION,
  speed DOUBLE PRECISION,
  heading DOUBLE PRECISION,
  altitude DOUBLE PRECISION,
  device_id TEXT NOT NULL DEFAULT 'default',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.locations ENABLE ROW LEVEL SECURITY;

-- Create policy for public access (since this is a personal phone tracker)
CREATE POLICY "Allow all operations on locations" 
ON public.locations 
FOR ALL 
USING (true)
WITH CHECK (true);

-- Create index for faster queries by device and time
CREATE INDEX idx_locations_device_time ON public.locations (device_id, created_at DESC);

-- Enable realtime for live tracking
ALTER PUBLICATION supabase_realtime ADD TABLE public.locations;