import { supabase } from '@/lib/supabase';
import { fileToBase64 } from '@/lib/images';
import type { Garment, Occasion } from '@/lib/types';

export interface GarmentAnalysis {
  name: string;
  category: string;
  colors: string[];
  color_hex: string;
  notes: string;
}

export async function analyzeGarment(file: File | Blob): Promise<{ configured: boolean; result?: GarmentAnalysis; error?: string }> {
  const base64 = await fileToBase64(file);
  const { data } = await supabase.functions.invoke('analyze-garment', {
    body: { imageBase64: base64 },
  });
  if (!data) return { configured: false, error: 'Nessuna risposta dal server.' };
  if (data.configured === false) return { configured: false, error: data.error };
  if (data.error) return { configured: true, error: data.error };
  const r = data.result as Record<string, unknown>;
  return {
    configured: true,
    result: {
      name: String(r.name ?? 'Capo'),
      category: String(r.category ?? 'maglia'),
      colors: Array.isArray(r.colors) ? r.colors.map((c) => String(c)) : ['neutro'],
      color_hex: String(r.color_hex ?? '#c8b89a'),
      notes: String(r.notes ?? ''),
    },
  };
}

export interface OutfitProposal {
  name: string;
  occasion: string;
  items: { garment_id: string; role: string }[];
  reason: string;
  tips?: string;
}

export async function generateOutfit(
  garments: Garment[],
  occasion: Occasion | string,
  weather?: string
): Promise<{ configured: boolean; result?: OutfitProposal; error?: string }> {
  const payload = garments.map((g) => ({ id: g.id, name: g.name, category: g.category, color: g.color }));
  const { data } = await supabase.functions.invoke('generate-outfit', {
    body: { garments: payload, occasion, weather },
  });
  if (!data) return { configured: false, error: 'Nessuna risposta dal server.' };
  if (data.configured === false) return { configured: false, error: data.error };
  if (data.error) return { configured: true, error: data.error };
  const r = data.result as Record<string, unknown>;
  return {
    configured: true,
    result: {
      name: String(r.name ?? 'Outfit'),
      occasion: String(r.occasion ?? occasion),
      items: Array.isArray(r.items) ? r.items.map((it) => ({ garment_id: String(it.garment_id), role: String(it.role ?? 'top') })) : [],
      reason: String(r.reason ?? ''),
      tips: r.tips ? String(r.tips) : undefined,
    },
  };
}

export interface AvatarResult {
  imageBase64: string;
}

export async function generateAvatar(
  garments: Garment[],
  occasion: Occasion | string,
  styleNote?: string
): Promise<{ configured: boolean; result?: AvatarResult; error?: string }> {
  const payload = garments.map((g) => ({ name: g.name, category: g.category, color: g.color }));
  const { data } = await supabase.functions.invoke('generate-avatar', {
    body: { garments: payload, occasion, styleNote },
  });
  if (!data) return { configured: false, error: 'Nessuna risposta dal server.' };
  if (data.configured === false) return { configured: false, error: data.error };
  if (data.error) return { configured: true, error: data.error };
  const r = data.result as Record<string, unknown>;
  return {
    configured: true,
    result: { imageBase64: String(r.imageBase64 ?? '') },
  };
}
