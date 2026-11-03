import { useState } from 'react';
import { Plus, X } from 'lucide-react';
import type { GarmentColor } from '@/lib/types';
import { NAMED_COLORS } from '@/lib/colors';

export const MAX_GARMENT_COLORS = 3;

interface Props {
  palette: GarmentColor[];
  onChange: (palette: GarmentColor[]) => void;
}

type PickerMode = { kind: 'replace'; index: number } | { kind: 'add' } | null;

export function GarmentColorPicker({ palette, onChange }: Props) {
  const [mode, setMode] = useState<PickerMode>(null);

  const usedNames = new Set(palette.map((c) => c.name));
  const canAdd = palette.length < MAX_GARMENT_COLORS;

  const isActive = (index: number) => mode?.kind === 'replace' && mode.index === index;

  const remove = (index: number) => {
    onChange(palette.filter((_, i) => i !== index));
    setMode(null);
  };

  const pick = (color: GarmentColor) => {
    if (mode?.kind === 'replace') {
      onChange(palette.map((c, i) => (i === mode.index ? color : c)));
    } else if (mode?.kind === 'add' && canAdd) {
      onChange([...palette, color]);
    }
    setMode(null);
  };

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap gap-2">
        {palette.map((c, index) => (
          <div
            key={`${c.name}-${index}`}
            className={`inline-flex items-center rounded-full border bg-cream-50 py-1 pl-1 pr-1 text-sm text-cream-900 transition ${
              isActive(index) ? 'border-terracotta-500 ring-2 ring-terracotta-200' : 'border-cream-300'
            }`}
          >
            <button
              type="button"
              onClick={() => setMode(isActive(index) ? null : { kind: 'replace', index })}
              title="Sostituisci questo colore"
              className="inline-flex items-center gap-2 rounded-full py-0.5 pr-2 hover:text-terracotta-600"
            >
              <span className="h-6 w-6 rounded-full border border-cream-300" style={{ backgroundColor: c.hex }} />
              {c.name}
            </button>
            <button
              type="button"
              onClick={() => remove(index)}
              disabled={palette.length <= 1}
              aria-label={`Elimina il colore ${c.name}`}
              className="ml-1 rounded-full p-1 text-cream-500 hover:bg-cream-200 hover:text-cream-900 disabled:cursor-not-allowed disabled:opacity-40"
            >
              <X size={14} />
            </button>
          </div>
        ))}
        {canAdd && (
          <button
            type="button"
            onClick={() => setMode(mode?.kind === 'add' ? null : { kind: 'add' })}
            className={`inline-flex items-center gap-1 rounded-full border border-dashed px-3 py-1.5 text-sm transition ${
              mode?.kind === 'add'
                ? 'border-terracotta-500 text-terracotta-600'
                : 'border-cream-400 text-cream-700 hover:bg-cream-100'
            }`}
          >
            <Plus size={14} /> Aggiungi colore
          </button>
        )}
      </div>

      {palette.length === 0 && (
        <p className="text-sm text-cream-500">Nessun colore rilevato: scegli una foto del capo oppure aggiungi un colore.</p>
      )}

      {mode && (
        <div className="rounded-xl border border-cream-200 bg-cream-50 p-3 animate-fade-in">
          <p className="text-xs font-medium text-cream-700 mb-2">
            {mode.kind === 'replace' ? 'Scegli il colore che sostituisce quello selezionato' : 'Scegli il colore da aggiungere'}
          </p>
          <div className="grid grid-cols-4 sm:grid-cols-5 gap-2">
            {NAMED_COLORS.map((c) => {
              const used = usedNames.has(c.name) && !(mode.kind === 'replace' && palette[mode.index]?.name === c.name);
              return (
                <button
                  key={c.name}
                  type="button"
                  disabled={used}
                  onClick={() => pick({ name: c.name, hex: c.hex })}
                  className="flex flex-col items-center gap-1 rounded-lg p-1.5 transition hover:bg-cream-100 disabled:cursor-not-allowed disabled:opacity-35"
                >
                  <span className="h-8 w-8 rounded-full border border-cream-300" style={{ backgroundColor: c.hex }} />
                  <span className="text-[11px] leading-tight text-cream-800">{c.name}</span>
                </button>
              );
            })}
          </div>
          <button type="button" onClick={() => setMode(null)} className="mt-2 text-xs font-medium text-cream-600 hover:text-cream-900">
            Annulla
          </button>
        </div>
      )}
    </div>
  );
}
