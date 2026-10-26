import { useEffect, useRef, useState, type TouchEvent as ReactTouchEvent } from 'react';
import { Camera, X, Sparkles, Check, RefreshCw } from 'lucide-react';
import type { Garment } from '@/lib/types';
import { CATEGORIES } from '@/lib/types';
import { analyzeGarment } from '@/lib/ai';
import { compressImage, uploadGarmentImage } from '@/lib/images';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/lib/auth';
import { hexForColor, NAMED_COLORS } from '@/lib/colors';
import { Spinner, Banner } from '@/components/ui';

interface Props {
  editing?: Garment | null;
  onClose: () => void;
  onSaved: () => void;
}

export function GarmentForm({ editing, onClose, onSaved }: Props) {
  const { user } = useAuth();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [preview, setPreview] = useState<string | null>(null);
  const [rawFile, setRawFile] = useState<File | null>(null);
  const [name, setName] = useState('');
  const [category, setCategory] = useState('maglia');
  const [color, setColor] = useState('neutro');
  const [colorHex, setColorHex] = useState('#c8b89a');
  const [notes, setNotes] = useState('');
  const [busy, setBusy] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);
  const [aiConfigured, setAiConfigured] = useState<boolean | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (editing) {
      setName(editing.name);
      setCategory(editing.category);
      setColor(editing.color);
      setColorHex(editing.color_hex);
      setNotes(editing.notes ?? '');
    }
  }, [editing]);

  useEffect(() => {
    const { body } = document;
    const prev = { overflow: body.style.overflow, position: body.style.position };
    body.style.overflow = 'hidden';
    body.style.position = 'fixed';
    body.style.inset = '0';
    body.style.width = '100%';
    return () => {
      body.style.overflow = prev.overflow;
      body.style.position = prev.position;
      body.style.inset = '';
      body.style.width = '';
    };
  }, []);

  const onPick = async (file: File) => {
    setRawFile(file);
    setPreview(URL.createObjectURL(file));
    setError(null);
    if (!editing) {
      await runAnalysis(file);
    }
  };

  const runAnalysis = async (file: File) => {
    setAnalyzing(true);
    setAiConfigured(null);
    try {
      const compressed = await compressImage(file);
      const res = await analyzeGarment(compressed);
      setAiConfigured(res.configured);
      if (res.result) {
        setName(res.result.name);
        setCategory(res.result.category);
        setColor(res.result.colors[0] ?? 'neutro');
        setColorHex(res.result.color_hex);
        if (res.result.notes) setNotes(res.result.notes);
      } else if (res.error) {
        setError(res.error);
      }
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setAnalyzing(false);
    }
  };

  const save = async () => {
    if (!user) return;
    setBusy(true);
    setError(null);
    try {
      let imagePath = editing?.image_path ?? null;
      if (rawFile) {
        const compressed = await compressImage(rawFile);
        const { path } = await uploadGarmentImage(compressed, user.id);
        imagePath = path;
      }
      const payload = { name, category, color, color_hex: colorHex, notes, image_path: imagePath };
      if (editing) {
        const { error } = await supabase.from('garments').update(payload).eq('id', editing.id);
        if (error) throw new Error(error.message);
      } else {
        const { error } = await supabase.from('garments').insert({ ...payload, user_id: user.id });
        if (error) throw new Error(error.message);
      }
      onSaved();
      onClose();
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div
      className="garment-form-root fixed inset-0 z-50 flex items-end sm:items-center justify-center overflow-hidden bg-cream-900/40 backdrop-blur-sm animate-fade-in"
      onTouchMove={(e: ReactTouchEvent<HTMLDivElement>) => {
        if (!(e.target as HTMLElement).closest('.garment-form-scroll')) e.preventDefault();
      }}
    >
      <div className="garment-form-scroll card w-[calc(100%-1rem)] max-w-lg rounded-b-none sm:rounded-2xl p-5">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-display text-xl text-cream-900">{editing ? 'Modifica capo' : 'Nuovo capo'}</h2>
          <button onClick={onClose} className="p-2 rounded-lg text-cream-600 hover:bg-cream-100">
            <X size={20} />
          </button>
        </div>

        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          capture="environment"
          className="hidden"
          onChange={(e) => { const f = e.target.files?.[0]; if (f) onPick(f); }}
        />

        {preview ? (
          <div className="relative aspect-[4/3] sm:aspect-square rounded-xl overflow-hidden bg-cream-100 mb-4">
            <img src={preview} alt="" draggable={false} className="w-full h-full object-cover" />
            {analyzing && (
              <div className="absolute inset-0 bg-cream-50/60 flex flex-col items-center justify-center gap-2 text-cream-800">
                <Sparkles className="text-terracotta-600 animate-pulse" size={24} />
                <span className="text-sm font-medium">Analisi AI…</span>
              </div>
            )}
            <button onClick={() => fileInputRef.current?.click()} className="absolute bottom-2 right-2 btn-secondary text-xs py-2">
              <RefreshCw size={14} /> Cambia foto
            </button>
          </div>
        ) : (
          <button
            onClick={() => fileInputRef.current?.click()}
            className="w-full aspect-[4/3] sm:aspect-square rounded-xl border-2 border-dashed border-cream-300 bg-cream-50 flex flex-col items-center justify-center gap-2 text-cream-600 hover:bg-cream-100 transition mb-4"
          >
            <Camera size={32} className="text-terracotta-500" />
            <span className="text-sm font-medium">Scatta o scegli una foto</span>
            <span className="text-xs text-cream-500">L'AI riconosce capo e colore</span>
          </button>
        )}

        {analyzing && <Spinner label="Analisi del capo in corso…" />}
        {error && <div className="mb-3"><Banner tone="warn">{error}</Banner></div>}
        {aiConfigured === false && !analyzing && (
          <div className="mb-3"><Banner tone="info">L'analisi AI non è ancora attiva. Puoi compilare i campi a mano; l'outfit e gli abbinamenti funzionano comunque.</Banner></div>
        )}

        <div className="space-y-3">
          <div>
            <label className="label">Nome</label>
            <input className="input" value={name} onChange={(e) => setName(e.target.value)} placeholder="es. Camicia lino beige" />
          </div>
          <div>
            <label className="label">Categoria</label>
            <select className="input" value={category} onChange={(e) => setCategory(e.target.value)}>
              {CATEGORIES.map((c) => <option key={c.value} value={c.value}>{c.label}</option>)}
            </select>
          </div>
          <div>
            <label className="label">Colore</label>
            <div className="flex min-w-0 gap-2 items-center">
              <input type="color" value={colorHex} onChange={(e) => setColorHex(e.target.value)} className="w-12 h-11 rounded-lg border border-cream-300 bg-cream-50 cursor-pointer" />
              <input
                className="input min-w-0 flex-1"
                value={color}
                onChange={(e) => { setColor(e.target.value); setColorHex(hexForColor(e.target.value)); }}
                list="color-list"
                placeholder="es. beige"
              />
              <datalist id="color-list">
                {NAMED_COLORS.map((c) => <option key={c.name} value={c.name} />)}
              </datalist>
            </div>
          </div>
          <div>
            <label className="label">Note</label>
            <textarea className="input min-h-[72px]" value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Materiale, stagione, dettagli…" />
          </div>
        </div>

        <div className="flex gap-2 mt-5">
          <button onClick={onClose} className="btn-ghost flex-1">Annulla</button>
          <button onClick={save} disabled={busy || !name} className="btn-primary flex-1">
            {busy ? 'Salvo…' : <>Salva <Check size={16} /></>}
          </button>
        </div>
      </div>
    </div>
  );
}
