// Archivio del guardaroba basato su file statici locali.
// Le foto dei capi risiedono in /assets/images e vengono servite direttamente
// dal browser: niente storage Supabase, niente URL firmati, niente chiamate AI.
// I metadati (categoria, colore, sezione avatar) si salvano nel browser così le
// modifiche restano tra un reload e l'altro.

import type { Garment } from '@/lib/types';

const STORE_KEY = 'cmv_wardrobe_v1';

const GARMENT_FILES: string[] = [
  'IMG_2190.jpeg',
  'IMG_2191.jpeg',
  'IMG_2192.jpeg',
  'IMG_2195.jpeg',
  'IMG_2196.jpeg',
  'WhatsApp_Image_2026-10-27_at_15.47.32.jpeg',
  'WhatsApp_Image_2026-10-27_at_15.47.35.jpeg',
  'WhatsApp_Image_2026-10-27_at_15.47.35_(1).jpeg',
  'WhatsApp_Image_2026-10-27_at_15.47.35_(2).jpeg',
  'WhatsApp_Image_2026-10-27_at_15.47.35_(3).jpeg',
  'WhatsApp_Image_2026-10-27_at_15.47.35_(4).jpeg',
  'WhatsApp_Image_2026-10-27_at_15.47.36.jpeg',
  'WhatsApp_Image_2026-10-27_at_15.47.36_(1).jpeg',
  'WhatsApp_Image_2026-10-27_at_15.47.36_(2).jpeg',
  'WhatsApp_Image_2026-10-27_at_15.47.36_(4).jpeg',
  'WhatsApp_Image_2026-10-27_at_15.47.36_(5).jpeg',
  'WhatsApp_Image_2026-10-27_at_15.47.36_(6).jpeg',
  'WhatsApp_Image_2026-10-27_at_15.47.37.jpeg',
  'WhatsApp_Image_2026-10-27_at_15.47.37_(1).jpeg',
  'WhatsApp_Image_2026-10-27_at_15.47.37_(2).jpeg',
  'WhatsApp_Image_2026-10-27_at_15.47.37_(3).jpeg',
  'WhatsApp_Image_2026-10-27_at_15.47.37_(4).jpeg',
  'WhatsApp_Image_2026-10-27_at_15.47.37_(5).jpeg',
  'WhatsApp_Image_2026-10-27_at_15.47.37_(6).jpeg',
  'WhatsApp_Image_2026-10-27_at_15.47.37_(7).jpeg',
  'WhatsApp_Image_2026-10-27_at_15.47.38.jpeg',
  'WhatsApp_Image_2026-10-27_at_15.47.38_(1).jpeg',
  'WhatsApp_Image_2026-10-27_at_15.47.38_(2).jpeg',
  'WhatsApp_Image_2026-10-27_at_15.47.38_(3).jpeg',
  'WhatsApp_Image_2026-10-27_at_15.47.38_(4).jpeg',
  'WhatsApp_Image_2026-10-27_at_15.47.38_(5).jpeg',
  'WhatsApp_Image_2026-10-27_at_15.47.38_(6).jpeg',
  'WhatsApp_Image_2026-10-27_at_15.47.38_(7).jpeg',
  'WhatsApp_Image_2026-10-27_at_15.47.39.jpeg',
  'WhatsApp_Image_2026-10-27_at_15.47.39_(1).jpeg',
  'WhatsApp_Image_2026-10-27_at_15.47.39_(3).jpeg',
  'WhatsApp_Image_2026-10-27_at_15.47.39_(4).jpeg',
  'WhatsApp_Image_2026-10-27_at_15.47.39_(5).jpeg',
  'WhatsApp_Image_2026-10-27_at_15.47.39_(6).jpeg',
  'WhatsApp_Image_2026-10-27_at_15.47.39_(7).jpeg',
  'WhatsApp_Image_2026-10-27_at_15.47.40.jpeg',
  'WhatsApp_Image_2026-10-27_at_15.47.40_(1).jpeg',
  'WhatsApp_Image_2026-10-27_at_15.47.40_(2).jpeg',
  'WhatsApp_Image_2026-10-27_at_15.47.40_(3).jpeg',
  'WhatsApp_Image_2026-10-27_at_15.47.40_(4).jpeg',
  'WhatsApp_Image_2026-10-27_at_15.47.40_(5).jpeg',
  'WhatsApp_Image_2026-10-27_at_15.47.40_(6).jpeg',
  'WhatsApp_Image_2026-10-27_at_15.47.41.jpeg',
  'WhatsApp_Image_2026-10-27_at_15.47.41_(1).jpeg',
  'WhatsApp_Image_2026-10-27_at_15.47.41_(2).jpeg',
  'WhatsApp_Image_2026-10-27_at_15.47.41_(3).jpeg',
  'WhatsApp_Image_2026-10-27_at_15.47.41_(4).jpeg',
  'WhatsApp_Image_2026-10-27_at_15.47.41_(5).jpeg',
  'WhatsApp_Image_2026-10-27_at_15.47.41_(6).jpeg',
  'WhatsApp_Image_2026-10-27_at_15.47.41_(7).jpeg',
  'WhatsApp_Image_2026-10-27_at_16.19.52.jpeg',
];

export const SECTION_BY_CATEGORY: Record<string, Garment['avatar_section']> = {
  maglia: 'busto',
  maglione: 'busto',
  felpa: 'busto',
  camicia: 'busto',
  giacca: 'busto',
  cappotto: 'busto',
  vestito: 'busto',
  pantalone: 'gambe',
  jeans: 'gambe',
  gonna: 'gambe',
  scarpe: 'scarpe',
  accessorio: 'busto',
};

function seedGarments(): Garment[] {
  const now = Date.now();
  return GARMENT_FILES.map((file, i) => ({
    id: `seed-${i}`,
    user_id: 'local',
    name: `Capo ${i + 1}`,
    category: 'maglia',
    color: 'neutro',
    color_hex: '#c8b89a',
    image_path: `/assets/images/${file}`,
    notes: null,
    season: 'Quattro stagioni',
    material: 'Misto',
    avatar_section: 'busto',
    favorite: false,
    created_at: new Date(now - i * 1000).toISOString(),
  }));
}

function isGarmentArray(v: unknown): v is Garment[] {
  return Array.isArray(v) && v.every((g) => g && typeof g.id === 'string' && typeof g.image_path === 'string');
}

export function loadGarments(): Garment[] {
  try {
    const raw = localStorage.getItem(STORE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (isGarmentArray(parsed)) return parsed;
    }
  } catch {
    // archivio corrotto: si riparte dalla semina
  }
  const seeded = seedGarments();
  saveGarments(seeded);
  return seeded;
}

export function saveGarments(garments: Garment[]): void {
  try {
    localStorage.setItem(STORE_KEY, JSON.stringify(garments));
  } catch {
    // storage pieno o non disponibile
  }
}

export function makeId(): string {
  return `g-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}
