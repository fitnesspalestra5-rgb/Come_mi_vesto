import type { Garment } from '@/lib/types';

// Foto dei capi già presenti in public/assets/images: vengono inserite nell'archivio
// Supabase una sola volta per utente, con metadati neutri da rifinire a mano.

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

export interface CatalogPhoto {
  image_path: string;
  name: string;
}

export const CATALOG_PHOTOS: CatalogPhoto[] = GARMENT_FILES.map((file, i) => ({
  image_path: `/assets/images/${file}`,
  name: `Capo ${i + 1}`,
}));

const LEGACY_KEY = 'cmv_wardrobe_v1';

// Modifiche fatte nella versione precedente, salvate solo nel browser.
export function readLegacyCatalog(): Garment[] {
  try {
    const raw = localStorage.getItem(LEGACY_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? (parsed as Garment[]) : [];
  } catch {
    return [];
  }
}

export function clearLegacyCatalog(): void {
  localStorage.removeItem(LEGACY_KEY);
}
