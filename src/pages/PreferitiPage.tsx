import { Heart, Shirt } from 'lucide-react';
import { PageHeader, EmptyState } from '@/components/ui';
import { useGarments, withImageUrls, toggleFavorite } from '@/lib/garments';
import { GarmentCard } from '@/components/GarmentCard';
import { useRouter } from '@/lib/router';
import { useMemo } from 'react';

export function PreferitiPage() {
  const { navigate } = useRouter();
  const { garments, reload } = useGarments();

  const favGarments = useMemo(() => withImageUrls(garments).filter((g) => g.favorite), [garments]);

  return (
    <div className="min-h-screen pb-24">
      <PageHeader title="Preferiti" subtitle="I capi che ami di più" />

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
                  onDelete={() => navigate('guardaroba')}
                  onClick={() => navigate('guardaroba')}
                />
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
