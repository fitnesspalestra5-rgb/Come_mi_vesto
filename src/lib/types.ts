export type Category =
  | 'maglia'
  | 'maglione'
  | 'camicia'
  | 'felpa'
  | 'giacca'
  | 'cappotto'
  | 'pantalone'
  | 'jeans'
  | 'gonna'
  | 'vestito'
  | 'scarpe'
  | 'accessorio';

export type GarmentSeason = 'Primavera/Estate' | 'Autunno/Inverno' | 'Quattro stagioni';
export type GarmentMaterial = 'Cotone' | 'Lino' | 'Denim' | 'Lana' | 'Poliestere' | 'Misto' | 'Pelle / Camoscio';
export type AvatarSection = 'busto' | 'gambe' | 'scarpe';

export type Occasion =
  | 'lavoro'
  | 'tempo_libero'
  | 'serata'
  | 'cerimonia'
  | 'sport'
  | 'vacanze';

export type OutfitRole = 'top' | 'bottom' | 'outer' | 'shoes' | 'accessory';

export interface Garment {
  id: string;
  user_id: string;
  name: string;
  category: Category | string;
  color: string;
  color_hex: string;
  image_path: string | null;
  notes: string | null;
  season: GarmentSeason | null;
  material: GarmentMaterial | null;
  avatar_section: AvatarSection | null;
  favorite: boolean;
  created_at: string;
}

export interface OutfitItem {
  id: string;
  outfit_id: string;
  garment_id: string;
  role: OutfitRole | string;
  created_at: string;
  garment?: Garment;
}

export interface Outfit {
  id: string;
  user_id: string;
  name: string;
  occasion: Occasion | string;
  weather_note: string | null;
  notes: string | null;
  favorite: boolean;
  created_at: string;
  items?: OutfitItem[];
}

export const CATEGORIES: { value: Category; label: string }[] = [
  { value: 'maglia', label: 'Maglia' },
  { value: 'maglione', label: 'Maglione' },
  { value: 'camicia', label: 'Camicia' },
  { value: 'felpa', label: 'Felpa' },
  { value: 'giacca', label: 'Giacca' },
  { value: 'cappotto', label: 'Cappotto' },
  { value: 'pantalone', label: 'Pantalone' },
  { value: 'jeans', label: 'Jeans' },
  { value: 'gonna', label: 'Gonna' },
  { value: 'vestito', label: 'Vestito' },
  { value: 'scarpe', label: 'Scarpe' },
  { value: 'accessorio', label: 'Accessorio' },
];

export const OCCASIONS: { value: Occasion; label: string }[] = [
  { value: 'lavoro', label: 'Lavoro' },
  { value: 'tempo_libero', label: 'Tempo libero' },
  { value: 'serata', label: 'Serata' },
  { value: 'cerimonia', label: 'Cerimonia' },
  { value: 'sport', label: 'Sport' },
  { value: 'vacanze', label: 'Vacanze' },
];

export const OUTFIT_ROLES: { value: OutfitRole; label: string }[] = [
  { value: 'top', label: 'Sopra' },
  { value: 'bottom', label: 'Sotto' },
  { value: 'outer', label: 'Esterno' },
  { value: 'shoes', label: 'Scarpe' },
  { value: 'accessory', label: 'Accessorio' },
];
