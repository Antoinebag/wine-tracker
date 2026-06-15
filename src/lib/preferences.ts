import { useSyncExternalStore } from 'react';
import { SEUIL_MOIS_DEFAUT } from './garde';

export interface Reglages {
  seuilMois: number; // horizon « à boire bientôt »
}

const CLE = 'cave-reglages';
const DEFAUT: Reglages = { seuilMois: SEUIL_MOIS_DEFAUT };

function lire(): Reglages {
  try {
    const brut = localStorage.getItem(CLE);
    if (!brut) return DEFAUT;
    return { ...DEFAUT, ...JSON.parse(brut) };
  } catch {
    return DEFAUT;
  }
}

const abonnes = new Set<() => void>();
let cache = lire();

function notifier() {
  cache = lire();
  abonnes.forEach((cb) => cb());
}

export function setReglages(patch: Partial<Reglages>): void {
  const suivant = { ...lire(), ...patch };
  localStorage.setItem(CLE, JSON.stringify(suivant));
  notifier();
}

export function useReglages(): Reglages {
  return useSyncExternalStore(
    (cb) => {
      abonnes.add(cb);
      return () => abonnes.delete(cb);
    },
    () => cache,
    () => DEFAUT,
  );
}
