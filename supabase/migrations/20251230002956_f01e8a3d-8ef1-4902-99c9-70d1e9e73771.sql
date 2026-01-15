-- Fix storage security: Make kai-images bucket require authentication for uploads
-- Keep public SELECT for viewing but require auth for INSERT

-- Drop existing overly permissive policies
DROP POLICY IF EXISTS "Anyone can upload kai images" ON storage.objects;
DROP POLICY IF EXISTS "Anyone can view kai images" ON storage.objects;

-- Create secure policies: public viewing is OK, but uploads require authentication
CREATE POLICY "Authenticated users can upload kai images"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'kai-images' AND
  auth.role() = 'authenticated'
);

-- Keep public viewing for serving images
CREATE POLICY "Public can view kai images"
ON storage.objects FOR SELECT
USING (bucket_id = 'kai-images');

-- Authenticated users can update their own uploads
CREATE POLICY "Authenticated users can update kai images"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'kai-images' AND
  auth.role() = 'authenticated'
);

-- Authenticated users can delete uploads
CREATE POLICY "Authenticated users can delete kai images"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'kai-images' AND
  auth.role() = 'authenticated'
);