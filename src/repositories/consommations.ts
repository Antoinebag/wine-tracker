import { db } from '../db/db';
import type { Consommation } from '../db/types';

export function listerConsommationsParVin(vinId: string): Promise<Consommation[]> {
  return db.consommations.where('vinId').equals(vinId).reverse().sortBy('date');
}

/** Annule une consommation : remet une bouteille en stock dans son lot et efface l'historique. */
export async function annulerConsommation(id: string): Promise<void> {
  await db.transaction('rw', db.bouteilles, db.consommations, async () => {
    const conso = await db.consommations.get(id);
    if (!conso) return;
    const b = await db.bouteilles.get(conso.bouteilleId);
    if (b) await db.bouteilles.update(b.id, { quantite: b.quantite + 1 });
    await db.consommations.delete(id);
  });
}
