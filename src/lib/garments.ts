import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/lib/auth';
import type { Garment } from '@/lib/types';
import { getSignedImageUrl } from '@/lib/images';
import { GarmentCard } from '@/components/GarmentCard';

export function useGarments() {
  const { user } = useAuth();
  const [garments, setGarments] = useState<Garment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = async () => {
    if (!user) return;
    setLoading(true);
    setError(null);
    const { data, error } = await supabase
      .from('garments')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });
    if (error) setError(error.message);
    setGarments((data ?? []) as Garment[]);
    setLoading(false);
  };

  useEffect(() => {
    load();
    // realtime
    const channel = supabase
      .channel('garments-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'garments', filter: `user_id=eq.${user?.id}` }, () => load())
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id]);

  return { garments, loading, error, reload: load };
}

export interface GarmentWithUrl extends Garment {
  imageUrl: string | null;
}

// Mappa i capi aggiungendo un URL firmato per ogni immagine.
export async function withSignedUrls(garments: Garment[]): Promise<GarmentWithUrl[]> {
  return Promise.all(
    garments.map(async (g) => ({
      ...g,
      imageUrl: g.image_path ? await getSignedImageUrl(g.image_path) : null,
    }))
  );
}

export async function deleteGarment(garment: Garment): Promise<void> {
  if (garment.image_path) {
    await supabase.storage.from('garments').remove([garment.image_path]);
  }
  const { error } = await supabase.from('garments').delete().eq('id', garment.id);
  if (error) throw new Error(error.message);
}

export async function toggleFavorite(garment: Garment): Promise<void> {
  const { error } = await supabase
    .from('garments')
    .update({ favorite: !garment.favorite })
    .eq('id', garment.id);
  if (error) throw new Error(error.message);
}

export async function updateGarment(id: string, patch: Partial<Garment>): Promise<void> {
  const { error } = await supabase.from('garments').update(patch).eq('id', id);
  if (error) throw new Error(error.message);
}

export type { GarmentCard };
