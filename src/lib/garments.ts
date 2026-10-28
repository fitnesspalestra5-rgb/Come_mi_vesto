import { useCallback, useEffect, useState } from 'react';
import { supabase, GARMENTS_BUCKET } from '@/lib/supabase';
import { useAuth } from '@/lib/auth';
import type { Garment } from '@/lib/types';
import { isStoragePath, resolveImageUrl } from '@/lib/images';
import { CATALOG_PHOTOS, readLegacyCatalog, clearLegacyCatalog } from '@/lib/catalog';

export interface GarmentWithUrl extends Garment {
  imageUrl: string | null;
}

export type GarmentInput = Omit<Garment, 'id' | 'user_id' | 'created_at'>;

const seedKey = (userId: string) => `cmv_seeded_${userId}`;

// Inserisce una sola volta le foto del catalogo, conservando le modifiche della versione precedente.
async function seedCatalogPhotos(userId: string): Promise<void> {
  if (localStorage.getItem(seedKey(userId))) return;

  const { data: existing, error } = await supabase
    .from('garments')
    .select('image_path')
    .eq('user_id', userId)
    .like('image_path', '/assets/%');
  if (error) throw new Error(error.message);

  const present = new Set((existing ?? []).map((r) => r.image_path));
  const legacy = new Map(readLegacyCatalog().map((g) => [g.image_path, g]));

  const rows = CATALOG_PHOTOS.filter((p) => !present.has(p.image_path)).map((photo) => {
    const meta = legacy.get(photo.image_path);
    return {
      user_id: userId,
      name: meta?.name ?? photo.name,
      category: meta?.category ?? 'maglia',
      color: meta?.color ?? 'neutro',
      color_hex: meta?.color_hex ?? '#c8b89a',
      image_path: photo.image_path,
      notes: meta?.notes ?? null,
      season: meta?.season ?? 'Quattro stagioni',
      material: meta?.material ?? 'Misto',
      avatar_section: meta?.avatar_section ?? 'busto',
      favorite: meta?.favorite ?? false,
    };
  });

  if (rows.length) {
    const { error: insertError } = await supabase.from('garments').insert(rows);
    if (insertError) throw new Error(insertError.message);
  }
  localStorage.setItem(seedKey(userId), '1');
  clearLegacyCatalog();
}

export function useGarments() {
  const { user } = useAuth();
  const userId = user?.id;
  const [garments, setGarments] = useState<Garment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!userId) return;
    const { data, error } = await supabase
      .from('garments')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });
    if (error) {
      setError(error.message);
    } else {
      setError(null);
      setGarments((data ?? []) as Garment[]);
    }
    setLoading(false);
  }, [userId]);

  useEffect(() => {
    if (!userId) return;
    let cancelled = false;
    (async () => {
      try {
        await seedCatalogPhotos(userId);
      } catch (e) {
        if (!cancelled) setError((e as Error).message);
      }
      if (!cancelled) load();
    })();
    const channel = supabase
      .channel(`garments-${userId}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'garments', filter: `user_id=eq.${userId}` }, () => load())
      .subscribe();
    return () => {
      cancelled = true;
      supabase.removeChannel(channel);
    };
  }, [userId, load]);

  return { garments, loading, error, reload: load };
}

export async function withSignedUrls(garments: Garment[]): Promise<GarmentWithUrl[]> {
  return Promise.all(
    garments.map(async (g) => ({ ...g, imageUrl: await resolveImageUrl(g.image_path) }))
  );
}

export async function deleteGarment(garment: Garment): Promise<void> {
  if (isStoragePath(garment.image_path)) {
    await supabase.storage.from(GARMENTS_BUCKET).remove([garment.image_path]);
  }
  const { error } = await supabase.from('garments').delete().eq('id', garment.id);
  if (error) throw new Error(error.message);
}

export async function toggleFavorite(garment: Garment): Promise<void> {
  const { error } = await supabase.from('garments').update({ favorite: !garment.favorite }).eq('id', garment.id);
  if (error) throw new Error(error.message);
}

export async function updateGarment(id: string, patch: Partial<GarmentInput>): Promise<void> {
  const { error } = await supabase.from('garments').update(patch).eq('id', id);
  if (error) throw new Error(error.message);
}

export async function insertGarment(userId: string, payload: GarmentInput): Promise<void> {
  const { error } = await supabase.from('garments').insert({ ...payload, user_id: userId });
  if (error) throw new Error(error.message);
}
