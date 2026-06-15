import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../db/db';
import type { Vin, Bouteille, PhotoRecord } from '../db/types';

export interface CaveData {
  vins: Vin[];
  bouteilles: Bouteille[];
  thumbs: Map<string, Blob>;
}

/** Charge vins + lots + miniatures (pas les images pleines), réactif aux changements. */
export function useCaveData(): CaveData | undefined {
  return useLiveQuery(async () => {
    const [vins, bouteilles, thumbs] = await Promise.all([
      db.vins.toArray(),
      db.bouteilles.toArray(),
      db.thumbs.toArray() as Promise<PhotoRecord[]>,
    ]);
    return {
      vins,
      bouteilles,
      thumbs: new Map(thumbs.map((t) => [t.vinId, t.blob])),
    };
  }, []);
}
