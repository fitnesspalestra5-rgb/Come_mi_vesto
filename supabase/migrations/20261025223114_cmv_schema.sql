/*
# Come mi vesto? — Schema iniziale

1. Nuove tabelle
- `garments`: capi del guardaroba dell'utente. Colonne: id, user_id, name, category,
  color (nome colore), color_hex, image_path (percorso nello storage), notes,
  favorite, created_at.
- `outfits`: combinazioni salvate. Colonne: id, user_id, name, occasion, weather_note,
  notes, favorite, created_at.
- `outfit_items`: collegamento outfit <-> capo con ruolo (top, bottom, shoes, ecc.).

2. Storage
- Bucket `garments` per le foto dei capi (privato, suddiviso per utente).

3. Sicurezza
- RLS attiva su tutte le tabelle.
- Grant CRUD a `authenticated` (app con login).
- Policy owner-scoped con auth.uid() = user_id.
- Storage: policy che permette a ciascun utente di gestire solo i file nella propria
  cartella `user_id/...`.
*/

CREATE TABLE IF NOT EXISTS garments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  name text NOT NULL DEFAULT 'Capo',
  category text NOT NULL DEFAULT 'maglia',
  color text NOT NULL DEFAULT 'neutro',
  color_hex text NOT NULL DEFAULT '#c8b89a',
  image_path text,
  notes text,
  favorite boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE garments ENABLE ROW LEVEL SECURITY;

GRANT SELECT, INSERT, UPDATE, DELETE ON garments TO authenticated;

DROP POLICY IF EXISTS "select_own_garments" ON garments;
CREATE POLICY "select_own_garments" ON garments FOR SELECT
  TO authenticated USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "insert_own_garments" ON garments;
CREATE POLICY "insert_own_garments" ON garments FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "update_own_garments" ON garments;
CREATE POLICY "update_own_garments" ON garments FOR UPDATE
  TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "delete_own_garments" ON garments;
CREATE POLICY "delete_own_garments" ON garments FOR DELETE
  TO authenticated USING (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS garments_user_id_idx ON garments(user_id);

CREATE TABLE IF NOT EXISTS outfits (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  name text NOT NULL DEFAULT 'Outfit',
  occasion text NOT NULL DEFAULT 'tempo_libero',
  weather_note text,
  notes text,
  favorite boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE outfits ENABLE ROW LEVEL SECURITY;

GRANT SELECT, INSERT, UPDATE, DELETE ON outfits TO authenticated;

DROP POLICY IF EXISTS "select_own_outfits" ON outfits;
CREATE POLICY "select_own_outfits" ON outfits FOR SELECT
  TO authenticated USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "insert_own_outfits" ON outfits;
CREATE POLICY "insert_own_outfits" ON outfits FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "update_own_outfits" ON outfits;
CREATE POLICY "update_own_outfits" ON outfits FOR UPDATE
  TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "delete_own_outfits" ON outfits;
CREATE POLICY "delete_own_outfits" ON outfits FOR DELETE
  TO authenticated USING (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS outfits_user_id_idx ON outfits(user_id);

CREATE TABLE IF NOT EXISTS outfit_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  outfit_id uuid NOT NULL REFERENCES outfits(id) ON DELETE CASCADE,
  garment_id uuid NOT NULL REFERENCES garments(id) ON DELETE CASCADE,
  role text NOT NULL DEFAULT 'top',
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE outfit_items ENABLE ROW LEVEL SECURITY;

GRANT SELECT, INSERT, UPDATE, DELETE ON outfit_items TO authenticated;

DROP POLICY IF EXISTS "select_own_outfit_items" ON outfit_items;
CREATE POLICY "select_own_outfit_items" ON outfit_items FOR SELECT
  TO authenticated USING (
    EXISTS (SELECT 1 FROM outfits WHERE outfits.id = outfit_items.outfit_id AND outfits.user_id = auth.uid())
  );

DROP POLICY IF EXISTS "insert_own_outfit_items" ON outfit_items;
CREATE POLICY "insert_own_outfit_items" ON outfit_items FOR INSERT
  TO authenticated WITH CHECK (
    EXISTS (SELECT 1 FROM outfits WHERE outfits.id = outfit_items.outfit_id AND outfits.user_id = auth.uid())
  );

DROP POLICY IF EXISTS "update_own_outfit_items" ON outfit_items;
CREATE POLICY "update_own_outfit_items" ON outfit_items FOR UPDATE
  TO authenticated USING (
    EXISTS (SELECT 1 FROM outfits WHERE outfits.id = outfit_items.outfit_id AND outfits.user_id = auth.uid())
  ) WITH CHECK (
    EXISTS (SELECT 1 FROM outfits WHERE outfits.id = outfit_items.outfit_id AND outfits.user_id = auth.uid())
  );

DROP POLICY IF EXISTS "delete_own_outfit_items" ON outfit_items;
CREATE POLICY "delete_own_outfit_items" ON outfit_items FOR DELETE
  TO authenticated USING (
    EXISTS (SELECT 1 FROM outfits WHERE outfits.id = outfit_items.outfit_id AND outfits.user_id = auth.uid())
  );

CREATE INDEX IF NOT EXISTS outfit_items_outfit_id_idx ON outfit_items(outfit_id);
CREATE INDEX IF NOT EXISTS outfit_items_garment_id_idx ON outfit_items(garment_id);

-- Storage bucket per le foto dei capi
INSERT INTO storage.buckets (id, name, public)
SELECT 'garments', 'garments', false
WHERE NOT EXISTS (SELECT 1 FROM storage.buckets WHERE id = 'garments');

DROP POLICY IF EXISTS "garments_storage_select_own" ON storage.objects;
CREATE POLICY "garments_storage_select_own" ON storage.objects FOR SELECT
  TO authenticated USING (bucket_id = 'garments' AND auth.uid()::text = (storage.foldername(name))[1]);

DROP POLICY IF EXISTS "garments_storage_insert_own" ON storage.objects;
CREATE POLICY "garments_storage_insert_own" ON storage.objects FOR INSERT
  TO authenticated WITH CHECK (bucket_id = 'garments' AND auth.uid()::text = (storage.foldername(name))[1]);

DROP POLICY IF EXISTS "garments_storage_update_own" ON storage.objects;
CREATE POLICY "garments_storage_update_own" ON storage.objects FOR UPDATE
  TO authenticated USING (bucket_id = 'garments' AND auth.uid()::text = (storage.foldername(name))[1])
  WITH CHECK (bucket_id = 'garments' AND auth.uid()::text = (storage.foldername(name))[1]);

DROP POLICY IF EXISTS "garments_storage_delete_own" ON storage.objects;
CREATE POLICY "garments_storage_delete_own" ON storage.objects FOR DELETE
  TO authenticated USING (bucket_id = 'garments' AND auth.uid()::text = (storage.foldername(name))[1]);
