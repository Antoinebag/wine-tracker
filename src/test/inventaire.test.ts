import { describe, it, expect } from 'vitest';
import { calculerInventaire } from '../lib/stats';
import type { Vin, Bouteille, Consommation } from '../db/types';

function vin(p: Partial<Vin> & { id: string; nom: string }): Vin {
  return { createdAt: '2024-01-01', updatedAt: '2024-01-01', ...p };
}

describe('calculerInventaire', () => {
  const vins: Vin[] = [
    vin({ id: 'a', nom: 'Rouge A', couleur: 'rouge', region: 'Bordeaux', millesime: 2018 }),
    vin({ id: 'b', nom: 'Blanc B', couleur: 'blanc', region: 'Bourgogne', millesime: 2020 }),
  ];
  const bouteilles: Bouteille[] = [
    { id: '1', vinId: 'a', quantite: 6, prixAchat: 10, dateAchat: '2024-02-01' },
    { id: '2', vinId: 'a', quantite: 0, prixAchat: 10, dateAchat: '2023-01-01' }, // épuisé : ignoré
    { id: '3', vinId: 'b', quantite: 2, prixAchat: 25, dateAchat: '2024-03-01' },
  ];

  it('totalise bouteilles et valeur en ignorant les lots épuisés', () => {
    const inv = calculerInventaire(vins, bouteilles);
    expect(inv.totalBouteilles).toBe(8); // 6 + 2
    expect(inv.valeurTotale).toBe(110); // 6*10 + 2*25
    expect(inv.nbReferences).toBe(2);
  });

  it('répartit par couleur', () => {
    const inv = calculerInventaire(vins, bouteilles);
    const rouge = inv.parCouleur.find((r) => r.cle === 'rouge');
    expect(rouge?.bouteilles).toBe(6);
    expect(rouge?.valeur).toBe(60);
  });

  it('calcule la valeur unitaire moyenne par ligne', () => {
    const inv = calculerInventaire(vins, bouteilles);
    const ligneA = inv.lignes.find((l) => l.vin.id === 'a');
    expect(ligneA?.quantite).toBe(6);
    expect(ligneA?.valeurUnitaireMoy).toBe(10);
  });

  it('compte achats et consommations de l’année courante', () => {
    const annee = new Date().getFullYear();
    const bts: Bouteille[] = [
      { id: '1', vinId: 'a', quantite: 3, prixAchat: 10, dateAchat: `${annee}-02-01` },
    ];
    const consos: Consommation[] = [
      { id: 'c1', bouteilleId: '1', vinId: 'a', date: `${annee}-04-01T12:00:00Z` },
    ];
    const inv = calculerInventaire(vins, bts, consos);
    expect(inv.consosAnnee).toBe(1);
    expect(inv.achatsAnnee).toBe(4); // 3 restantes + 1 bue
  });
});
