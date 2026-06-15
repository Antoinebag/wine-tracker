import { db, nouvelId, maintenantIso } from '../db/db';
import type { Vin } from '../db/types';

export type NouveauVin = Omit<Vin, 'id' | 'createdAt' | 'updatedAt'>;

export async function creerVin(data: NouveauVin): Promise<string> {
  const now = maintenantIso();
  const vin: Vin = { ...data, id: nouvelId(), createdAt: now, updatedAt: now };
  await db.vins.add(vin);
  return vin.id;
}

export async function majVin(
  id: string,
  patch: Partial<Omit<Vin, 'id' | 'createdAt'>>,
): Promise<void> {
  await db.vins.update(id, { ...patch, updatedAt: maintenantIso() });
}

/** Supprime un vin et tout ce qui lui est rattaché (lots, consommations, photo). */
export async function supprimerVin(id: string): Promise<void> {
  await db.transaction(
    'rw',
    [db.vins, db.bouteilles, db.consommations, db.photos, db.thumbs],
    async () => {
      await db.bouteilles.where('vinId').equals(id).delete();
      await db.consommations.where('vinId').equals(id).delete();
      await db.photos.delete(id);
      await db.thumbs.delete(id);
      await db.vins.delete(id);
    },
  );
}

export function getVin(id: string): Promise<Vin | undefined> {
  return db.vins.get(id);
}

export async function setPhoto(vinId: string, blob: Blob, thumb: Blob): Promise<void> {
  await db.transaction('rw', db.photos, db.thumbs, async () => {
    await db.photos.put({ vinId, blob });
    await db.thumbs.put({ vinId, blob: thumb });
  });
}

export async function supprimerPhoto(vinId: string): Promise<void> {
  await db.transaction('rw', db.photos, db.thumbs, async () => {
    await db.photos.delete(vinId);
    await db.thumbs.delete(vinId);
  });
}

/** Recherche live sur nom / domaine / région / appellation / tags. */
export function filtreVins(vins: Vin[], requete: string): Vin[] {
  const q = requete.trim().toLowerCase();
  if (!q) return vins;
  const termes = q.split(/\s+/);
  return vins.filter((v) => {
    const foin = [
      v.nom,
      v.domaine,
      v.region,
      v.appellation,
      v.couleur,
      ...(v.tags ?? []),
      ...(v.cepages ?? []),
    ]
      .filter(Boolean)
      .join(' ')
      .toLowerCase();
    return termes.every((t) => foin.includes(t));
  });
}
