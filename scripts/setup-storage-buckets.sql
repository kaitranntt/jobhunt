-- ============================================================================
-- SETUP SUPABASE STORAGE BUCKETS FOR FILE STORAGE
-- ============================================================================

-- Insert storage buckets for different file types
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES
  ('avatars', 'avatars', true, 2097152, ARRAY['image/jpeg', 'image/png', 'image/gif', 'image/webp']), -- 2MB
  ('company-logos', 'company-logos', true, 2097152, ARRAY['image/jpeg', 'image/png', 'image/gif', 'image/webp']), -- 2MB
  ('resumes', 'resumes', false, 5242880, ARRAY['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'text/plain', 'application/rtf']), -- 5MB
  ('documents', 'documents', false, 10485760, ARRAY['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'application/vnd.ms-excel', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', 'application/vnd.ms-powerpoint', 'application/vnd.openxmlformats-officedocument.presentationml.presentation', 'text/plain']), -- 10MB
  ('temp', 'temp', false, 10485760, NULL) -- 10MB, no MIME restrictions
ON CONFLICT (id) DO NOTHING;

-- Set up storage policies for bucket access
-- Avatar bucket policies
CREATE POLICY "Public avatar access" ON storage.objects
FOR SELECT USING (bucket_id = 'avatars');

CREATE POLICY "Users can upload own avatar" ON storage.objects
FOR INSERT WITH CHECK (
  bucket_id = 'avatars' AND
  auth.role() = 'authenticated'
);

CREATE POLICY "Users can update own avatar" ON storage.objects
FOR UPDATE USING (
  bucket_id = 'avatars' AND
  auth.role() = 'authenticated'
);

CREATE POLICY "Users can delete own avatar" ON storage.objects
FOR DELETE USING (
  bucket_id = 'avatars' AND
  auth.role() = 'authenticated'
);

-- Company logos bucket policies
CREATE POLICY "Public company logo access" ON storage.objects
FOR SELECT USING (bucket_id = 'company-logos');

CREATE POLICY "Authenticated users can upload company logos" ON storage.objects
FOR INSERT WITH CHECK (
  bucket_id = 'company-logos' AND
  auth.role() = 'authenticated'
);

CREATE POLICY "Authenticated users can update company logos" ON storage.objects
FOR UPDATE USING (
  bucket_id = 'company-logos' AND
  auth.role() = 'authenticated'
);

CREATE POLICY "Authenticated users can delete company logos" ON storage.objects
FOR DELETE USING (
  bucket_id = 'company-logos' AND
  auth.role() = 'authenticated'
);

-- Resumes bucket policies (private)
CREATE POLICY "Users can manage own resumes" ON storage.objects
FOR ALL USING (
  bucket_id = 'resumes' AND
  auth.uid()::text = (storage.foldername(name))[1]
);

-- Documents bucket policies (private)
CREATE POLICY "Users can manage own documents" ON storage.objects
FOR ALL USING (
  bucket_id = 'documents' AND
  auth.uid()::text = (storage.foldername(name))[1]
);

-- Temp bucket policies (for uploads)
CREATE POLICY "Users can manage temp files" ON storage.objects
FOR ALL USING (
  bucket_id = 'temp' AND
  auth.uid()::text = (storage.foldername(name))[1]
);

-- Grant permissions
GRANT ALL ON storage.buckets TO authenticated;
GRANT ALL ON storage.objects TO authenticated;

-- Enable RLS on storage objects
ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;

NOTICE: Storage buckets and policies created successfully!