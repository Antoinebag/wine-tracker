// Modèle de données — conforme au §3 de la spécification.

export type Couleur = 'rouge' | 'blanc' | 'rosé' | 'effervescent' | 'autre';

export const COULEURS: Couleur[] = ['rouge', 'blanc', 'rosé', 'effervescent', 'autre'];

export type Format =
  | 'demi 37.5cl'
  | 'bouteille 75cl'
  | 'magnum 1.5L'
  | 'jéroboam 3L'
  | 'autre';

export const FORMATS: Format[] = [
  'demi 37.5cl',
  'bouteille 75cl',
  'magnum 1.5L',
  'jéroboam 3L',
  'autre',
];

export const FORMAT_DEFAUT: Format = 'bouteille 75cl';

export type GardeType = 'à boire vite' | 'peut attendre' | 'garde longue';

export const GARDE_TYPES: GardeType[] = ['à boire vite', 'peut attendre', 'garde longue'];

/** La fiche descriptive d'un vin — partagée par toutes ses bouteilles. */
export interface Vin {
  id: string;
  nom: string;
  domaine?: string;
  couleur?: Couleur;
  millesime?: number;
  region?: string;
  appellation?: string;
  cepages?: string[];
  degre?: number;
  notePerso?: number; // 1–5
  notesDegustation?: string;
  accordsMets?: string;
  tags?: string[];
  createdAt: string; // ISO
  updatedAt: string; // ISO
}

/** Un lot de bouteilles acheté à un moment/prix donné. */
export interface Bouteille {
  id: string;
  vinId: string;
  quantite: number;
  format?: Format;
  prixAchat?: number; // prix unitaire
  dateAchat?: string; // ISO (date)
  sourceAchat?: string;
  emplacement?: string;
  aBoireAvant?: string; // ISO (date)
  aBoireAPartirDe?: string; // ISO (date)
  gardeType?: GardeType;
}

/** Historique d'une bouteille bue. */
export interface Consommation {
  id: string;
  bouteilleId: string;
  vinId: string; // dénormalisé pour conserver l'historique même si le lot est édité
  date: string; // ISO
  noteDuJour?: string;
  occasion?: string;
}

/**
 * Photo d'étiquette, stockée séparément des fiches.
 * `photos` contient l'image pleine, `thumbs` la miniature : les listes/galeries
 * ne chargent que les miniatures (bien plus légères) pour rester rapides.
 */
export interface PhotoRecord {
  vinId: string;
  blob: Blob;
}
