import { supabase, GARMENTS_BUCKET } from '@/lib/supabase';

// Carica una foto del capo nello storage privato, nella cartella dell'utente.
export async function uploadGarmentImage(file: File | Blob, userId: string): Promise<string> {
  const ext = (file as File).name?.split('.').pop()?.toLowerCase() || 'jpg';
  const path = `${userId}/${crypto.randomUUID()}.${ext}`;

  const { error } = await supabase.storage.from(GARMENTS_BUCKET).upload(path, file, {
    contentType: file.type || 'image/jpeg',
    upsert: false,
  });
  if (error) throw new Error(`Errore caricamento foto: ${error.message}`);
  return path;
}

export async function getSignedImageUrl(path: string): Promise<string | null> {
  const { data, error } = await supabase.storage.from(GARMENTS_BUCKET).createSignedUrl(path, 3600);
  if (error || !data?.signedUrl) return null;
  return data.signedUrl;
}

// Le foto del catalogo sono file statici in /assets; quelle caricate sono nello storage privato.
export async function resolveImageUrl(path: string | null): Promise<string | null> {
  if (!path) return null;
  if (path.startsWith('/')) return path;
  return getSignedImageUrl(path);
}

export function isStoragePath(path: string | null): path is string {
  return !!path && !path.startsWith('/');
}

// Ridimensiona la foto prima dell'invio (AI e upload) per tenere leggeri i file.
export async function compressImage(file: File, maxSize = 1080, quality = 0.82): Promise<Blob> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const url = URL.createObjectURL(file);
    img.onload = () => {
      let { width, height } = img;
      if (width > height && width > maxSize) {
        height = Math.round((height * maxSize) / width);
        width = maxSize;
      } else if (height > maxSize) {
        width = Math.round((width * maxSize) / height);
        height = maxSize;
      }
      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        URL.revokeObjectURL(url);
        reject(new Error('Canvas non disponibile'));
        return;
      }
      ctx.drawImage(img, 0, 0, width, height);
      canvas.toBlob(
        (blob) => {
          URL.revokeObjectURL(url);
          if (blob) resolve(blob);
          else reject(new Error('Compressione fallita'));
        },
        'image/jpeg',
        quality
      );
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error('Immagine non leggibile'));
    };
    img.src = url;
  });
}

export function fileToBase64(file: File | Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = () => reject(new Error('Lettura file fallita'));
    reader.readAsDataURL(file);
  });
}
