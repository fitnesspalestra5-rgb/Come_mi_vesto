import { useCallback, useEffect, useState } from 'react';
import type { Garment } from '@/lib/types';
import { loadGarments, saveGarments, makeId } from '@/lib/catalog';

// Archivio in memoria + localStorage: istantaneo, senza backend e senza chiamate AI.

export interface GarmentWithUrl extends Garment {
  imageUrl: string | null;
}

const listeners = new Set<() => void>();
let cache: Garment[] | null = null;

function getStore(): Garment[] {
  if (!cache) cache = loadGarments();
  return cache;
}

function commit(garments: Garment[]) {
  cache = garments;
  saveGarments(garments);
  listeners.forEach((l) => l());
}

export function useGarments() {
  const [garments, setGarments] = useState<Garment[]>(() => getStore());

  const reload = useCallback(() => {
    setGarments([...getStore()]);
  }, []);

  useEffect(() => {
    const update = () => setGarments([...getStore()]);
    listeners.add(update);
    return () => { listeners.delete(update); };
  }, []);

  return { garments, loading: false, error: null as string | null, reload };
}

// Le foto sono file statici pubblici: l'URL coincide con image_path.
export function withImageUrls(garments: Garment[]): GarmentWithUrl[] {
  return garments.map((g) => ({ ...g, imageUrl: g.image_path }));
}

export async function deleteGarment(garment: Garment): Promise<void> {
  commit(getStore().filter((g) => g.id !== garment.id));
}

export async function toggleFavorite(garment: Garment): Promise<void> {
  commit(getStore().map((g) => (g.id === garment.id ? { ...g, favorite: !g.favorite } : g)));
}

export async function updateGarment(id: string, patch: Partial<Garment>): Promise<void> {
  commit(getStore().map((g) => (g.id === id ? { ...g, ...patch } : g)));
}

export async function insertGarment(payload: Omit<Garment, 'id' | 'user_id' | 'favorite' | 'created_at'>): Promise<void> {
  const garment: Garment = {
    ...payload,
    id: makeId(),
    user_id: 'local',
    favorite: false,
    created_at: new Date().toISOString(),
  };
  commit([garment, ...getStore()]);
}
