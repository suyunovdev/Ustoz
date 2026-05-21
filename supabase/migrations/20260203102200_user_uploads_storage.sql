-- User Uploads Storage Bucket Migration
-- Creates storage bucket for user profile photos and other user-uploaded content

-- 1. Create storage bucket for user uploads

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
    'user-uploads',
    'user-uploads',
    true, -- Public bucket for profile photos
    5242880, -- 5MB limit
    ARRAY['image/jpeg', 'image/jpg', 'image/png', 'image/webp']
)
ON CONFLICT (id) DO NOTHING;

-- 2. Create storage policies for user-uploads bucket

-- Users can upload their own files
DROP POLICY IF EXISTS "users_upload_own_files" ON storage.objects;
CREATE POLICY "users_upload_own_files"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
    bucket_id = 'user-uploads'
    AND auth.uid()::text = (storage.foldername(name))[1]
);

-- Users can update their own files
DROP POLICY IF EXISTS "users_update_own_files" ON storage.objects;
CREATE POLICY "users_update_own_files"
ON storage.objects
FOR UPDATE
TO authenticated
USING (
    bucket_id = 'user-uploads'
    AND auth.uid()::text = (storage.foldername(name))[1]
)
WITH CHECK (
    bucket_id = 'user-uploads'
    AND auth.uid()::text = (storage.foldername(name))[1]
);

-- Users can delete their own files
DROP POLICY IF EXISTS "users_delete_own_files" ON storage.objects;
CREATE POLICY "users_delete_own_files"
ON storage.objects
FOR DELETE
TO authenticated
USING (
    bucket_id = 'user-uploads'
    AND auth.uid()::text = (storage.foldername(name))[1]
);

-- Anyone can view files in public bucket
DROP POLICY IF EXISTS "public_read_user_uploads" ON storage.objects;
CREATE POLICY "public_read_user_uploads"
ON storage.objects
FOR SELECT
TO public
USING (bucket_id = 'user-uploads');