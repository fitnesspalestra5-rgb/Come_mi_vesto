import { useEffect, useRef, useState, type TouchEvent as ReactTouchEvent } from 'react';
import { Camera, X, Check, RefreshCw } from 'lucide-react';
import type { Garment, GarmentMaterial, GarmentSeason } from '@/lib/types';
import { CATEGORIES, GARMENT_MATERIALS, GARMENT_SEASONS, SECTION_BY_CATEGORY } from '@/lib/types';
import { insertGarment, updateGarment } from '@/lib/garments';
import { hexForColor, NAMED_COLORS } from '@/lib/colors';
import { Banner } from '@/components/ui';
import { useAuth } from '@/lib/auth';
import { analyzeGarment } from '@/lib/ai';
import { compressImage, dominantColorHex, fileToBase64, uploadGarmentImage } from '@/lib/images';

interface Props {
  editing?: Garment | null;
  onClose: () => void;
  onSaved: () => void;
}

export function GarmentForm({ editing, onClose, onSaved }: Props) {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [preview, setPreview] = useState<string | null>(null);
  const [name, setName] = useState('');
  const [category, setCategory] = useState<string>('maglia');
  const [color, setColor] = useState('neutro');
  const [colorHex, setColorHex] = useState('#c8b89a');
  const [notes, setNotes] = useState('');
  const [season, setSeason] = useState<GarmentSeason>('Quattro stagioni');
  const [material, setMaterial] = useState<GarmentMaterial>('Misto');
  const [avatarSection, setAvatarSection] = useState<string>('busto');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pickedFile, setPickedFile] = useState<File | null>(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [aiNote, setAiNote] = useState<string | null>(null);
  const analysisRef = useRef(0);
  const { user } = useAuth();

  useEffect(() => {
    if (editing) {
      setName(editing.name);
      setCategory(editing.category);
      setColor(editing.color);
      setColorHex(editing.color_hex);
      setNotes(editing.notes ?? '');
      setSeason(editing.season ?? 'Quattro stagioni');
      setMaterial(editing.material ?? 'Misto');
      setAvatarSection(editing.avatar_section ?? 'busto');
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
    void analyzePhoto(file);
  };

  const analyzePhoto = async (file: File) => {
    const requestId = ++analysisRef.current;
    const isCurrent = () => requestId === analysisRef.current;
    setAnalyzing(true);
    setAiNote(null);
    try {
      const blob = await compressImage(file);
      const [res, hex] = await Promise.all([analyzeGarment(await fileToBase64(blob)), dominantColorHex(blob)]);
      if (!isCurrent()) return;
      if (!res.result) {
        setAiNote(res.error || 'Riconoscimento automatico non disponibile. Compila i campi a mano.');
        return;
      }
      const r = res.result;
      setName((current) => (current.trim() ? current : r.name));
      setCategory(r.category);
      setAvatarSection(SECTION_BY_CATEGORY[r.category] ?? 'busto');
      setColor(r.color.toLowerCase());
      setColorHex(hex ?? hexForColor(r.color));
      setSeason(r.season);
      setMaterial(r.material);
    } catch (e) {
      if (isCurrent()) setAiNote((e as Error).message);
    } finally {
      if (isCurrent()) setAnalyzing(false);
    }
  };

  const onCategoryChange = (value: string) => {
    setCategory(value);
    setAvatarSection(SECTION_BY_CATEGORY[value] ?? 'busto');
  };

  const save = async () => {
    if (!name.trim()) {
      setError('Dai un nome al capo.');
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
            <span className="text-xs text-cream-500">L'AI riconosce tipo, colore, stagione e materiale</span>
          </button>
        )}

        {analyzing && <div className="mb-3"><Banner tone="info">Riconosco il capo dalla foto…</Banner></div>}
        {aiNote && <div className="mb-3"><Banner tone="warn">{aiNote}</Banner></div>}
        {error && <div className="mb-3"><Banner tone="warn">{error}</Banner></div>}

        <div className="space-y-3">
          <div>
            <label className="label">Nome</label>
            <input className="input" value={name} onChange={(e) => setName(e.target.value)} placeholder="es. Camicia lino beige" />
          </div>
          <div>
            <label className="label">Categoria</label>
            <select className="input" value={category} onChange={(e) => onCategoryChange(e.target.value)}>
              {CATEGORIES.map((c) => <option key={c.value} value={c.value}>{c.label}</option>)}
            </select>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label">Stagione</label>
              <select className="input" value={season} onChange={(e) => setSeason(e.target.value as GarmentSeason)}>
                {GARMENT_SEASONS.map((s) => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
            <div>
              <label className="label">Materiale</label>
              <select className="input" value={material} onChange={(e) => setMaterial(e.target.value as GarmentMaterial)}>
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
