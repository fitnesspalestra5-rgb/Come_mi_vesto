import { useEffect, useRef, useState, type TouchEvent as ReactTouchEvent } from 'react';
import { Camera, X, Check, Image as ImageIcon, FolderOpen } from 'lucide-react';
import type { Garment, GarmentColor, GarmentMaterial, GarmentSeason } from '@/lib/types';
import { CATEGORIES, GARMENT_MATERIALS, GARMENT_SEASONS } from '@/lib/types';
import { insertGarment, updateGarment } from '@/lib/garments';
import { Banner } from '@/components/ui';
import { useAuth } from '@/lib/auth';
import { compressImage, extractGarmentColors, uploadGarmentImage } from '@/lib/images';
import { GarmentColorPicker } from '@/components/GarmentColorPicker';

interface Props {
  editing?: Garment | null;
  onClose: () => void;
  onSaved: () => void;
}

function initialPalette(garment: Garment): GarmentColor[] {
  if (garment.colors?.length) return garment.colors;
  return garment.color ? [{ name: garment.color, hex: garment.color_hex }] : [];
}

export function GarmentForm({ editing, onClose, onSaved }: Props) {
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const galleryInputRef = useRef<HTMLInputElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const fileInputRefs = [cameraInputRef, galleryInputRef, fileInputRef];

  const [preview, setPreview] = useState<string | null>(null);
  const [category, setCategory] = useState('');
  const [palette, setPalette] = useState<GarmentColor[]>([]);
  const [notes, setNotes] = useState('');
  const [season, setSeason] = useState<GarmentSeason | ''>('');
  const [material, setMaterial] = useState<GarmentMaterial | ''>('');
  const [avatarSection, setAvatarSection] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pickedFile, setPickedFile] = useState<File | null>(null);
  const [analyzing, setAnalyzing] = useState(false);
  const analysisRef = useRef(0);
  const { user } = useAuth();

  useEffect(() => {
    if (editing) {
      setCategory(editing.category);
      setPalette(initialPalette(editing));
      setNotes(editing.notes ?? '');
      setSeason(editing.season ?? '');
      setMaterial(editing.material ?? '');
      setAvatarSection(editing.avatar_section ?? '');
      setPreview(editing.image_path);
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

  const onPick = (file: File) => {
    setPreview(URL.createObjectURL(file));
    setPickedFile(file);
    setError(null);
    void detectColors(file);
  };

  const detectColors = async (file: File) => {
    const requestId = ++analysisRef.current;
    const isCurrent = () => requestId === analysisRef.current;
    setAnalyzing(true);
    try {
      const colors = await extractGarmentColors(await compressImage(file));
      if (!isCurrent()) return;
      if (colors.length === 0) {
        setPalette([]);
        setError('Non riesco a leggere i colori da questa foto. Prova con una foto più chiara.');
        return;
      }
      setPalette(colors);
    } catch {
      if (isCurrent()) {
        setPalette([]);
        setError('Non riesco a leggere i colori da questa foto. Prova con una foto più chiara.');
      }
    } finally {
      if (isCurrent()) setAnalyzing(false);
    }
  };

  const save = async () => {
    if (!category || !season || !material || !avatarSection) {
      setError('Scegli categoria, stagione, materiale e sezione avatar.');
      return;
    }
    if (palette.length === 0) {
      setError('Scegli almeno un colore del capo.');
      return;
    }
    setBusy(true);
    setError(null);
    try {
      if (!user) throw new Error('Sessione non valida. Accedi di nuovo.');
      const imagePath = pickedFile
        ? await uploadGarmentImage(await compressImage(pickedFile), user.id)
        : (editing?.image_path ?? null);
      const categoryLabel = CATEGORIES.find((c) => c.value === category)?.label ?? category;
      const payload = {
        name: editing?.name ?? `${categoryLabel} ${palette[0].name}`,
        category,
        color: palette.map((c) => c.name).join(', '),
        color_hex: palette[0].hex,
        colors: palette,
        notes: notes.trim() || null,
        season,
        material,
        avatar_section: avatarSection as Garment['avatar_section'],
        image_path: imagePath,
        favorite: editing?.favorite ?? false,
      };
      if (editing) {
        await updateGarment(editing.id, payload);
      } else {
        await insertGarment(user.id, payload);
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
          ref={cameraInputRef}
          type="file"
          accept="image/*"
          capture="environment"
          className="hidden"
          onChange={(e) => { const f = e.target.files?.[0]; if (f) onPick(f); e.target.value = ''; }}
        />
        <input
          ref={galleryInputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={(e) => { const f = e.target.files?.[0]; if (f) onPick(f); e.target.value = ''; }}
        />
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={(e) => { const f = e.target.files?.[0]; if (f) onPick(f); e.target.value = ''; }}
        />

        {preview ? (
          <div className="relative aspect-[4/3] sm:aspect-square rounded-xl overflow-hidden bg-cream-100 mb-4">
            <img src={preview} alt="" draggable={false} decoding="async" className="w-full h-full object-cover" />
            <div className="absolute inset-x-0 bottom-0 flex justify-center gap-1.5 p-2 bg-gradient-to-t from-cream-900/70 to-transparent">
              <button onClick={() => cameraInputRef.current?.click()} className="btn-secondary text-xs py-1.5 px-3 bg-cream-50/95">
                <Camera size={13} /> Scatta
              </button>
              <button onClick={() => galleryInputRef.current?.click()} className="btn-secondary text-xs py-1.5 px-3 bg-cream-50/95">
                <ImageIcon size={13} /> Galleria
              </button>
              <button onClick={() => fileInputRef.current?.click()} className="btn-secondary text-xs py-1.5 px-3 bg-cream-50/95">
                <FolderOpen size={13} /> File
              </button>
            </div>
          </div>
        ) : (
          <div className="rounded-xl border-2 border-dashed border-cream-300 bg-cream-50 p-4 mb-4 flex flex-col items-center gap-3">
            <Camera size={32} className="text-terracotta-500" />
            <span className="text-sm font-medium text-cream-700">Aggiungi una foto del capo</span>
            <span className="text-xs text-cream-500 text-center">I colori vengono riconosciuti automaticamente dalla foto</span>
            <div className="flex gap-2 w-full mt-1">
              <button onClick={() => cameraInputRef.current?.click()} className="btn-primary flex-1 text-xs">
                <Camera size={15} /> Scatta foto
              </button>
              <button onClick={() => galleryInputRef.current?.click()} className="btn-secondary flex-1 text-xs">
                <ImageIcon size={15} /> Libreria
              </button>
              <button onClick={() => fileInputRef.current?.click()} className="btn-secondary flex-1 text-xs">
                <FolderOpen size={15} /> File
              </button>
            </div>
          </div>
        )}

        {analyzing && <div className="mb-3"><Banner tone="info">Riconosco i colori dalla foto…</Banner></div>}
        {error && <div className="mb-3"><Banner tone="warn">{error}</Banner></div>}

        <div className="space-y-3">
          <div>
            <label className="label">Colori</label>
            <GarmentColorPicker palette={palette} onChange={setPalette} />
          </div>
          <div>
            <label className="label">Categoria</label>
            <select className="input" value={category} onChange={(e) => setCategory(e.target.value)}>
              <option value="" disabled>Seleziona…</option>
              {CATEGORIES.map((c) => <option key={c.value} value={c.value}>{c.label}</option>)}
            </select>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label">Stagione</label>
              <select className="input" value={season} onChange={(e) => setSeason(e.target.value as GarmentSeason)}>
                <option value="" disabled>Seleziona…</option>
                {GARMENT_SEASONS.map((s) => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
            <div>
              <label className="label">Materiale</label>
              <select className="input" value={material} onChange={(e) => setMaterial(e.target.value as GarmentMaterial)}>
                <option value="" disabled>Seleziona…</option>
                {GARMENT_MATERIALS.map((m) => <option key={m} value={m}>{m}</option>)}
              </select>
            </div>
          </div>
          <div>
            <label className="label">Sezione avatar</label>
            <select className="input" value={avatarSection} onChange={(e) => setAvatarSection(e.target.value)}>
              <option value="" disabled>Seleziona…</option>
              <option value="busto">Busto</option>
              <option value="gambe">Gambe</option>
              <option value="scarpe">Scarpe</option>
            </select>
          </div>
          <div>
            <label className="label">Note</label>
            <textarea className="input min-h-[72px]" value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Materiale, stagione, dettagli…" />
          </div>
        </div>

        <div className="flex gap-2 mt-5">
          <button onClick={onClose} className="btn-ghost flex-1">Annulla</button>
          <button onClick={save} disabled={busy || analyzing} className="btn-primary flex-1">
            {busy ? 'Salvo…' : <>Salva <Check size={16} /></>}
          </button>
        </div>
      </div>
    </div>
  );
}
