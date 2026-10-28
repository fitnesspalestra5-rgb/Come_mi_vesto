import { useEffect, useMemo, useState } from 'react';
import { Search, Shirt, Plus, AlertTriangle, SlidersHorizontal } from 'lucide-react';
import { useRouter } from '@/lib/router';
import { useGarments, withImageUrls, deleteGarment, toggleFavorite, type GarmentWithUrl } from '@/lib/garments';
import { CATEGORIES } from '@/lib/types';
import { GarmentCard } from '@/components/GarmentCard';
import { GarmentForm } from '@/components/GarmentForm';
import { PageHeader, EmptyState, Banner } from '@/components/ui';
import type { Garment } from '@/lib/types';

const PAGE_SIZE = 12;

export function GuardarobaPage() {
  const { params } = useRouter();
  const { garments, loading, error, reload } = useGarments();
  const [query, setQuery] = useState('');
  const [catFilter, setCatFilter] = useState<string>('all');
  const [colorFilter, setColorFilter] = useState<string>('all');
  const [showFilters, setShowFilters] = useState(false);
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<Garment | null>(null);
  const [toDelete, setToDelete] = useState<GarmentWithUrl | null>(null);
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);

  useEffect(() => {
    if (params.action === 'add') {
      setEditing(null);
      setFormOpen(true);
    }
  }, [params.action]);

  useEffect(() => {
    setVisibleCount(PAGE_SIZE);
  }, [query, catFilter, colorFilter]);

  const colors = useMemo(() => {
    const set = new Map<string, string>();
    garments.forEach((g) => set.set(g.color, g.color_hex));
    return Array.from(set.entries()).map(([name, hex]) => ({ name, hex }));
  }, [garments]);

  const withUrls = useMemo(() => withImageUrls(garments), [garments]);

  const filtered = useMemo(() => {
    return withUrls.filter((g) => {
      if (catFilter !== 'all' && g.category !== catFilter) return false;
      if (colorFilter !== 'all' && g.color !== colorFilter) return false;
      if (query) {
        const q = query.toLowerCase();
        if (!g.name.toLowerCase().includes(q) && !g.color.toLowerCase().includes(q) && !g.category.toLowerCase().includes(q)) return false;
      }
      return true;
    });
  }, [withUrls, catFilter, colorFilter, query]);

  const visible = filtered.slice(0, visibleCount);
  const remaining = filtered.length - visible.length;

  const onToggleFav = async (g: GarmentWithUrl) => {
    try { await toggleFavorite(g); reload(); } catch (e) { console.error(e); }
  };

  const confirmDelete = async () => {
    if (!toDelete) return;
    try { await deleteGarment(toDelete); reload(); } catch (e) { console.error(e); }
    setToDelete(null);
  };

  return (
    <div className="min-h-screen pb-24">
      <PageHeader
        title="Il mio guardaroba"
        subtitle={`${garments.length} capi salvati`}
        action={
          <button onClick={() => { setEditing(null); setFormOpen(true); }} className="btn-primary px-4 py-2.5">
            <Plus size={18} /> Aggiungi
          </button>
        }
      />

      <div className="max-w-2xl mx-auto w-full px-5">
        <div className="relative mb-3">
          <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-cream-500" />
          <input className="input pl-10" placeholder="Cerca capo, colore o categoria…" value={query} onChange={(e) => setQuery(e.target.value)} />
        </div>

        <button onClick={() => setShowFilters((s) => !s)} className="btn-ghost text-sm w-full justify-start mb-3">
          <SlidersHorizontal size={16} /> Filtri {catFilter !== 'all' || colorFilter !== 'all' ? '(attivi)' : ''}
        </button>

        {showFilters && (
          <div className="card p-4 mb-4 space-y-3 animate-fade-in">
            <div>
              <p className="label">Categoria</p>
              <div className="flex flex-wrap gap-2">
                <button onClick={() => setCatFilter('all')} className={catFilter === 'all' ? 'chip-active' : 'chip-idle'}>Tutte</button>
                {CATEGORIES.map((c) => (
                  <button key={c.value} onClick={() => setCatFilter(c.value)} className={catFilter === c.value ? 'chip-active' : 'chip-idle'}>
                    {c.label}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <p className="label">Colore</p>
              <div className="flex flex-wrap gap-2">
                <button onClick={() => setColorFilter('all')} className={colorFilter === 'all' ? 'chip-active' : 'chip-idle'}>Tutti</button>
                {colors.map((c) => (
                  <button key={c.name} onClick={() => setColorFilter(c.name)} className={colorFilter === c.name ? 'chip-active' : 'chip-idle'}>
                    <span className="w-3 h-3 rounded-full" style={{ backgroundColor: c.hex }} /> {c.name}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {error && <Banner tone="error">{error}</Banner>}

        {loading ? (
          <p className="text-center text-cream-600 py-10">Caricamento…</p>
        ) : filtered.length === 0 ? (
          garments.length === 0 ? (
            <EmptyState icon={<Shirt size={28} />} title="Il guardaroba è vuoto" hint="Aggiungi il primo capo fotografandolo." />
          ) : (
            <EmptyState icon={<Search size={28} />} title="Nessun capo trovato" hint="Modifica la ricerca o i filtri." />
          )
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {visible.map((g) => (
              <GarmentCard
                key={g.id}
                garment={g}
                onToggleFav={() => onToggleFav(g)}
                onDelete={() => setToDelete(g)}
                onClick={() => { setEditing(g); setFormOpen(true); }}
              />
            ))}
          </div>
        )}

        {remaining > 0 && (
          <button onClick={() => setVisibleCount((c) => c + PAGE_SIZE)} className="btn-secondary w-full mt-4">
            Mostra altri {Math.min(PAGE_SIZE, remaining)} capi ({remaining} rimanenti)
          </button>
        )}
      </div>

      {formOpen && (
        <GarmentForm editing={editing} onClose={() => setFormOpen(false)} onSaved={reload} />
      )}

      {toDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-cream-900/40 backdrop-blur-sm animate-fade-in p-5">
          <div className="card p-5 max-w-sm w-full">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-full bg-terracotta-50 flex items-center justify-center text-terracotta-600">
                <AlertTriangle size={20} />
              </div>
              <h3 className="font-display text-lg text-cream-900">Eliminare "{toDelete.name}"?</h3>
            </div>
            <p className="text-sm text-cream-700 mb-4">Il capo verrà rimosso definitivamente dal tuo guardaroba.</p>
            <div className="flex gap-2">
              <button onClick={() => setToDelete(null)} className="btn-ghost flex-1">Annulla</button>
              <button onClick={confirmDelete} className="btn-primary bg-terracotta-600 flex-1">Elimina</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
