-- Create a storage bucket for product images
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'product-images',
  'product-images',
  true,
  5242880, -- 5MB limit
  ARRAY['image/jpeg', 'image/png', 'image/gif', 'image/webp']
);

-- Create RLS policies for the product-images bucket

-- Public can SELECT (view) images
CREATE POLICY "Public can view product images" ON storage.objects
FOR SELECT USING (bucket_id = 'product-images');

-- Authenticated users can INSERT (upload) images
CREATE POLICY "Authenticated users can upload product images" ON storage.objects
FOR INSERT WITH CHECK (
  bucket_id = 'product-images' 
  AND auth.role() = 'authenticated'
);

-- Admin users can UPDATE images
CREATE POLICY "Admin users can update product images" ON storage.objects
FOR UPDATE USING (
  bucket_id = 'product-images' 
  AND (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.role = 'admin'
    )
  )
);

-- Admin users can DELETE images
CREATE POLICY "Admin users can delete product images" ON storage.objects
FOR DELETE USING (
  bucket_id = 'product-images' 
  AND (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.role = 'admin'
    )
  )
);