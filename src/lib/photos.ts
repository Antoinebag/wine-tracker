// Gestion des photos d'étiquette : génération d'une miniature et URLs d'objet.

const THUMB_MAX = 400; // côté max de la miniature de galerie (px)
const FULL_MAX = 1600; // côté max de l'image stockée (px) — limite la taille en base

/** Redimensionne un fichier image vers un Blob JPEG dont le plus grand côté <= maxCote. */
async function redimensionner(file: Blob, maxCote: number, qualite = 0.82): Promise<Blob> {
  const bitmap = await createImageBitmap(file);
  const ratio = Math.min(1, maxCote / Math.max(bitmap.width, bitmap.height));
  const w = Math.round(bitmap.width * ratio);
  const h = Math.round(bitmap.height * ratio);

  const canvas = document.createElement('canvas');
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext('2d');
  if (!ctx) {
    bitmap.close();
    return file;
  }
  ctx.drawImage(bitmap, 0, 0, w, h);
  bitmap.close();

  return await new Promise<Blob>((resolve) => {
    canvas.toBlob(
      (b) => resolve(b ?? file),
      'image/jpeg',
      qualite,
    );
  });
}

/** À partir d'un fichier capturé, produit l'image stockée + sa miniature. */
export async function preparerPhoto(
  file: Blob,
): Promise<{ blob: Blob; thumb: Blob }> {
  try {
    const [blob, thumb] = await Promise.all([
      redimensionner(file, FULL_MAX),
      redimensionner(file, THUMB_MAX, 0.7),
    ]);
    return { blob, thumb };
  } catch {
    // En cas d'échec du redimensionnement, on conserve l'original tel quel.
    return { blob: file, thumb: file };
  }
}

// Cache d'URLs d'objet pour éviter de recréer (et fuiter) des URLs à chaque rendu.
const urlCache = new WeakMap<Blob, string>();

export function urlDePhoto(blob: Blob | undefined | null): string | undefined {
  if (!blob) return undefined;
  let url = urlCache.get(blob);
  if (!url) {
    url = URL.createObjectURL(blob);
    urlCache.set(blob, url);
  }
  return url;
}
