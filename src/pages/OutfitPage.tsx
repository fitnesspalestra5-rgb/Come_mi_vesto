import { useMemo, useState } from 'react';
import { Sparkles } from 'lucide-react';
import { PageHeader, EmptyState } from '@/components/ui';
import { useGarments, withImageUrls } from '@/lib/garments';
import { OCCASIONS, type Occasion } from '@/lib/types';

export function OutfitPage() {
  const { garments } = useGarments();
  const [occasion, setOccasion] = useState<Occasion>('tempo_libero');

  const withUrls = useMemo(() => withImageUrls(garments), [garments]);

  const suggestion = useMemo(() => {
    const bySection = (s: string) => withUrls.find((g) => g.avatar_section === s);
    return { busto: bySection('busto'), gambe: bySection('gambe'), scarpe: bySection('scarpe') };
  }, [withUrls]);

  const occLabel = OCCASIONS.find((o) => o.value === occasion)?.label ?? occasion;

  return (
    <div className="min-h-screen pb-24">
      <PageHeader title="Crea outfit" subtitle="Combinazioni dai tuoi capi per ogni occasione" />

      <div className="max-w-2xl mx-auto w-full px-5 space-y-5">
        {garments.length === 0 ? (
          <EmptyState icon={<Sparkles size={28} />} title="Aggiungi prima qualche capo" hint="Servono almeno due capi nel guardaroba per comporre un outfit." />
        ) : (
          <>
            <div className="card p-4">
              <p className="label">Occasione</p>
              <div className="flex flex-wrap gap-2">
                {OCCASIONS.map((o) => (
                  <button key={o.value} onClick={() => setOccasion(o.value)} className={occasion === o.value ? 'chip-active' : 'chip-idle'}>
                    {o.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="card p-5 animate-fade-up">
              <div className="flex items-center gap-2 mb-3">
                <Sparkles size={18} className="text-terracotta-600" />
                <h2 className="font-display text-lg text-cream-900">Suggerimento rapido</h2>
              </div>
              <p className="text-sm text-cream-700 mb-4">
                Un abbinamento dai tuoi capi per <strong>{occLabel.toLowerCase()}</strong>:
              </p>

              <div className="grid grid-cols-3 gap-2.5">
                {(['busto', 'gambe', 'scarpe'] as const).map((sec) => {
                  const g = suggestion[sec];
                  return (
                    <div key={sec} className="rounded-xl overflow-hidden border border-cream-200 bg-cream-50">
                      <div className="aspect-square bg-cream-100">
                        {g?.imageUrl ? (
                          <img src={g.imageUrl} alt={g.name} loading="lazy" decoding="async" className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-cream-400 text-xs">—</div>
                        )}
                      </div>
                      <div className="p-2">
                        <p className="text-[10px] uppercase text-cream-500">{sec}</p>
                        <p className="text-xs font-medium text-cream-900 truncate">{g?.name ?? 'nessuno'}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
