// Calculs d'inventaire et de statistiques (§4.5). Fonctions pures => testables.
import type { Vin, Bouteille, Consommation } from '../db/types';

export interface Repartition {
  cle: string;
  bouteilles: number;
  valeur: number;
}

export interface LigneInventaire {
  vin: Vin;
  quantite: number; // bouteilles en stock (tous lots confondus)
  valeur: number; // valeur cumulée du stock
  valeurUnitaireMoy: number | null; // valeur moyenne par bouteille
  emplacements: string[];
  dateAchatMin?: string; // plus ancienne entrée en cave encore en stock
}

export interface Inventaire {
  totalBouteilles: number;
  valeurTotale: number;
  nbReferences: number; // nombre de vins encore en stock
  parCouleur: Repartition[];
  parRegion: Repartition[];
  parMillesime: Repartition[];
  lignes: LigneInventaire[];
  plusAnciennes: LigneInventaire[];
  valeurDormante: LigneInventaire[];
  grossesQuantites: LigneInventaire[];
  achatsAnnee: number;
  consosAnnee: number;
}

function ajouterRepartition(
  map: Map<string, Repartition>,
  cle: string,
  bouteilles: number,
  valeur: number,
): void {
  const courant = map.get(cle) ?? { cle, bouteilles: 0, valeur: 0 };
  courant.bouteilles += bouteilles;
  courant.valeur += valeur;
  map.set(cle, courant);
}

function trierRepartition(map: Map<string, Repartition>): Repartition[] {
  return [...map.values()].sort((a, b) => b.bouteilles - a.bouteilles);
}

export function calculerInventaire(
  vins: Vin[],
  bouteilles: Bouteille[],
  consommations: Consommation[] = [],
): Inventaire {
  const vinsParId = new Map(vins.map((v) => [v.id, v]));
  const lots = bouteilles.filter((b) => b.quantite > 0);

  const parCouleur = new Map<string, Repartition>();
  const parRegion = new Map<string, Repartition>();
  const parMillesime = new Map<string, Repartition>();
  const lignesParVin = new Map<string, LigneInventaire>();

  let totalBouteilles = 0;
  let valeurTotale = 0;

  for (const b of lots) {
    const vin = vinsParId.get(b.vinId);
    if (!vin) continue;
    const valeur = (b.prixAchat ?? 0) * b.quantite;
    totalBouteilles += b.quantite;
    valeurTotale += valeur;

    ajouterRepartition(parCouleur, vin.couleur ?? 'non précisé', b.quantite, valeur);
    ajouterRepartition(parRegion, vin.region ?? 'non précisé', b.quantite, valeur);
    ajouterRepartition(
      parMillesime,
      vin.millesime ? String(vin.millesime) : 'sans millésime',
      b.quantite,
      valeur,
    );

    const ligne =
      lignesParVin.get(vin.id) ??
      ({
        vin,
        quantite: 0,
        valeur: 0,
        valeurUnitaireMoy: null,
        emplacements: [],
        dateAchatMin: undefined,
      } satisfies LigneInventaire);
    ligne.quantite += b.quantite;
    ligne.valeur += valeur;
    if (b.emplacement && !ligne.emplacements.includes(b.emplacement)) {
      ligne.emplacements.push(b.emplacement);
    }
    if (b.dateAchat && (!ligne.dateAchatMin || b.dateAchat < ligne.dateAchatMin)) {
      ligne.dateAchatMin = b.dateAchat;
    }
    lignesParVin.set(vin.id, ligne);
  }

  const lignes = [...lignesParVin.values()].map((l) => ({
    ...l,
    valeurUnitaireMoy: l.quantite > 0 && l.valeur > 0 ? l.valeur / l.quantite : null,
  }));
  lignes.sort((a, b) => b.valeur - a.valeur || b.quantite - a.quantite);

  const plusAnciennes = [...lignes]
    .filter((l) => l.dateAchatMin)
    .sort((a, b) => (a.dateAchatMin! < b.dateAchatMin! ? -1 : 1))
    .slice(0, 5);

  const valeurDormante = [...lignes].filter((l) => l.valeur > 0).slice(0, 5);

  const grossesQuantites = [...lignes]
    .sort((a, b) => b.quantite - a.quantite)
    .slice(0, 5);

  const anneeCourante = new Date().getFullYear();
  const consosAnnee = consommations.filter(
    (c) => new Date(c.date).getFullYear() === anneeCourante,
  ).length;

  const consosParLot = new Map<string, number>();
  for (const c of consommations) {
    consosParLot.set(c.bouteilleId, (consosParLot.get(c.bouteilleId) ?? 0) + 1);
  }
  let achatsAnnee = 0;
  for (const b of bouteilles) {
    if (b.dateAchat && new Date(b.dateAchat).getFullYear() === anneeCourante) {
      achatsAnnee += b.quantite + (consosParLot.get(b.id) ?? 0);
    }
  }

  return {
    totalBouteilles,
    valeurTotale,
    nbReferences: lignes.length,
    parCouleur: trierRepartition(parCouleur),
    parRegion: trierRepartition(parRegion),
    parMillesime: trierRepartition(parMillesime),
    lignes,
    plusAnciennes,
    valeurDormante,
    grossesQuantites,
    achatsAnnee,
    consosAnnee,
  };
}
