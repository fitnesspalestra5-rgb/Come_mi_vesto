import { supabase } from '@/lib/supabase';
import type { Garment, Occasion } from '@/lib/types';

// Le chiamate AI partono solo su azione esplicita dell'utente, mai all'apertura dell'archivio.

export interface AiResponse<T> {
  configured: boolean;
  result?: T;
  error?: string;
}

const INVALID_RESPONSE = 'Risposta non valida dal servizio AI. Riprova tra poco.';

// Legge il messaggio d'errore reale dal corpo della risposta, invece di un JSON non valido.
async function invokeAi(name: string, body: Record<string, unknown>): Promise<Record<string, unknown>> {
  const { data, error } = await supabase.functions.invoke(name, { body });
  if (error) {
    const response = (error as { context?: Response }).context;
    if (response && typeof response.json === 'function') {
      try {
        const payload = (await response.json()) as Record<string, unknown>;
        if (payload && typeof payload === 'object') return payload;
      } catch {
        // corpo non JSON: si usa il messaggio generico
      }
    }
    return { configured: true, error: error.message || INVALID_RESPONSE };
  }
  if (!data || typeof data !== 'object') return { configured: true, error: INVALID_RESPONSE };
  return data as Record<string, unknown>;
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
): Promise<AiResponse<OutfitProposal>> {
  const payload = garments.map((g) => ({
    id: g.id,
    name: g.name,
    category: g.category,
    color: g.color,
    avatar_section: g.avatar_section,
    season: g.season,
    material: g.material,
  }));
  const data = await invokeAi('generate-outfit', { garments: payload, occasion, weather });
  if (data.configured === false) return { configured: false, error: String(data.error ?? '') };
  if (data.error) return { configured: true, error: String(data.error) };
  const r = (data.result ?? {}) as Record<string, unknown>;
  const items = Array.isArray(r.items) ? (r.items as Record<string, unknown>[]) : [];
  return {
    configured: true,
    result: {
      name: String(r.name ?? 'Outfit'),
      occasion: String(r.occasion ?? occasion),
      items: items.map((it) => ({ garment_id: String(it.garment_id), role: String(it.role ?? 'top') })),
      reason: String(r.reason ?? ''),
      tips: r.tips ? String(r.tips) : undefined,
    },
  };
}

export async function generateAvatar(
  garments: Garment[],
  occasion: Occasion | string,
  styleNote?: string
): Promise<AiResponse<{ imageBase64: string }>> {
  const payload = garments.map((g) => ({ name: g.name, category: g.category, color: g.color, avatar_section: g.avatar_section }));
  const data = await invokeAi('generate-avatar', { garments: payload, occasion, styleNote });
  if (data.configured === false) return { configured: false, error: String(data.error ?? '') };
  if (data.error) return { configured: true, error: String(data.error) };
  const r = (data.result ?? {}) as Record<string, unknown>;
  return { configured: true, result: { imageBase64: String(r.imageBase64 ?? '') } };
}
