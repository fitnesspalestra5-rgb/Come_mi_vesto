import { useEffect, useState } from 'react';
import { Heart, Shirt, Sparkles } from 'lucide-react';
import { PageHeader, EmptyState } from '@/components/ui';
import { useGarments, withSignedUrls, toggleFavorite, type GarmentWithUrl } from '@/lib/garments';
import { GarmentCard } from '@/components/GarmentCard';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/lib/auth';
import { OCCASIONS } from '@/lib/types';
import { getSignedImageUrl } from '@/lib/images';
import { useRouter } from '@/lib/router';

interface FavOutfit {
  id: string;
  name: string;
  occasion: string;
  notes: string | null;
  items: { name: string; image_url: string | null; color_hex: string }[];
}

export function PreferitiPage() {
  const { user } = useAuth();
  const { navigate } = useRouter();
  const { garments, reload } = useGarments();
  const [withUrls, setWithUrls] = useState<GarmentWithUrl[]>([]);
  const [favOutfits, setFavOutfits] = useState<FavOutfit[]>([]);

  useEffect(() => { withSignedUrls(garments).then(setWithUrls); }, [garments]);

  const loadFavOutfits = async () => {
    if (!user) return;
    const { data: outfits } = await supabase.from('outfits').select('*').eq('user_id', user.id).eq('favorite', true).order('created_at', { ascending: false });
    if (!outfits) return;
    const enriched = await Promise.all(outfits.map(async (o) => {
      const { data: items } = await supabase.from('outfit_items').select('garment_id').eq('outfit_id', o.id);
      const garmentsById = new Map(garments.map((g) => [g.id, g]));
      const itemsData = await Promise.all((items ?? []).map(async (it) => {
        const g = garmentsById.get(it.garment_id);
        const url = g?.image_path ? await getSignedImageUrl(g.image_path) : null;
        return { name: g?.name ?? 'Capo', image_url: url, color_hex: g?.color_hex ?? '#c8b89a' };
      }));
      return { id: o.id, name: o.name, occasion: o.occasion, notes: o.notes, items: itemsData };
    }));
    setFavOutfits(enriched);
  };

  useEffect(() => { loadFavOutfits(); }, [user, garments]);

  const favGarments = withUrls.filter((g) => g.favorite);
  const occLabel = (v: string) => OCCASIONS.find((o) => o.value === v)?.label ?? v;

  return (
    <div className="min-h-screen pb-24">
      <PageHeader title="Preferiti" subtitle="I capi e gli outfit che ami di più" />

      <div className="max-w-2xl mx-auto w-full px-5 space-y-6">
        <section>
          <div className="flex items-center gap-2 mb-3">
            <Shirt size={18} className="text-terracotta-600" />
            <h2 className="font-display text-lg text-cream-900">Capi preferiti</h2>
            <span className="text-xs text-cream-500">({favGarments.length})</span>
          </div>
          {favGarments.length === 0 ? (
            <EmptyState icon={<Heart size={26} />} title="Nessun capo preferito" hint="Tocca il cuore su un capo per ritrovarlo qui." />
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {favGarments.map((g) => (
                <GarmentCard
                  key={g.id}
                  garment={g}
                  onToggleFav={async () => { await toggleFavorite(g); reload(); }}
                  onDelete={() => {}}
                  onClick={() => navigate('guardaroba')}
                />
              ))}
            </div>
          )}
        </section>

        <section>
          <div className="flex items-center gap-2 mb-3">
            <Sparkles size={18} className="text-terracotta-600" />
            <h2 className="font-display text-lg text-cream-900">Outfit preferiti</h2>
            <span className="text-xs text-cream-500">({favOutfits.length})</span>
          </div>
          {favOutfits.length === 0 ? (
            <EmptyState icon={<Sparkles size={26} />} title="Nessun outfit preferito" hint="Salva un outfit e tocca il cuore per aggiungerlo qui." />
          ) : (
            <div className="space-y-3">
              {favOutfits.map((o) => (
                <div key={o.id} className="card p-4">
                  <p className="font-medium text-cream-900">{o.name}</p>
                  <p className="text-xs text-cream-600 mb-3">{occLabel(o.occasion)}</p>
                  <div className="flex gap-2 overflow-x-auto pb-1">
                    {o.items.map((it, i) => (
                      <div key={i} className="flex-shrink-0 w-16">
                        <div className="w-16 h-16 rounded-lg overflow-hidden bg-cream-100">
                          {it.image_url ? <img src={it.image_url} alt="" className="w-full h-full object-cover" /> : <div className="w-full h-full" style={{ backgroundColor: it.color_hex }} />}
                        </div>
                        <p className="text-[10px] text-cream-600 mt-1 truncate">{it.name}</p>
                      </div>
                    ))}
                  </div>
                  {o.notes && <p className="text-xs text-cream-600 mt-2">{o.notes}</p>}
                </div>
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
