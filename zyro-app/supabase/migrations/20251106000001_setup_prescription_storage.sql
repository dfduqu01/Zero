-- Migration: Setup Prescription Images Storage
-- Date: 2025-11-06
-- Description: Creates storage bucket and policies for prescription images

-- ============================================================================
-- STEP 1: CREATE PRESCRIPTION IMAGES BUCKET
-- ============================================================================

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'prescription-images',
  'prescription-images',
  false, -- Private bucket
  5242880, -- 5MB limit
  ARRAY['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'application/pdf']
)
ON CONFLICT (id) DO NOTHING;

-- ============================================================================
-- STEP 2: CREATE STORAGE POLICIES FOR PRESCRIPTION IMAGES
-- ============================================================================

-- Users can upload their own prescription images
CREATE POLICY "Users can upload own prescription images"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'prescription-images' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

-- Users can view their own prescription images
CREATE POLICY "Users can view own prescription images"
ON storage.objects FOR SELECT
TO authenticated
USING (
  bucket_id = 'prescription-images' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

-- Users can update their own prescription images
CREATE POLICY "Users can update own prescription images"
ON storage.objects FOR UPDATE
TO authenticated
USING (
  bucket_id = 'prescription-images' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

-- Users can delete their own prescription images
CREATE POLICY "Users can delete own prescription images"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'prescription-images' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

-- Admins can view all prescription images
CREATE POLICY "Admins can view all prescription images"
ON storage.objects FOR SELECT
TO authenticated
USING (
  bucket_id = 'prescription-images' AND
  EXISTS (
    SELECT 1 FROM users
    WHERE users.id = auth.uid()
    AND users.is_admin = true
  )
);

-- ============================================================================
-- MIGRATION COMPLETE
-- ============================================================================

-- Summary:
-- ✅ prescription-images bucket created (private, 5MB limit)
-- ✅ Users can upload/view/update/delete only their own images
-- ✅ Images organized by user_id folder structure
-- ✅ Admins can view all prescription images
-- ✅ Supported formats: JPG, PNG, WebP, PDF
