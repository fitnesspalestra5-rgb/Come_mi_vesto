import { useMemo, useRef, useState } from 'react';
import { useEffect } from 'react';
import { Palette, Sparkles, Camera, Image as ImageIcon } from 'lucide-react';
import { PageHeader, EmptyState, Banner, Spinner } from '@/components/ui';
import { useGarments } from '@/lib/garments';
import { suggestHarmony, readableTextColor, NAMED_COLORS } from '@/lib/colors';
import { analyzeColorPhoto, type ColorAnalysisResult } from '@/lib/ai';
import { compressImage } from '@/lib/images';

export function ColoriPage() {
  const { garments } = useGarments();
  const [selected, setSelected] = useState<string>('');
  const [customHex, setCustomHex] = useState('#b25139');

  const [photoBusy, setPhotoBusy] = useState(false);
  const [photoError, setPhotoError] = useState<string | null>(null);
  const [aiResult, setAiResult] = useState<ColorAnalysisResult | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (garments.length && !selected && !aiResult) {
      setSelected(garments[0].color_hex);
    }
  }, [garments, selected, aiResult]);

  const harmony = useMemo(() => suggestHarmony(selected || customHex), [selected, customHex]);

  const onPickPhoto = async (file: File) => {
    setPhotoBusy(true);
    setPhotoError(null);
    setAiResult(null);
    try {
      const compressed = await compressImage(file, 768, 0.8);
      const res = await analyzeColorPhoto(compressed);
      if (res.configured === false || res.error || !res.result) {
        setPhotoError(res.error || 'Non sono riuscito a riconoscere il colore. Riprova.');
      } else {
        const { detected, matches } = res.result;
        if (!detected.hex) {
          setPhotoError('Non sono riuscito a riconoscere il colore. Riprova.');
        } else {
          setAiResult({ detected, matches });
          setSelected(detected.hex);
        }
      }
    } catch {
      setPhotoError('Errore nella lettura della foto. Riprova.');
    } finally {
      setPhotoBusy(false);
    }
  };

  const activeMatches = aiResult?.matches ?? [];
  const activeBaseHex = aiResult?.detected.hex ?? (selected || customHex);
  const activeBaseName = aiResult?.detected.name ?? null;

  return (
    <div className="min-h-screen pb-24">
      <PageHeader title="Abbinamento colori" subtitle="Scegli un capo, un colore o scatta una foto" />

      <div className="max-w-2xl mx-auto w-full px-5 space-y-5">
        <div className="card p-4">
          <p className="label">Scatta il colore</p>
          <p className="text-xs text-cream-600 mb-3">Fotografa un colore: Gemini lo riconosce e genera 8 abbinamenti.</p>
          <input
            ref={cameraInputRef}
            type="file"
            accept="image/*"
            capture="environment"
            className="hidden"
            onChange={(e) => { const f = e.target.files?.[0]; if (f) onPickPhoto(f); }}
          />
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => { const f = e.target.files?.[0]; if (f) onPickPhoto(f); }}
          />
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => cameraInputRef.current?.click()}
              disabled={photoBusy}
              className="btn-primary flex-1"
            >
              <Camera size={16} /> Scatta il colore
            </button>
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={photoBusy}
              className="btn-secondary"
            >
              <ImageIcon size={16} /> Galleria
            </button>
          </div>
          {photoBusy && <div className="mt-3"><Spinner label="Gemini riconosce il colore…" /></div>}
          {photoError && <div className="mt-3"><Banner tone="warn">{photoError}</Banner></div>}
        </div>

        {aiResult && (
          <div className="card p-5 animate-fade-up">
            <div className="flex items-center gap-2 mb-3">
              <Sparkles size={18} className="text-terracotta-600" />
              <h2 className="font-display text-lg text-cream-900">Colore riconosciuto da Gemini</h2>
            </div>
            <div className="rounded-2xl p-4 mb-4 text-center" style={{ backgroundColor: activeBaseHex, color: readableTextColor(activeBaseHex) }}>
              <p className="text-xs uppercase tracking-wide opacity-80">Colore base</p>
              <p className="font-display text-xl capitalize">{activeBaseName ?? 'Colore'}</p>
              <p className="text-xs uppercase opacity-80 mt-0.5">{activeBaseHex}</p>
            </div>
            <div className="grid grid-cols-2 gap-2.5">
              {activeMatches.map((c, i) => (
                <div key={`${c.hex}-${i}`} className="rounded-xl overflow-hidden border border-cream-200">
                  <div className="h-16" style={{ backgroundColor: c.hex }} />
                  <div className="p-2.5 bg-cream-50">
                    <p className="text-sm font-medium text-cream-900 capitalize">{c.name}</p>
                    <p className="text-[11px] text-cream-500 uppercase">{c.hex}</p>
                  </div>
                </div>
              ))}
            </div>
            <p className="text-sm text-cream-700 mt-4 leading-relaxed">
              Abbinamenti generati da Gemini in base al colore fotografato.
            </p>
          </div>
        )}

        {garments.length > 0 && (
          <div>
            <p className="label">Dai tuoi capi</p>
            <div className="flex flex-wrap gap-2">
              {garments.slice(0, 12).map((g) => (
                <button
                  key={g.id}
                  onClick={() => { setSelected(g.color_hex); setAiResult(null); }}
                  className={`chip ${!aiResult && selected === g.color_hex ? 'ring-2 ring-terracotta-400' : ''}`}
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
            <input
              type="color"
              value={selected || customHex}
              onChange={(e) => { setSelected(e.target.value); setCustomHex(e.target.value); setAiResult(null); }}
              className="w-14 h-12 rounded-lg border border-cream-300 cursor-pointer"
            />
            <div className="flex flex-wrap gap-1.5">
              {NAMED_COLORS.slice(0, 14).map((c) => (
                <button
                  key={c.name}
                  onClick={() => { setSelected(c.hex); setAiResult(null); }}
                  className="w-7 h-7 rounded-full border-2 border-cream-100 hover:scale-110 transition"
                  style={{ backgroundColor: c.hex }}
                  title={c.name}
                />
              ))}
            </div>
          </div>
        </div>

        {!aiResult && (
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
        )}

        {garments.length === 0 && !aiResult && (
          <EmptyState icon={<Palette size={28} />} title="Aggiungi capi per scoprire abbinamenti" hint="I tuoi colori appariranno qui come punto di partenza." />
        )}
      </div>
    </div>
  );
}
