-- Create storage bucket for kai background removal images
INSERT INTO storage.buckets (id, name, public)
VALUES ('kai-images', 'kai-images', true);

-- Allow anyone to upload images
CREATE POLICY "Anyone can upload kai images"
ON storage.objects
FOR INSERT
WITH CHECK (bucket_id = 'kai-images');

-- Allow public access to read images
CREATE POLICY "Anyone can view kai images"
ON storage.objects
FOR SELECT
USING (bucket_id = 'kai-images');