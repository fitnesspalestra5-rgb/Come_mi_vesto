import { useMemo, useState } from 'react';
import { Palette, Sparkles } from 'lucide-react';
import { PageHeader, EmptyState } from '@/components/ui';
import { useGarments, withSignedUrls } from '@/lib/garments';
import { suggestHarmony, readableTextColor, NAMED_COLORS } from '@/lib/colors';
import { useEffect } from 'react';

export function ColoriPage() {
  const { garments } = useGarments();
  const [selected, setSelected] = useState<string>('');
  const [customHex, setCustomHex] = useState('#b25139');

  useEffect(() => {
    if (garments.length && !selected) {
      setSelected(garments[0].color_hex);
    }
  }, [garments, selected]);

  const harmony = useMemo(() => suggestHarmony(selected || customHex), [selected, customHex]);

  return (
    <div className="min-h-screen pb-24">
      <PageHeader title="Abbinamento colori" subtitle="Scegli un capo o un colore e scopri le combinazioni" />

      <div className="max-w-2xl mx-auto w-full px-5 space-y-5">
        {garments.length > 0 && (
          <div>
            <p className="label">Dai tuoi capi</p>
            <div className="flex flex-wrap gap-2">
              {garments.slice(0, 12).map((g) => (
                <button
                  key={g.id}
                  onClick={() => setSelected(g.color_hex)}
                  className={`chip ${selected === g.color_hex ? 'ring-2 ring-terracotta-400' : ''}`}
                  style={{ backgroundColor: g.color_hex, color: readableTextColor(g.color_hex) }}
                >
                  {g.color}
                </button>
              ))}
            </div>
          </div>
        )}

        <div className="card p-4">
          <p className="label">Oppure scegli un colore</p>
          <div className="flex items-center gap-3">
            <input type="color" value={selected || customHex} onChange={(e) => { setSelected(e.target.value); setCustomHex(e.target.value); }} className="w-14 h-12 rounded-lg border border-cream-300 cursor-pointer" />
            <div className="flex flex-wrap gap-1.5">
              {NAMED_COLORS.slice(0, 14).map((c) => (
                <button
                  key={c.name}
                  onClick={() => setSelected(c.hex)}
                  className="w-7 h-7 rounded-full border-2 border-cream-100 hover:scale-110 transition"
                  style={{ backgroundColor: c.hex }}
                  title={c.name}
                />
              ))}
            </div>
          </div>
        </div>

        <div className="card p-5 animate-fade-up">
          <div className="flex items-center gap-2 mb-3">
            <Sparkles size={18} className="text-terracotta-600" />
            <h2 className="font-display text-lg text-cream-900">Colori coordinati</h2>
          </div>

          <div className="rounded-2xl p-4 mb-4 text-center" style={{ backgroundColor: selected || customHex, color: readableTextColor(selected || customHex) }}>
            <p className="text-xs uppercase tracking-wide opacity-80">Colore base</p>
            <p className="font-display text-xl">{harmony.colors.length} abbinamenti</p>
          </div>

          <div className="grid grid-cols-2 gap-2.5">
            {harmony.colors.map((c) => (
              <div key={c.name} className="rounded-xl overflow-hidden border border-cream-200">
                <div className="h-16" style={{ backgroundColor: c.hex }} />
                <div className="p-2.5 bg-cream-50">
                  <p className="text-sm font-medium text-cream-900 capitalize">{c.name}</p>
                  <p className="text-[11px] text-cream-500 uppercase">{c.hex}</p>
                </div>
              </div>
            ))}
          </div>

          <p className="text-sm text-cream-700 mt-4 leading-relaxed">{harmony.description}</p>
        </div>

        {garments.length === 0 && (
          <EmptyState icon={<Palette size={28} />} title="Aggiungi capi per scoprire abbinamenti" hint="I tuoi colori appariranno qui come punto di partenza." />
        )}
      </div>
    </div>
  );
}
