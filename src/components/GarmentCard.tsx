import { Heart, Trash2 } from 'lucide-react';
import type { GarmentWithUrl } from '@/lib/garments';
import { readableTextColor } from '@/lib/colors';
import { CATEGORIES } from '@/lib/types';

export function GarmentCard({
  garment,
  onToggleFav,
  onDelete,
  onClick,
}: {
  garment: GarmentWithUrl;
  onToggleFav: () => void;
  onDelete: () => void;
  onClick: () => void;
}) {
  const textColor = readableTextColor(garment.color_hex);
  const catLabel = CATEGORIES.find((c) => c.value === garment.category)?.label ?? garment.category;

  return (
    <div className="card overflow-hidden group animate-fade-up">
      <button onClick={onClick} className="block w-full aspect-square bg-cream-100 relative">
        {garment.imageUrl ? (
          <img src={garment.imageUrl} alt={garment.name} loading="lazy" decoding="async" className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-cream-400 text-xs">Nessuna foto</div>
        )}
        <span
          className="absolute top-2 left-2 chip text-[10px]"
          style={{ backgroundColor: garment.color_hex, color: textColor }}
        >
          {garment.color}
        </span>
      </button>

      <div className="p-3">
        <div className="flex items-start justify-between gap-2">
          <button onClick={onClick} className="text-left flex-1 min-w-0">
            <p className="text-sm font-medium text-cream-900 truncate">{garment.name}</p>
            <p className="text-xs text-cream-600 capitalize">{catLabel}</p>
          </button>
          <div className="flex gap-1">
            <button
              onClick={onToggleFav}
              className={`p-1.5 rounded-lg transition ${garment.favorite ? 'text-terracotta-600 bg-terracotta-50' : 'text-cream-400 hover:text-cream-700 hover:bg-cream-100'}`}
              aria-label="Preferito"
            >
              <Heart size={16} fill={garment.favorite ? 'currentColor' : 'none'} />
            </button>
            <button
              onClick={onDelete}
              className="p-1.5 rounded-lg text-cream-400 hover:text-terracotta-700 hover:bg-terracotta-50 transition"
              aria-label="Elimina"
            >
              <Trash2 size={16} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
