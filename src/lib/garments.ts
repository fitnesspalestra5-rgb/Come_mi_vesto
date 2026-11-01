import { useCallback, useEffect, useState } from 'react';
import { supabase, GARMENTS_BUCKET } from '@/lib/supabase';
import { useAuth } from '@/lib/auth';
import type { Garment } from '@/lib/types';
import { isStoragePath, resolveImageUrl } from '@/lib/images';

export interface GarmentWithUrl extends Garment {
  imageUrl: string | null;
}

export type GarmentInput = Omit<Garment, 'id' | 'user_id' | 'created_at'>;

export function useGarments() {
  const { user } = useAuth();
  const userId = user?.id;
  const [garments, setGarments] = useState<GarmentWithUrl[]>([]);
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
      setGarments(await withSignedUrls((data ?? []) as Garment[]));
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    if (!userId) return;
    load();
    const channel = supabase
      .channel(`garments-${userId}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'garments', filter: `user_id=eq.${userId}` }, () => load())
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [userId, load]);

  return { garments, loading, error, reload: load };
}

async function withSignedUrls(garments: Garment[]): Promise<GarmentWithUrl[]> {
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
