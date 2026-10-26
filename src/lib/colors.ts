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

export interface ColorHarmony {
  colors: NamedColor[];
  description: string;
}

// Suggerisce colori coordinati con un colore di base, con spiegazione.
export function suggestHarmony(baseHex: string): ColorHarmony {
  const { r, g, b } = hexToRgb(baseHex);
  const { h, s, l } = rgbToHsl(r, g, b);

  const nearest = (targetH: number): NamedColor => {
    let best = NAMED_COLORS[0];
    let bestDist = Infinity;
    for (const c of NAMED_COLORS) {
      const rgb = hexToRgb(c.hex);
      const hsl = rgbToHsl(rgb.r, rgb.g, rgb.b);
      // distanza pesata su hue + luminanza
      const dh = Math.min(Math.abs(hsl.h - targetH), 360 - Math.abs(hsl.h - targetH));
      const dl = Math.abs(hsl.l - l);
      const dist = dh * 1.5 + dl * 1.0 + Math.abs(hsl.s - s) * 0.5;
      if (dist < bestDist) {
        bestDist = dist;
        best = c;
      }
    }
    return best;
  };

  const analog1 = nearest((h + 30) % 360);
  const analog2 = nearest((h + 330) % 360);
  const comp = nearest((h + 180) % 360);
  const neutral = NAMED_COLORS.find((c) => c.name === 'beige')!;

  if (s < 0.15) {
    return {
      colors: [NAMED_COLORS.find((c) => c.name === 'terracotta')!, NAMED_COLORS.find((c) => c.name === 'oliva')!, comp],
      description:
        'Essendo un colore neutro, si abbina con toni caldi come terracotta e oliva, o con un colore complementare acceso per dare carattere.',
    };
  }

  return {
    colors: [analog1, analog2, comp, neutral],
    description:
      `Toni analoghi (${analog1.name}, ${analog2.name}) creano armonia morbida; il complementare (${comp.name}) aggiunge contrasto; il beige bilancia l'insieme.`,
  };
}

// Contrasto leggibilità per testo su sfondo
export function readableTextColor(bgHex: string): string {
  const { r, g, b } = hexToRgb(bgHex);
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  return luminance > 0.6 ? '#3a3530' : '#fdfbf7';
}
