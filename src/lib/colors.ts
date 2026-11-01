// Utility per i colori: nomi <-> hex, armonie cromatiche, leggibilità.
// Tutto statico, senza dipendenze esterne.

interface NamedColor {
  name: string;
  hex: string;
}

export const NAMED_COLORS: NamedColor[] = [
  { name: 'bianco', hex: '#f7f4ee' },
  { name: 'crema', hex: '#f3ebdb' },
  { name: 'beige', hex: '#c8b89a' },
  { name: 'sabbia', hex: '#d4c4a3' },
  { name: 'terracotta', hex: '#b25139' },
  { name: 'mattone', hex: '#97412e' },
  { name: 'rosso', hex: '#a83232' },
  { name: 'corallo', hex: '#db8e78' },
  { name: 'rosa', hex: '#d9a9a0' },
  { name: 'bordeaux', hex: '#5f2b22' },
  { name: 'oliva', hex: '#85934a' },
  { name: 'verde', hex: '#4f7a4f' },
  { name: 'salvia', hex: '#bcc989' },
  { name: 'menta', hex: '#a3c9b0' },
  { name: 'blu', hex: '#3b5b7a' },
  { name: 'azzurro', hex: '#7fa8c9' },
  { name: 'tortora', hex: '#6b6b6b' },
  { name: 'grigio', hex: '#9a9a9a' },
  { name: 'antracite', hex: '#3a3a3a' },
  { name: 'nero', hex: '#2b2b2b' },
  { name: 'marrone', hex: '#6b4f3f' },
  { name: 'cammello', hex: '#b08d57' },
  { name: 'senape', hex: '#c9a227' },
  { name: 'giallo', hex: '#e3c34a' },
  { name: 'viola', hex: '#6d5b8a' },
  { name: 'lavanda', hex: '#b3a6c9' },
  { name: 'petrolio', hex: '#2f5d62' },
  { name: 'rust', hex: '#9c5a3c' },
];

export function hexForColor(name: string): string {
  const found = NAMED_COLORS.find((c) => c.name.toLowerCase() === name.toLowerCase());
  return found ? found.hex : '#c8b89a';
}

export function colorNameFromHex(hex: string): string {
  const found = NAMED_COLORS.find((c) => c.hex.toLowerCase() === hex.toLowerCase());
  return found ? found.name : 'neutro';
}

function hexToRgb(hex: string): { r: number; g: number; b: number } {
  const m = hex.replace('#', '');
  const full = m.length === 3 ? m.split('').map((x) => x + x).join('') : m;
  const n = parseInt(full, 16);
  return { r: (n >> 16) & 255, g: (n >> 8) & 255, b: n & 255 };
}

function rgbToHsl(r: number, g: number, b: number): { h: number; s: number; l: number } {
  r /= 255; g /= 255; b /= 255;
  const max = Math.max(r, g, b), min = Math.min(r, g, b);
  let h = 0;
  const l = (max + min) / 2;
  const d = max - min;
  const s = d === 0 ? 0 : d / (1 - Math.abs(2 * l - 1));
  if (d !== 0) {
    switch (max) {
      case r: h = ((g - b) / d) % 6; break;
      case g: h = (b - r) / d + 2; break;
      default: h = (r - g) / d + 4; break;
    }
    h *= 60;
    if (h < 0) h += 360;
  }
  return { h, s, l };
}

function hslOf(hex: string): { h: number; s: number; l: number } {
  const { r, g, b } = hexToRgb(hex);
  return rgbToHsl(r, g, b);
}

function hueDistance(a: number, b: number): number {
  const d = Math.abs(a - b) % 360;
  return Math.min(d, 360 - d);
}

export const MAX_HARMONY_COLORS = 8;

const NEUTRAL_SATURATION = 0.15;
const HARMONY_HUE_OFFSETS = [30, 150, 180, 210, 330];
const TRIAD_HUE_OFFSETS = [120, 240];

export interface ColorHarmony {
  colors: NamedColor[];
  description: string;
}

function scoreAgainstChromaticBase(
  base: { h: number; s: number; l: number },
  candidate: { h: number; s: number; l: number },
): number | null {
  if (candidate.s < NEUTRAL_SATURATION) {
    return 60 + Math.abs(candidate.l - base.l) * 40;
  }

  const dh = hueDistance(base.h, candidate.h);
  const dl = Math.abs(candidate.l - base.l);

  if (dh < 20 && dl < 0.2) return null;
  if (base.s > 0.5 && candidate.s > 0.5 && dh > 50 && dh < 130) return null;

  const offsetDiff = Math.min(
    ...HARMONY_HUE_OFFSETS.map((o) => Math.abs(dh - o)),
    ...TRIAD_HUE_OFFSETS.map((o) => Math.abs(dh - o) + 15),
  );
  return 100 - offsetDiff * 2 + Math.min(dl, 0.4) * 20;
}

function scoreAgainstNeutralBase(
  base: { h: number; s: number; l: number },
  candidate: { h: number; s: number; l: number },
): number | null {
  const dl = Math.abs(candidate.l - base.l);
  if (candidate.s < NEUTRAL_SATURATION) {
    return dl < 0.08 ? null : 55 + dl * 40;
  }
  return 60 + candidate.s * 40 + dl * 20;
}

// Suggerisce fino a MAX_HARMONY_COLORS colori coordinati con un colore di base.
export function suggestHarmony(baseHex: string): ColorHarmony {
  const base = hslOf(baseHex);
  const baseIsNeutral = base.s < NEUTRAL_SATURATION;
  const scoreFn = baseIsNeutral ? scoreAgainstNeutralBase : scoreAgainstChromaticBase;

  const colors = NAMED_COLORS
    .filter((c) => c.hex.toLowerCase() !== baseHex.toLowerCase())
    .map((c) => ({ color: c, score: scoreFn(base, hslOf(c.hex)) }))
    .filter((x): x is { color: NamedColor; score: number } => x.score !== null)
    .sort((a, b) => b.score - a.score)
    .slice(0, MAX_HARMONY_COLORS)
    .map((x) => x.color);

  if (baseIsNeutral) {
    return {
      colors,
      description:
        'Essendo un colore neutro, si abbina bene con toni caldi e colori accesi, oppure con altri neutri a contrasto di luminosità.',
    };
  }

  return {
    colors,
    description:
      'Gli abbinamenti sono ordinati per affinità: prima i toni vicini e armonici, poi quelli a contrasto e i colori che bilanciano l\'insieme.',
  };
}

// Contrasto leggibilità per testo su sfondo
export function readableTextColor(bgHex: string): string {
  const { r, g, b } = hexToRgb(bgHex);
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  return luminance > 0.6 ? '#3a3530' : '#fdfbf7';
}
