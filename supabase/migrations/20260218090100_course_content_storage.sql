-- Course Content Storage Bucket Migration
-- Creates storage bucket for course materials (PDFs, videos, documents, etc.)

-- 1. Create storage bucket for course content

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
    'course-content',
    'course-content',
    true, -- Public bucket so students can access materials
    104857600, -- 100MB limit
    ARRAY[
        'application/pdf',
        'application/msword',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'application/vnd.ms-powerpoint',
        'application/vnd.openxmlformats-officedocument.presentationml.presentation',
        'video/mp4',
        'video/mpeg',
        'video/quicktime',
        'audio/mpeg',
        'audio/wav',
        'audio/mp3',
        'image/jpeg',
        'image/jpg',
        'image/png',
        'image/gif',
        'image/webp',
        'text/plain',
        'application/zip',
        'application/x-zip-compressed'
    ]
)
ON CONFLICT (id) DO NOTHING;

-- 2. Create storage policies for course-content bucket

-- Authenticated users can upload course materials
DROP POLICY IF EXISTS "authenticated_upload_course_content" ON storage.objects;
CREATE POLICY "authenticated_upload_course_content"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
    bucket_id = 'course-content'
);

-- Authenticated users can update their own course materials
DROP POLICY IF EXISTS "authenticated_update_course_content" ON storage.objects;
CREATE POLICY "authenticated_update_course_content"
ON storage.objects
FOR UPDATE
TO authenticated
USING (
    bucket_id = 'course-content'
    AND auth.uid() = owner
)
WITH CHECK (
    bucket_id = 'course-content'
    AND auth.uid() = owner
);

-- Authenticated users can delete their own course materials
DROP POLICY IF EXISTS "authenticated_delete_course_content" ON storage.objects;
CREATE POLICY "authenticated_delete_course_content"
ON storage.objects
FOR DELETE
TO authenticated
USING (
    bucket_id = 'course-content'
    AND auth.uid() = owner
);

-- Anyone can view/download course materials (public bucket)
DROP POLICY IF EXISTS "public_read_course_content" ON storage.objects;
CREATE POLICY "public_read_course_content"
ON storage.objects
FOR SELECT
TO public
USING (bucket_id = 'course-content');