// Formatage en français (prix en €, dates fr-FR).

const formateurPrix = new Intl.NumberFormat('fr-FR', {
  style: 'currency',
  currency: 'EUR',
  minimumFractionDigits: 0,
  maximumFractionDigits: 2,
});

export function formatPrix(valeur: number | undefined | null): string {
  if (valeur == null || Number.isNaN(valeur)) return '—';
  return formateurPrix.format(valeur);
}

const formateurDate = new Intl.DateTimeFormat('fr-FR', {
  day: '2-digit',
  month: 'short',
  year: 'numeric',
});

export function formatDate(iso: string | undefined | null): string {
  if (!iso) return '—';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '—';
  return formateurDate.format(d);
}

/** Pluriel simple : 1 bouteille / 3 bouteilles. */
export function pluriel(n: number, singulier: string, pluriel?: string): string {
  if (n <= 1) return `${n} ${singulier}`;
  return `${n} ${pluriel ?? singulier + 's'}`;
}

const COULEUR_EMOJI: Record<string, string> = {
  rouge: '🍷',
  blanc: '🥂',
  rosé: '🌸',
  effervescent: '🍾',
  autre: '🍶',
};

export function couleurEmoji(couleur?: string): string {
  return (couleur && COULEUR_EMOJI[couleur]) || '🍷';
}

const COULEUR_CLASSE: Record<string, string> = {
  rouge: 'bg-wine-700',
  blanc: 'bg-amber-300',
  rosé: 'bg-pink-300',
  effervescent: 'bg-yellow-200',
  autre: 'bg-stone-300',
};

export function couleurClasse(couleur?: string): string {
  return (couleur && COULEUR_CLASSE[couleur]) || 'bg-stone-300';
}
