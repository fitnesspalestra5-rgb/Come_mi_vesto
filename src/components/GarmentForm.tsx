import { useEffect, useRef, useState, type TouchEvent as ReactTouchEvent } from 'react';
import { Camera, X, Check, RefreshCw } from 'lucide-react';
import type { Garment, GarmentMaterial, GarmentSeason } from '@/lib/types';
import { CATEGORIES, GARMENT_MATERIALS, GARMENT_SEASONS } from '@/lib/types';
import { insertGarment, updateGarment } from '@/lib/garments';
import { colorNameFromHex, hexForColor, NAMED_COLORS } from '@/lib/colors';
import { Banner } from '@/components/ui';
import { useAuth } from '@/lib/auth';
import { compressImage, dominantColorHex, uploadGarmentImage } from '@/lib/images';

interface Props {
  editing?: Garment | null;
  onClose: () => void;
  onSaved: () => void;
}

export function GarmentForm({ editing, onClose, onSaved }: Props) {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [preview, setPreview] = useState<string | null>(null);
  const [name, setName] = useState('');
  const [category, setCategory] = useState('');
  const [color, setColor] = useState('neutro');
  const [colorHex, setColorHex] = useState('#c8b89a');
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
      setName(editing.name);
      setCategory(editing.category);
      setColor(editing.color);
      setColorHex(editing.color_hex);
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
    void detectColor(file);
  };

  const detectColor = async (file: File) => {
    const requestId = ++analysisRef.current;
    const isCurrent = () => requestId === analysisRef.current;
    setAnalyzing(true);
    try {
      const hex = await dominantColorHex(await compressImage(file));
      if (!isCurrent() || !hex) return;
      setColorHex(hex);
      setColor(colorNameFromHex(hex));
    } catch {
      if (isCurrent()) setError('Non sono riuscito a leggere il colore dalla foto. Scegli il colore a mano.');
    } finally {
      if (isCurrent()) setAnalyzing(false);
    }
  };

  const save = async () => {
    if (!name.trim()) {
      setError('Dai un nome al capo.');
      return;
    }
    if (!category || !season || !material || !avatarSection) {
      setError('Scegli categoria, stagione, materiale e sezione avatar.');
      return;
    }
    setBusy(true);
    setError(null);
    try {
      if (!user) throw new Error('Sessione non valida. Accedi di nuovo.');
      const imagePath = pickedFile
        ? await uploadGarmentImage(await compressImage(pickedFile), user.id)
        : (editing?.image_path ?? null);
      const payload = {
        name: name.trim(),
        category,
        color,
        color_hex: colorHex,
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
          ref={fileInputRef}
          type="file"
          accept="image/*"
          capture="environment"
          className="hidden"
          onChange={(e) => { const f = e.target.files?.[0]; if (f) onPick(f); }}
        />

        {preview ? (
          <div className="relative aspect-[4/3] sm:aspect-square rounded-xl overflow-hidden bg-cream-100 mb-4">
            <img src={preview} alt="" draggable={false} decoding="async" className="w-full h-full object-cover" />
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
            <span className="text-xs text-cream-500">Il colore viene letto dalla foto, il resto lo scegli tu</span>
          </button>
        )}

        {analyzing && <div className="mb-3"><Banner tone="info">Leggo il colore dalla foto…</Banner></div>}
        {error && <div className="mb-3"><Banner tone="warn">{error}</Banner></div>}

        <div className="space-y-3">
          <div>
            <label className="label">Nome</label>
            <input className="input" value={name} onChange={(e) => setName(e.target.value)} placeholder="es. Camicia lino beige" />
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
          <button onClick={save} disabled={busy || analyzing || !name} className="btn-primary flex-1">
            {busy ? 'Salvo…' : <>Salva <Check size={16} /></>}
          </button>
        </div>
      </div>
    </div>
  );
}
