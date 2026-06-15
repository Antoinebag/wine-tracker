import { db, nouvelId, aujourdHuiIso, maintenantIso } from '../db/db';
import type { Bouteille, Consommation } from '../db/types';
import { FORMAT_DEFAUT } from '../db/types';

export type NouvelleBouteille = Omit<Bouteille, 'id'>;

export async function creerBouteille(data: Partial<NouvelleBouteille> & { vinId: string }): Promise<string> {
  const bouteille: Bouteille = {
    id: nouvelId(),
    vinId: data.vinId,
    quantite: data.quantite ?? 1,
    format: data.format ?? FORMAT_DEFAUT,
    prixAchat: data.prixAchat,
    dateAchat: data.dateAchat ?? aujourdHuiIso(),
    sourceAchat: data.sourceAchat,
    emplacement: data.emplacement,
    aBoireAvant: data.aBoireAvant,
    aBoireAPartirDe: data.aBoireAPartirDe,
    gardeType: data.gardeType,
  };
  await db.bouteilles.add(bouteille);
  return bouteille.id;
}

export async function majBouteille(
  id: string,
  patch: Partial<Omit<Bouteille, 'id' | 'vinId'>>,
): Promise<void> {
  await db.bouteilles.update(id, patch);
}

export async function supprimerBouteille(id: string): Promise<void> {
  await db.bouteilles.delete(id);
}

export function listerBouteillesParVin(vinId: string): Promise<Bouteille[]> {
  return db.bouteilles.where('vinId').equals(vinId).toArray();
}

/** Ajuste la quantité d'un lot (jamais en dessous de 0). Renvoie la nouvelle quantité. */
export async function ajusterQuantite(id: string, delta: number): Promise<number> {
  return db.transaction('rw', db.bouteilles, async () => {
    const b = await db.bouteilles.get(id);
    if (!b) return 0;
    const nouvelle = Math.max(0, b.quantite + delta);
    await db.bouteilles.update(id, { quantite: nouvelle });
    return nouvelle;
  });
}

/**
 * « J'en bois une » : décrémente le stock d'un lot et enregistre la consommation.
 * Conserve l'historique même si la quantité tombe à 0 (le lot n'est pas supprimé).
 */
export async function boireUne(
  bouteille: Bouteille,
  details: { noteDuJour?: string; occasion?: string; date?: string } = {},
): Promise<void> {
  await db.transaction('rw', db.bouteilles, db.consommations, async () => {
    const b = await db.bouteilles.get(bouteille.id);
    if (!b || b.quantite <= 0) return;
    await db.bouteilles.update(b.id, { quantite: b.quantite - 1 });
    const conso: Consommation = {
      id: nouvelId(),
      bouteilleId: b.id,
      vinId: b.vinId,
      date: details.date ?? maintenantIso(),
      noteDuJour: details.noteDuJour,
      occasion: details.occasion,
    };
    await db.consommations.add(conso);
  });
}
