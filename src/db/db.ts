import Dexie, { type Table } from 'dexie';
import type { Vin, Bouteille, Consommation, PhotoRecord } from './types';

export class CaveDB extends Dexie {
  vins!: Table<Vin, string>;
  bouteilles!: Table<Bouteille, string>;
  consommations!: Table<Consommation, string>;
  photos!: Table<PhotoRecord, string>; // image pleine
  thumbs!: Table<PhotoRecord, string>; // miniature (chargée par les listes)

  constructor() {
    super('cave-a-vin');
    // Versionnage dès la v1 pour permettre des migrations futures sans perte de données.
    this.version(1).stores({
      vins: 'id, nom, couleur, region, *tags, createdAt',
      bouteilles: 'id, vinId, gardeType, aBoireAvant, dateAchat',
      consommations: 'id, bouteilleId, vinId, date',
      photos: 'vinId',
      thumbs: 'vinId',
    });
  }
}

export const db = new CaveDB();

export function nouvelId(): string {
  // crypto.randomUUID() est dispo sur tous les navigateurs cibles (et Node 22 pour les tests).
  return crypto.randomUUID();
}

export function maintenantIso(): string {
  return new Date().toISOString();
}

/** Date du jour au format ISO court (YYYY-MM-DD) pour les champs de type date. */
export function aujourdHuiIso(): string {
  return new Date().toISOString().slice(0, 10);
}
