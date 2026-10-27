import { supabase } from '@/lib/supabase';
import { fileToBase64 } from '@/lib/images';
import type { Garment, Occasion } from '@/lib/types';

export interface GarmentAnalysis {
  name: string;
  category: string;
  color: string;
  season: string;
  material: string;
  avatar_section: string;
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
  const categoryMap: Record<string, string> = {
    'Maglia / T-shirt': 'maglia',
    'Camicia': 'camicia',
    'Giacca / Blazer': 'giacca',
    'Felpa / Maglione': 'felpa',
    'Pantalone': 'pantalone',
    'Jeans': 'jeans',
    'Shorts': 'pantalone',
    'Scarpe / Sneakers': 'scarpe',
    'Accessorio': 'accessorio',
  };
  return {
    configured: true,
    result: {
      name: String(r.nome ?? 'Capo'),
      category: categoryMap[String(r.categoria)] ?? 'maglia',
      color: String(r.colore ?? 'neutro'),
      season: String(r.stagione ?? 'Quattro stagioni'),
      material: String(r.materiale ?? 'Misto'),
      avatar_section: String(r.sezione_avatar ?? 'busto'),
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
  const payload = garments.map((g) => ({ id: g.id, name: g.name, category: g.category, color: g.color, avatar_section: g.avatar_section }));
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
  const payload = garments.map((g) => ({ name: g.name, category: g.category, color: g.color, avatar_section: g.avatar_section }));
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
