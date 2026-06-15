// @vitest-environment jsdom
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import App from '../App';
import { db } from '../db/db';
import { creerVin } from '../repositories/vins';
import { creerBouteille } from '../repositories/bouteilles';

let container: HTMLDivElement;
let root: Root;

beforeEach(async () => {
  await Promise.all([
    db.vins.clear(),
    db.bouteilles.clear(),
    db.consommations.clear(),
    db.photos.clear(),
    db.thumbs.clear(),
  ]);
  container = document.createElement('div');
  document.body.appendChild(container);
});

afterEach(async () => {
  await act(async () => {
    root.unmount();
  });
  container.remove();
});

async function rendre(hash: string) {
  window.location.hash = hash;
  root = createRoot(container);
  await act(async () => {
    root.render(<App />);
  });
  // Laisse les requêtes Dexie (useLiveQuery) se résoudre.
  await act(async () => {
    await new Promise((r) => setTimeout(r, 60));
  });
}

describe('smoke — montage des écrans', () => {
  it('affiche l’accueil et l’état vide sans planter', async () => {
    await rendre('#/');
    expect(container.textContent).toContain('Ma Cave');
    expect(container.textContent).toContain('Votre cave est vide');
  });

  it('liste un vin dans la cave', async () => {
    const vinId = await creerVin({ nom: 'Pétrus', couleur: 'rouge', region: 'Bordeaux' });
    await creerBouteille({ vinId, quantite: 2, prixAchat: 30 });

    await rendre('#/cave');
    expect(container.textContent).toContain('Pétrus');
    expect(container.textContent).toContain('Bordeaux');
  });

  it('rend la fiche d’un vin avec prix et stock', async () => {
    const vinId = await creerVin({ nom: 'Chambertin' });
    await creerBouteille({ vinId, quantite: 1, prixAchat: 120 });

    await rendre(`#/vin/${vinId}`);
    expect(container.textContent).toContain('Chambertin');
    expect(container.textContent).toContain('Prix payé');
    expect(container.textContent).toContain('Stock & achats');
  });

  it('rend le formulaire de nouveau vin', async () => {
    await rendre('#/vin/nouveau');
    expect(container.textContent).toContain('Nouveau vin');
    expect(container.textContent).toContain('Nom du vin');
  });

  it('rend l’inventaire avec totaux', async () => {
    const vinId = await creerVin({ nom: 'Hermitage', couleur: 'rouge' });
    await creerBouteille({ vinId, quantite: 3, prixAchat: 40 });

    await rendre('#/inventaire');
    expect(container.textContent).toContain('Inventaire');
    expect(container.textContent).toContain('Valeur totale');
  });

  it('rend les réglages', async () => {
    await rendre('#/reglages');
    expect(container.textContent).toContain('Réglages');
    expect(container.textContent).toContain('Sauvegarde');
  });
});
