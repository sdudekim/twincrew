-- Create figma_cache table for permanent caching of Figma API data
CREATE TABLE public.figma_cache (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  file_key TEXT NOT NULL UNIQUE,
  file_name TEXT,
  layers JSONB,
  cached_at TIMESTAMPTZ DEFAULT now(),
  expires_at TIMESTAMPTZ DEFAULT (now() + interval '30 minutes'),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Create index for faster lookups
CREATE INDEX idx_figma_cache_file_key ON public.figma_cache(file_key);
CREATE INDEX idx_figma_cache_expires_at ON public.figma_cache(expires_at);

-- Enable RLS (public read/write for edge functions)
ALTER TABLE public.figma_cache ENABLE ROW LEVEL SECURITY;

-- Allow public access for edge functions (using service role key)
CREATE POLICY "Allow all operations for service role"
ON public.figma_cache
FOR ALL
USING (true)
WITH CHECK (true);