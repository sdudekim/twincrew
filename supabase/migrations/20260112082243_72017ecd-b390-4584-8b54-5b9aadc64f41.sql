-- Add DELETE policies for admin functionality
CREATE POLICY "Anyone can delete likes"
ON public.crew_likes
FOR DELETE
USING (true);

CREATE POLICY "Anyone can delete reviews"
ON public.crew_reviews
FOR DELETE
USING (true);