import { useRef, useState } from 'react';
import { Sparkles } from 'lucide-react';
import { PageHeader, EmptyState, Banner, Spinner } from '@/components/ui';
import { useGarments, type GarmentWithUrl } from '@/lib/garments';
import { generateOutfit, type OutfitProposal } from '@/lib/ai';
import { OCCASIONS, OUTFIT_ROLES, type Occasion } from '@/lib/types';

const MAX_OUTFIT_ITEMS = 4;

interface OutfitLook {
  name: string;
  reason: string;
  tips?: string;
  items: { garment: GarmentWithUrl; role: string }[];
  missing: string[];
}

type OutfitState =
  | { status: 'idle' }
  | { status: 'loading' }
  | { status: 'error'; message: string }
  | { status: 'ready'; look: OutfitLook };

function missingPieces(wardrobe: GarmentWithUrl[], chosen: GarmentWithUrl[]): string[] {
  const missing: string[] = [];
  const has = (list: GarmentWithUrl[], category: string) => list.some((g) => g.category === category);

  if (!has(chosen, 'scarpe')) {
    missing.push(
      has(wardrobe, 'scarpe')
        ? 'Non hai inserito scarpe in questo outfit: aggiungile per completarlo.'
        : 'Non hai ancora scarpe nel guardaroba.'
    );
  }
  if (!has(chosen, 'accessorio')) {
    missing.push(
      has(wardrobe, 'accessorio')
        ? 'Non hai inserito accessori in questo outfit.'
        : 'Non hai ancora accessori nel guardaroba.'
    );
  }
  return missing;
}

function buildLook(proposal: OutfitProposal, wardrobe: GarmentWithUrl[]): OutfitLook | null {
  const byId = new Map(wardrobe.map((g) => [g.id, g]));
  const seen = new Set<string>();
  const items: OutfitLook['items'] = [];

  for (const item of proposal.items) {
    const garment = byId.get(item.garment_id);
    if (!garment || seen.has(garment.id)) continue;
    seen.add(garment.id);
    items.push({ garment, role: item.role });
    if (items.length === MAX_OUTFIT_ITEMS) break;
  }
  if (items.length === 0) return null;

  return {
    name: proposal.name,
    reason: proposal.reason,
    tips: proposal.tips,
    items,
    missing: missingPieces(wardrobe, items.map((i) => i.garment)),
  };
}

export function OutfitPage() {
  const { garments } = useGarments();
  const [occasion, setOccasion] = useState<Occasion | null>(null);
  const [state, setState] = useState<OutfitState>({ status: 'idle' });
  const requestRef = useRef(0);

  const choose = async (value: Occasion) => {
    setOccasion(value);
    const requestId = ++requestRef.current;
    setState({ status: 'loading' });

    const res = await generateOutfit(garments, value);
    if (requestId !== requestRef.current) return;

    if (res.configured === false || res.error || !res.result) {
      setState({ status: 'error', message: res.error || 'Non sono riuscito a comporre un outfit. Riprova.' });
      return;
    }

    const look = buildLook(res.result, garments);
    setState(
      look
        ? { status: 'ready', look }
        : { status: 'error', message: 'Con i capi disponibili non riesco a comporre un outfit. Prova un’altra occasione o aggiungi altri capi.' }
    );
  };

  const occLabel = OCCASIONS.find((o) => o.value === occasion)?.label.toLowerCase();

  return (
    <div className="min-h-screen pb-24">
      <PageHeader title="Crea outfit" subtitle="Combinazioni dai tuoi capi per ogni occasione" />

      <div className="max-w-2xl mx-auto w-full px-5 space-y-5">
        {garments.length === 0 ? (
          <EmptyState icon={<Sparkles size={28} />} title="Aggiungi prima qualche capo" hint="Serve almeno un capo nel guardaroba per comporre un outfit." />
        ) : (
          <>
            <div className="card p-4">
              <p className="label">Occasione</p>
              <div className="flex flex-wrap gap-2">
                {OCCASIONS.map((o) => (
                  <button key={o.value} onClick={() => choose(o.value)} className={occasion === o.value ? 'chip-active' : 'chip-idle'}>
                    {o.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="card p-5 animate-fade-up">
              <div className="flex items-center gap-2 mb-3">
                <Sparkles size={18} className="text-terracotta-600" />
                <h2 className="font-display text-lg text-cream-900">
                  {state.status === 'ready' ? state.look.name : 'Abbinamento'}
                </h2>
              </div>

              {state.status === 'idle' && (
                <p className="text-sm text-cream-700">Scegli un’occasione per ricevere un abbinamento dai tuoi capi.</p>
              )}

              {state.status === 'loading' && <Spinner label={`Compongo un outfit per ${occLabel ?? 'l’occasione'}…`} />}

              {state.status === 'error' && <Banner tone="warn">{state.message}</Banner>}

              {state.status === 'ready' && (
                <div className="space-y-4">
                  <p className="text-sm text-cream-700">
                    Un abbinamento dai tuoi capi per <strong>{occLabel}</strong>.
                  </p>

                  <div className={`grid gap-2.5 ${state.look.items.length === 1 ? 'grid-cols-1 max-w-[50%]' : 'grid-cols-2'}`}>
                    {state.look.items.map(({ garment, role }) => (
                      <div key={garment.id} className="rounded-xl overflow-hidden border border-cream-200 bg-cream-50">
                        <div className="aspect-square" style={{ backgroundColor: garment.color_hex }}>
                          {garment.imageUrl && (
                            <img src={garment.imageUrl} alt={garment.name} loading="lazy" decoding="async" className="w-full h-full object-cover" />
                          )}
                        </div>
                        <div className="p-2.5">
                          <p className="text-[10px] uppercase text-cream-500">{OUTFIT_ROLES.find((r) => r.value === role)?.label ?? role}</p>
                          <p className="text-sm font-medium text-cream-900 truncate">{garment.name}</p>
                        </div>
                      </div>
                    ))}
                  </div>

                  {state.look.reason && <p className="text-sm text-cream-700 leading-relaxed">{state.look.reason}</p>}
                  {state.look.tips && <p className="text-sm text-cream-600 leading-relaxed">{state.look.tips}</p>}

                  {state.look.missing.length > 0 && (
                    <Banner tone="info">
                      <ul className="space-y-1">
                        {state.look.missing.map((m) => (
                          <li key={m}>{m}</li>
                        ))}
                      </ul>
                    </Banner>
                  )}
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
