import { useEffect, useState } from 'react';

// Miniature leggere in memoria: le foto originali (molto pesanti) vengono
// ridotte una alla volta, con al massimo due decodifiche in parallelo.

const THUMB_SIZE = 320;
const MAX_CONCURRENT = 2;

const cache = new Map<string, string>();
const pending = new Map<string, Promise<string>>();
const queue: (() => void)[] = [];
let active = 0;

function runNext() {
  if (active >= MAX_CONCURRENT) return;
  const job = queue.shift();
  if (!job) return;
  active++;
  job();
}

function render(src: string): Promise<string> {
  return new Promise((resolve) => {
    queue.push(() => {
      const finish = (url: string) => {
        active--;
        runNext();
        resolve(url);
      };
      const img = new Image();
      img.decoding = 'async';
      img.crossOrigin = 'anonymous';
      img.onload = () => {
        const scale = Math.min(1, THUMB_SIZE / Math.max(img.naturalWidth, img.naturalHeight));
        const canvas = document.createElement('canvas');
        canvas.width = Math.max(1, Math.round(img.naturalWidth * scale));
        canvas.height = Math.max(1, Math.round(img.naturalHeight * scale));
        const ctx = canvas.getContext('2d');
        if (!ctx) return finish(src);
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        try {
          finish(canvas.toDataURL('image/jpeg', 0.75));
        } catch {
          finish(src);
        }
      };
      img.onerror = () => finish(src);
      img.src = src;
    });
    runNext();
  });
}

export function getThumbnail(src: string): Promise<string> {
  const cached = cache.get(src);
  if (cached) return Promise.resolve(cached);
  let job = pending.get(src);
  if (!job) {
    job = render(src).then((url) => {
      cache.set(src, url);
      pending.delete(src);
      return url;
    });
    pending.set(src, job);
  }
  return job;
}

export function useThumbnail(src: string | null): string | null {
  const [thumb, setThumb] = useState<string | null>(() => (src ? cache.get(src) ?? null : null));

  useEffect(() => {
    if (!src) {
      setThumb(null);
      return;
    }
    const cached = cache.get(src);
    if (cached) {
      setThumb(cached);
      return;
    }
    let cancelled = false;
    getThumbnail(src).then((url) => {
      if (!cancelled) setThumb(url);
    });
    return () => {
      cancelled = true;
    };
  }, [src]);

  return thumb;
}
