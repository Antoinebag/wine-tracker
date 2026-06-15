import { describe, it, expect } from 'vitest';
import { estABoireBientot, estDepasse, joursRestants } from '../lib/garde';
import type { Bouteille } from '../db/types';

function lot(p: Partial<Bouteille>): Bouteille {
  return { id: '1', vinId: 'v', quantite: 1, ...p };
}

function dansNJours(n: number): string {
  const d = new Date();
  d.setDate(d.getDate() + n);
  return d.toISOString().slice(0, 10);
}

describe('garde', () => {
  it('ignore les lots épuisés', () => {
    expect(estABoireBientot(lot({ quantite: 0, gardeType: 'à boire vite' }))).toBe(false);
  });

  it('repère « à boire vite »', () => {
    expect(estABoireBientot(lot({ gardeType: 'à boire vite' }))).toBe(true);
  });

  it('repère une date d’apogée proche', () => {
    expect(estABoireBientot(lot({ aBoireAvant: dansNJours(30) }), 6)).toBe(true);
  });

  it('laisse de côté une date lointaine', () => {
    expect(estABoireBientot(lot({ aBoireAvant: dansNJours(3650) }), 6)).toBe(false);
  });

  it('détecte une apogée dépassée', () => {
    expect(estDepasse(dansNJours(-10))).toBe(true);
    expect(estDepasse(dansNJours(10))).toBe(false);
  });

  it('calcule les jours restants', () => {
    expect(joursRestants(dansNJours(5))).toBeGreaterThanOrEqual(4);
    expect(joursRestants(undefined)).toBeNull();
  });
});
