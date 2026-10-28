import { useMemo } from 'react';
import { Shirt, Heart, Cloud, Palette, Camera, ArrowRight, Sparkles } from 'lucide-react';
import { useAuth } from '@/lib/auth';
import { useRouter } from '@/lib/router';
import { BG } from '@/lib/backgrounds';
import { useGarments, withImageUrls } from '@/lib/garments';

export function HomePage() {
  const { user } = useAuth();
  const { navigate } = useRouter();
  const { garments } = useGarments();

  const recent = useMemo(() => withImageUrls(garments.slice(0, 6)), [garments]);
  const favoriteCount = useMemo(() => garments.filter((g) => g.favorite).length, [garments]);

  const name = user?.email?.split('@')[0] ?? 'bellə';

  return (
    <div className="relative min-h-screen pb-24">
      <div className="relative h-[46vh] min-h-[300px]">
        <img
          src={BG.home}
          alt=""
          decoding="async"
          className="absolute inset-0 w-full h-full object-cover object-top"
          style={{ objectPosition: 'center top' }}
        />
        <div className="absolute inset-0 bg-gradient-to-b from-cream-50/70 via-cream-50/10 to-cream-900/40" />
        <div className="relative z-10 h-full flex flex-col justify-end px-6 pb-6 pt-[calc(0.5rem+env(safe-area-inset-top))] max-w-2xl mx-auto w-full">
          <p className="text-cream-100 text-sm text-shadow-soft">Bentornatə</p>
          <h1 className="text-3xl font-display font-semibold text-cream-50 text-shadow-soft capitalize">{name}</h1>
        </div>
      </div>

      <div className="max-w-2xl mx-auto w-full px-5 -mt-6 relative z-10 space-y-5">
        <div className="card p-5 animate-fade-up">
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-display text-lg text-cream-900">Il tuo guardaroba</h2>
            <button onClick={() => navigate('guardaroba')} className="text-terracotta-600 text-sm font-medium flex items-center gap-1">
              Vedi <ArrowRight size={14} />
            </button>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Stat label="Capi" value={garments.length} icon={<Shirt size={16} />} />
            <Stat label="Preferiti" value={favoriteCount} icon={<Heart size={16} />} />
          </div>
        </div>

        <button
          onClick={() => navigate('guardaroba', { action: 'add' })}
          className="btn-primary w-full animate-fade-up"
          style={{ animationDelay: '80ms' }}
        >
          <Camera size={18} /> Aggiungi un capo
        </button>

        <div className="grid grid-cols-3 gap-3 animate-fade-up" style={{ animationDelay: '140ms' }}>
          <QuickCard icon={<Sparkles size={20} />} label="Crea outfit" onClick={() => navigate('outfit')} />
          <QuickCard icon={<Palette size={20} />} label="Abbinamenti" onClick={() => navigate('colori')} />
          <QuickCard icon={<Cloud size={20} />} label="Meteo" onClick={() => navigate('meteo')} />
        </div>

        {recent.length > 0 && (
          <div className="animate-fade-up" style={{ animationDelay: '200ms' }}>
            <h2 className="font-display text-lg text-cream-900 mb-3 px-1">In evidenza</h2>
            <div className="grid grid-cols-3 gap-2.5">
              {recent.map((r) => (
                <div key={r.id} className="aspect-square rounded-xl overflow-hidden bg-cream-100 shadow-soft">
                  <img src={r.imageUrl ?? ''} alt={r.name} loading="lazy" decoding="async" className="w-full h-full object-cover" />
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function Stat({ label, value, icon }: { label: string; value: number; icon: React.ReactNode }) {
  return (
    <div className="rounded-xl bg-cream-100 p-3.5">
      <div className="flex items-center gap-2 text-cream-600 text-xs mb-1">
        {icon} {label}
      </div>
      <p className="text-2xl font-display font-semibold text-cream-900">{value}</p>
    </div>
  );
}

function QuickCard({ icon, label, onClick }: { icon: React.ReactNode; label: string; onClick: () => void }) {
  return (
    <button onClick={onClick} className="card p-4 flex flex-col items-center gap-2 hover:shadow-soft transition">
      <span className="text-terracotta-600">{icon}</span>
      <span className="text-xs font-medium text-cream-800 text-center">{label}</span>
    </button>
  );
}
