import { formatPrix } from '../lib/format';

interface Props {
  label: string;
  bouteilles: number;
  valeur?: number;
  max: number;
  couleurClasse?: string;
}

export default function StatBar({ label, bouteilles, valeur, max, couleurClasse = 'bg-wine-600' }: Props) {
  const pct = max > 0 ? Math.max(4, Math.round((bouteilles / max) * 100)) : 0;
  return (
    <div>
      <div className="mb-1 flex items-baseline justify-between text-sm">
        <span className="font-medium capitalize text-stone-700">{label}</span>
        <span className="text-stone-500">
          {bouteilles} bt{valeur != null ? ` · ${formatPrix(valeur)}` : ''}
        </span>
      </div>
      <div className="h-2.5 w-full overflow-hidden rounded-full bg-stone-100">
        <div className={`h-full rounded-full ${couleurClasse}`} style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}
