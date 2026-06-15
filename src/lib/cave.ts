// Agrégation des lots par vin pour les listes (accueil, cave, recherche).
import type { Vin, Bouteille } from '../db/types';
import { estABoireBientot, urgenceLabel, joursRestants } from './garde';

export interface AggVin {
  vin: Vin;
  quantite: number; // total en stock
  prix?: number; // prix repère à afficher
  lots: Bouteille[];
  urgence: string | null; // libellé « à boire » si pertinent
  joursRestantsMin: number | null; // pour le tri par urgence
}

/** Prix repère : celui du lot acheté le plus récemment qui a un prix. */
function prixRepere(lots: Bouteille[]): number | undefined {
  const avecPrix = lots.filter((l) => l.prixAchat != null);
  if (!avecPrix.length) return undefined;
  avecPrix.sort((a, b) => (a.dateAchat ?? '') < (b.dateAchat ?? '') ? 1 : -1);
  return avecPrix[0].prixAchat;
}

export function agregerCave(
  vins: Vin[],
  bouteilles: Bouteille[],
  seuilMois: number,
): AggVin[] {
  const lotsParVin = new Map<string, Bouteille[]>();
  for (const b of bouteilles) {
    const liste = lotsParVin.get(b.vinId) ?? [];
    liste.push(b);
    lotsParVin.set(b.vinId, liste);
  }

  return vins.map((vin) => {
    const lots = lotsParVin.get(vin.id) ?? [];
    const enStock = lots.filter((l) => l.quantite > 0);
    const quantite = enStock.reduce((s, l) => s + l.quantite, 0);

    let urgence: string | null = null;
    let joursRestantsMin: number | null = null;
    for (const lot of enStock) {
      if (estABoireBientot(lot, seuilMois)) {
        urgence ??= urgenceLabel(lot);
        const j = joursRestants(lot.aBoireAvant);
        if (j != null && (joursRestantsMin == null || j < joursRestantsMin)) {
          joursRestantsMin = j;
        }
      }
    }

    return {
      vin,
      quantite,
      prix: prixRepere(lots),
      lots,
      urgence,
      joursRestantsMin,
    };
  });
}
