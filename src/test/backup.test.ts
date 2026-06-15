import { describe, it, expect, beforeEach } from 'vitest';
import { db } from '../db/db';
import { creerVin } from '../repositories/vins';
import { creerBouteille } from '../repositories/bouteilles';
import {
  construireSauvegarde,
  appliquerSauvegarde,
  genererCsv,
  parserCsv,
} from '../lib/backup';

beforeEach(async () => {
  await Promise.all([
    db.vins.clear(),
    db.bouteilles.clear(),
    db.consommations.clear(),
    db.photos.clear(),
    db.thumbs.clear(),
  ]);
});

describe('sauvegarde JSON', () => {
  it('exporte puis réimporte fidèlement (round-trip)', async () => {
    const vinId = await creerVin({
      nom: 'Côte-Rôtie',
      couleur: 'rouge',
      region: 'Rhône',
      millesime: 2019,
      tags: ['coup de cœur'],
    });
    await creerBouteille({ vinId, quantite: 3, prixAchat: 45, format: 'bouteille 75cl' });

    const sauvegarde = await construireSauvegarde();
    expect(sauvegarde.vins).toHaveLength(1);
    expect(sauvegarde.bouteilles).toHaveLength(1);

    // On simule une restauration sur une base vide.
    await db.vins.clear();
    await db.bouteilles.clear();
    await appliquerSauvegarde(sauvegarde, { remplacer: true });

    const vins = await db.vins.toArray();
    expect(vins).toHaveLength(1);
    expect(vins[0].nom).toBe('Côte-Rôtie');
    expect(vins[0].tags).toEqual(['coup de cœur']);
    expect(await db.bouteilles.count()).toBe(1);
  });

  it('refuse un fichier invalide', async () => {
    await expect(appliquerSauvegarde({ app: 'autre' } as never)).rejects.toThrow();
  });
});

describe('CSV', () => {
  it('génère un CSV avec en-têtes et une ligne par lot', async () => {
    const vinId = await creerVin({ nom: 'Sancerre', couleur: 'blanc', region: 'Loire' });
    await creerBouteille({ vinId, quantite: 2, prixAchat: 18 });

    const csv = await genererCsv();
    const lignes = csv.replace(/^﻿/, '').split('\r\n');
    expect(lignes[0]).toContain('Nom');
    expect(lignes[0]).toContain('Valeur lot');
    expect(lignes[1]).toContain('Sancerre');
    expect(lignes[1]).toContain('36'); // 2 * 18
  });

  it('importe un CSV en créant vins et lots', () => {
    const csv =
      'Nom;Couleur;Région;Millésime;Quantité;Prix unitaire\r\n' +
      'Chablis;blanc;Bourgogne;2021;4;15\r\n' +
      'Margaux;rouge;Bordeaux;2015;1;60';
    const { vins, bouteilles } = parserCsv(csv);
    expect(vins).toHaveLength(2);
    expect(bouteilles).toHaveLength(2);
    const chablis = vins.find((v) => v.nom === 'Chablis')!;
    expect(chablis.couleur).toBe('blanc');
    const lotChablis = bouteilles.find((b) => b.vinId === chablis.id)!;
    expect(lotChablis.quantite).toBe(4);
    expect(lotChablis.prixAchat).toBe(15);
  });

  it('échappe les champs contenant le séparateur', () => {
    const { vins } = parserCsv('Nom;Notes\r\n"Vin, spécial";"Note ; avec point-virgule"');
    expect(vins[0].nom).toBe('Vin, spécial');
  });
});
