import { colorNameFromHex } from '@/lib/colors';
import type { GarmentColor } from '@/lib/types';

const MAX_COLORS = 3;
const MIN_SHARE = 0.15;
const ITERATIONS = 12;
const LIGHT_BACKGROUND = 0.93;

type Rgb = [number, number, number];

function toHex([r, g, b]: Rgb): string {
  return `#${[r, g, b].map((v) => Math.round(v).toString(16).padStart(2, '0')).join('')}`;
}

function distance(a: Rgb, b: Rgb): number {
  return (a[0] - b[0]) ** 2 + (a[1] - b[1]) ** 2 + (a[2] - b[2]) ** 2;
}

function mean(points: Rgb[]): Rgb {
  const sum = points.reduce<Rgb>((acc, p) => [acc[0] + p[0], acc[1] + p[1], acc[2] + p[2]], [0, 0, 0]);
  return [sum[0] / points.length, sum[1] / points.length, sum[2] / points.length];
}

// Centri iniziali deterministici: il centro medio, poi i colori più lontani tra loro.
function initialCenters(points: Rgb[], k: number): Rgb[] {
  const centers: Rgb[] = [mean(points)];
  while (centers.length < k) {
    let farthest = points[0];
    let farthestDistance = -1;
    for (const p of points) {
      const nearest = Math.min(...centers.map((c) => distance(p, c)));
      if (nearest > farthestDistance) {
        farthest = p;
        farthestDistance = nearest;
      }
    }
    centers.push(farthest);
  }
  return centers;
}

// Estrae fino a 3 colori principali dai pixel di un capo; i colori dello stesso nome vengono uniti.
export function paletteFromPixels(data: Uint8ClampedArray): GarmentColor[] {
  const points: Rgb[] = [];
  for (let i = 0; i < data.length; i += 4) {
    const luminance = (0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2]) / 255;
    if (luminance > LIGHT_BACKGROUND) continue;
    points.push([data[i], data[i + 1], data[i + 2]]);
  }
  if (points.length === 0) return [];

  let centers = initialCenters(points, MAX_COLORS);
  let assignments = new Array<number>(points.length).fill(0);
  for (let iteration = 0; iteration < ITERATIONS; iteration++) {
    assignments = points.map((p) => {
      let best = 0;
      let bestDistance = Infinity;
      centers.forEach((c, index) => {
        const d = distance(p, c);
        if (d < bestDistance) {
          bestDistance = d;
          best = index;
        }
      });
      return best;
    });
    centers = centers.map((center, index) => {
      const members = points.filter((_, i) => assignments[i] === index);
      return members.length ? mean(members) : center;
    });
  }

  const counts = centers.map((_, index) => assignments.filter((a) => a === index).length);
  const order = centers
    .map((center, index) => ({ center, share: counts[index] / points.length }))
    .sort((a, b) => b.share - a.share);

  const palette: GarmentColor[] = [];
  for (const { center, share } of order) {
    if (palette.length > 0 && share < MIN_SHARE) continue;
    const name = colorNameFromHex(toHex(center));
    if (palette.some((c) => c.name === name)) continue;
    palette.push({ name, hex: toHex(center) });
  }
  return palette.slice(0, MAX_COLORS);
}
