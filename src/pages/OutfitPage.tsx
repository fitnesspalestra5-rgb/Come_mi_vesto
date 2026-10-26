import { useEffect, useMemo, useState } from 'react';
import { Sparkles, Heart, Save, Trash2, RefreshCw, X, User } from 'lucide-react';
import { PageHeader, EmptyState, Spinner, Banner } from '@/components/ui';
import { useGarments, withSignedUrls, type GarmentWithUrl } from '@/lib/garments';
import { OCCASIONS, OUTFIT_ROLES, type Occasion, type OutfitRole } from '@/lib/types';
import { generateOutfit, generateAvatar, type OutfitProposal } from '@/lib/ai';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/lib/auth';
import { useRouter } from '@/lib/router';
import { getSignedImageUrl } from '@/lib/images';

interface SavedOutfit {
  id: string;
  name: string;
  occasion: string;
  favorite: boolean;
  notes: string | null;
  items: { garment_id: string; role: string; image_url: string | null; name: string; color: string; color_hex: string }[];
}

export function OutfitPage() {
  const { user } = useAuth();
  const { navigate } = useRouter();
  const { garments, loading } = useGarments();
  const [withUrls, setWithUrls] = useState<GarmentWithUrl[]>([]);
  const [occasion, setOccasion] = useState<Occasion>('tempo_libero');
  const [weatherNote, setWeatherNote] = useState('');
  const [generating, setGenerating] = useState(false);
  const [proposal, setProposal] = useState<OutfitProposal | null>(null);
  const [aiConfigured, setAiConfigured] = useState<boolean | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState<SavedOutfit[]>([]);
  const [saving, setSaving] = useState(false);
  const [avatar, setAvatar] = useState<string | null>(null);
  const [avatarLoading, setAvatarLoading] = useState(false);
  const [avatarError, setAvatarError] = useState<string | null>(null);

  useEffect(() => { withSignedUrls(garments).then(setWithUrls); }, [garments]);
  useEffect(() => { if (user) loadSaved(); }, [user]);

  const loadSaved = async () => {
    if (!user) return;
    const { data: outfits } = await supabase.from('outfits').select('*').eq('user_id', user.id).order('created_at', { ascending: false });
    if (!outfits) return;
    const enriched = await Promise.all(outfits.map(async (o) => {
      const { data: items } = await supabase.from('outfit_items').select('garment_id, role').eq('outfit_id', o.id);
      const itemsWithImg = await Promise.all((items ?? []).map(async (it) => {
        const g = garments.find((x) => x.id === it.garment_id);
        const url = g?.image_path ? await getSignedImageUrl(g.image_path) : null;
        return { garment_id: it.garment_id, role: it.role, image_url: url, name: g?.name ?? 'Capo', color: g?.color ?? '', color_hex: g?.color_hex ?? '#c8b89a' };
      }));
      return { id: o.id, name: o.name, occasion: o.occasion, favorite: o.favorite, notes: o.notes, items: itemsWithImg };
    }));
    setSaved(enriched);
  };

  const onGenerate = async () => {
    if (garments.length === 0) return;
    setGenerating(true);
    setError(null);
    setProposal(null);
    setAvatar(null);
    setAvatarError(null);
    try {
      const res = await generateOutfit(garments, occasion, weatherNote || undefined);
      setAiConfigured(res.configured);
      if (res.result) setProposal(res.result);
      else if (res.error) setError(res.error);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setGenerating(false);
    }
  };

  const onTryOn = async () => {
    const targetGarments = proposalItems.map((it) => it.garment).filter((g): g is GarmentWithUrl => !!g);
    if (targetGarments.length === 0) return;
    setAvatarLoading(true);
    setAvatarError(null);
    setAvatar(null);
    try {
      const res = await generateAvatar(targetGarments, occasion);
      if (res.result?.imageBase64) setAvatar(res.result.imageBase64);
      else if (res.error) setAvatarError(res.error);
    } catch (e) {
      setAvatarError((e as Error).message);
    } finally {
      setAvatarLoading(false);
    }
  };

  const saveProposal = async () => {
    if (!user || !proposal) return;
    setSaving(true);
    try {
      const { data: outfit, error: e1 } = await supabase.from('outfits').insert({
        user_id: user.id, name: proposal.name, occasion: proposal.occasion, weather_note: weatherNote || null, notes: proposal.reason,
      }).select().single();
      if (e1) throw new Error(e1.message);
      const rows = proposal.items.map((it) => ({ outfit_id: outfit.id, garment_id: it.garment_id, role: it.role }));
      if (rows.length) {
        const { error: e2 } = await supabase.from('outfit_items').insert(rows);
        if (e2) throw new Error(e2.message);
      }
      await loadSaved();
      setProposal(null);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setSaving(false);
    }
  };

  const toggleFav = async (o: SavedOutfit) => {
    await supabase.from('outfits').update({ favorite: !o.favorite }).eq('id', o.id);
    loadSaved();
  };

  const removeOutfit = async (id: string) => {
    await supabase.from('outfits').delete().eq('id', id);
    loadSaved();
  };

  const proposalItems = useMemo(() => {
    if (!proposal) return [];
    return proposal.items.map((it) => {
      const g = withUrls.find((x) => x.id === it.garment_id);
      return { ...it, garment: g };
    });
  }, [proposal, withUrls]);

  const occLabel = (v: string) => OCCASIONS.find((o) => o.value === v)?.label ?? v;
  const roleLabel = (v: string) => OUTFIT_ROLES.find((r) => r.value === v)?.label ?? v;

  return (
    <div className="min-h-screen pb-24">
      <PageHeader title="Crea outfit" subtitle="Combinazioni dai tuoi capi per ogni occasione" />

      <div className="max-w-2xl mx-auto w-full px-5 space-y-5">
        {garments.length === 0 && !loading ? (
          <EmptyState icon={<Sparkles size={28} />} title="Aggiungi prima qualche capo" hint="Servono almeno due capi nel guardaroba per comporre un outfit." />
        ) : (
          <>
            <div className="card p-4 space-y-4">
              <div>
                <p className="label">Occasione</p>
                <div className="flex flex-wrap gap-2">
                  {OCCASIONS.map((o) => (
                    <button key={o.value} onClick={() => setOccasion(o.value)} className={occasion === o.value ? 'chip-active' : 'chip-idle'}>
                      {o.label}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <p className="label">Contesto meteo (opzionale)</p>
                <input className="input" value={weatherNote} onChange={(e) => setWeatherNote(e.target.value)} placeholder="es. 18°C, soleggiato" />
              </div>
              <button onClick={onGenerate} disabled={generating} className="btn-primary w-full">
                <Sparkles size={18} /> {generating ? 'Generazione…' : 'Genera outfit con AI'}
              </button>
              <button onClick={() => navigate('meteo')} className="btn-ghost text-xs w-full">
                Vuoi usare il meteo reale? Vai alla pagina Meteo
              </button>
            </div>

            {generating && <Spinner label="Sto componendo il tuo outfit…" />}

            {aiConfigured === false && !generating && (
              <Banner tone="info">Il servizio AI non è ancora configurato. Una volta attivato, l'outfit verrà generato automaticamente dai tuoi capi.</Banner>
            )}

            {error && <Banner tone="warn">{error}</Banner>}

            {proposal && (
              <div className="card p-5 animate-fade-up">
                <div className="flex items-start justify-between gap-3 mb-3">
                  <div>
                    <h2 className="font-display text-xl text-cream-900">{proposal.name}</h2>
                    <p className="text-xs text-cream-600">{occLabel(proposal.occasion)}</p>
                  </div>
                  <button onClick={saveProposal} disabled={saving} className="btn-secondary text-sm py-2">
                    <Save size={15} /> {saving ? 'Salvo…' : 'Salva'}
                  </button>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 mb-4">
                  {proposalItems.map((it, i) => (
                    <div key={i} className="rounded-xl overflow-hidden border border-cream-200 bg-cream-50">
                      <div className="aspect-square bg-cream-100">
                        {it.garment?.imageUrl ? (
                          <img src={it.garment.imageUrl} alt="" className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-cream-400 text-xs">Capo</div>
                        )}
                      </div>
                      <div className="p-2">
                        <p className="text-[10px] uppercase text-cream-500">{roleLabel(it.role)}</p>
                        <p className="text-xs font-medium text-cream-900 truncate">{it.garment?.name ?? '—'}</p>
                      </div>
                    </div>
                  ))}
                </div>

                <p className="text-sm text-cream-700 leading-relaxed">{proposal.reason}</p>
                {proposal.tips && <p className="text-xs text-olive-700 bg-olive-50 rounded-lg px-3 py-2 mt-2">Consiglio: {proposal.tips}</p>}

                <button onClick={onTryOn} disabled={avatarLoading} className="btn-secondary text-sm py-2 mt-3 w-full">
                  <User size={15} /> {avatarLoading ? 'Generazione avatar…' : 'Prova virtuale (avatar)'}
                </button>
                {avatarError && <p className="text-xs text-terracotta-700 bg-terracotta-50 rounded-lg px-3 py-2 mt-2">{avatarError}</p>}
                {avatar && (
                  <div className="mt-3 rounded-xl overflow-hidden border border-cream-200 bg-cream-100 animate-fade-up">
                    <img src={avatar} alt="Avatar con outfit" className="w-full object-contain" />
                  </div>
                )}
              </div>
            )}
          </>
        )}

        {saved.length > 0 && (
          <div>
            <h2 className="font-display text-lg text-cream-900 mb-3 px-1">Outfit salvati</h2>
            <div className="space-y-3">
              {saved.map((o) => (
                <div key={o.id} className="card p-4">
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <div>
                      <p className="font-medium text-cream-900">{o.name}</p>
                      <p className="text-xs text-cream-600">{occLabel(o.occasion)}</p>
                    </div>
                    <div className="flex gap-1">
                      <button onClick={() => toggleFav(o)} className={`p-1.5 rounded-lg ${o.favorite ? 'text-terracotta-600 bg-terracotta-50' : 'text-cream-400 hover:bg-cream-100'}`}>
                        <Heart size={16} fill={o.favorite ? 'currentColor' : 'none'} />
                      </button>
                      <button onClick={() => removeOutfit(o.id)} className="p-1.5 rounded-lg text-cream-400 hover:text-terracotta-700 hover:bg-terracotta-50">
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>
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
          </div>
        )}
      </div>
    </div>
  );
}
