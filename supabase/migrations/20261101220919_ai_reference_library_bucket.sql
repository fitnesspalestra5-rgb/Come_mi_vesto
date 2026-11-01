/*
# Private storage bucket for the AI reference library

1. New Storage
- `ai-references` bucket: private, holds optimized example photos of garment types.
  These images are NOT wardrobe items and are never shown in the app.

2. Security
- Bucket is private (public = false). No storage policies are added for anon or
  authenticated roles, so the app cannot read or write these files directly.
- The analysis edge function reads them with the service role, which bypasses storage policies.

3. Notes
- Idempotent: safe to re-run.
*/

INSERT INTO storage.buckets (id, name, public)
VALUES ('ai-references', 'ai-references', false)
ON CONFLICT (id) DO NOTHING;
