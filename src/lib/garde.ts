// Logique « À boire bientôt » (§4.4).
import type { Bouteille } from '../db/types';

export const SEUIL_MOIS_DEFAUT = 6;

function dansNMois(n: number): Date {
  const d = new Date();
  d.setMonth(d.getMonth() + n);
  return d;
}

/** Le nombre de jours restant avant `aBoireAvant` (négatif si dépassé), ou null. */
export function joursRestants(aBoireAvant?: string): number | null {
  if (!aBoireAvant) return null;
  const cible = new Date(aBoireAvant);
  if (Number.isNaN(cible.getTime())) return null;
  const ms = cible.getTime() - Date.now();
  return Math.round(ms / (1000 * 60 * 60 * 24));
}

/**
 * Une bouteille est « à boire bientôt » si elle est encore en stock et :
 *  - marquée « à boire vite », ou
 *  - sa date `aBoireAvant` arrive dans moins de `seuilMois` (ou est déjà dépassée).
 */
export function estABoireBientot(b: Bouteille, seuilMois = SEUIL_MOIS_DEFAUT): boolean {
  if (b.quantite <= 0) return false;
  if (b.gardeType === 'à boire vite') return true;
  if (b.aBoireAvant) {
    const limite = dansNMois(seuilMois);
    return new Date(b.aBoireAvant) <= limite;
  }
  return false;
}

/** True si la fenêtre de garde est dépassée (à boire en urgence / périmé). */
export function estDepasse(aBoireAvant?: string): boolean {
  const j = joursRestants(aBoireAvant);
  return j != null && j < 0;
}

/** Texte court d'urgence pour l'UI, ou null si rien à signaler. */
export function urgenceLabel(b: Bouteille): string | null {
  const j = joursRestants(b.aBoireAvant);
  if (j != null) {
    if (j < 0) return 'À boire — apogée dépassée';
    if (j < 31) return 'À boire ce mois-ci';
    if (j < 186) return 'À boire bientôt';
  }
  if (b.gardeType === 'à boire vite') return 'À boire vite';
  return null;
}
