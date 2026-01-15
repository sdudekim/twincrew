-- Create table for crew likes
CREATE TABLE public.crew_likes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  crew_name TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create table for crew reviews
CREATE TABLE public.crew_reviews (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  crew_name TEXT NOT NULL,
  reviewer_name TEXT NOT NULL,
  review_text TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.crew_likes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.crew_reviews ENABLE ROW LEVEL SECURITY;

-- Allow public read access to crew_likes (for counting)
CREATE POLICY "Anyone can read crew likes"
ON public.crew_likes
FOR SELECT
USING (true);

-- Allow anyone to insert likes (no auth required for public feature)
CREATE POLICY "Anyone can add likes"
ON public.crew_likes
FOR INSERT
WITH CHECK (true);

-- Allow public read access to crew_reviews
CREATE POLICY "Anyone can read crew reviews"
ON public.crew_reviews
FOR SELECT
USING (true);

-- Allow anyone to insert reviews
CREATE POLICY "Anyone can add reviews"
ON public.crew_reviews
FOR INSERT
WITH CHECK (true);

-- Create indexes for performance
CREATE INDEX idx_crew_likes_crew_name ON public.crew_likes(crew_name);
CREATE INDEX idx_crew_reviews_crew_name ON public.crew_reviews(crew_name);