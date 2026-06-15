import { describe, it, expect, beforeEach } from 'vitest';
import { db } from '../db/db';
import { creerVin } from '../repositories/vins';
import {
  creerBouteille,
  ajusterQuantite,
  boireUne,
} from '../repositories/bouteilles';
import { annulerConsommation } from '../repositories/consommations';

beforeEach(async () => {
  await Promise.all([
    db.vins.clear(),
    db.bouteilles.clear(),
    db.consommations.clear(),
    db.photos.clear(),
    db.thumbs.clear(),
  ]);
});

describe('gestion du stock', () => {
  it('ajuste la quantité sans descendre sous zéro', async () => {
    const vinId = await creerVin({ nom: 'Test' });
    const lotId = await creerBouteille({ vinId, quantite: 2 });

    expect(await ajusterQuantite(lotId, +1)).toBe(3);
    expect(await ajusterQuantite(lotId, -5)).toBe(0); // borné à 0
  });

  it('« j’en bois une » décrémente et historise', async () => {
    const vinId = await creerVin({ nom: 'Test' });
    const lotId = await creerBouteille({ vinId, quantite: 2 });
    const lot = (await db.bouteilles.get(lotId))!;

    await boireUne(lot, { occasion: 'apéro', noteDuJour: 'super' });

    expect((await db.bouteilles.get(lotId))!.quantite).toBe(1);
    const consos = await db.consommations.where('vinId').equals(vinId).toArray();
    expect(consos).toHaveLength(1);
    expect(consos[0].occasion).toBe('apéro');
  });

  it('ne descend pas sous zéro et n’historise pas un lot vide', async () => {
    const vinId = await creerVin({ nom: 'Test' });
    const lotId = await creerBouteille({ vinId, quantite: 0 });
    const lot = (await db.bouteilles.get(lotId))!;

    await boireUne(lot);

    expect((await db.bouteilles.get(lotId))!.quantite).toBe(0);
    expect(await db.consommations.count()).toBe(0);
  });

  it('annule une consommation et remet en stock', async () => {
    const vinId = await creerVin({ nom: 'Test' });
    const lotId = await creerBouteille({ vinId, quantite: 1 });
    const lot = (await db.bouteilles.get(lotId))!;

    await boireUne(lot);
    const conso = (await db.consommations.toArray())[0];
    await annulerConsommation(conso.id);

    expect((await db.bouteilles.get(lotId))!.quantite).toBe(1);
    expect(await db.consommations.count()).toBe(0);
  });
});
