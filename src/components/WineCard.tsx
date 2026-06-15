import { Link } from 'react-router-dom';
import type { Vin } from '../db/types';
import { formatPrix, couleurEmoji, couleurClasse } from '../lib/format';
import { urlDePhoto } from '../lib/photos';

interface Props {
  vin: Vin;
  quantite: number;
  prix?: number;
  thumb?: Blob;
  urgence?: string | null;
}

export default function WineCard({ vin, quantite, prix, thumb, urgence }: Props) {
  const url = urlDePhoto(thumb);
  const epuise = quantite <= 0;

  return (
    <Link
      to={`/vin/${vin.id}`}
      className={`card flex items-center gap-3 p-3 active:bg-stone-50 ${epuise ? 'opacity-60' : ''}`}
    >
      {url ? (
        <img src={url} alt="" className="h-14 w-14 shrink-0 rounded-xl object-cover" />
      ) : (
        <div
          className={`flex h-14 w-14 shrink-0 items-center justify-center rounded-xl text-2xl ${couleurClasse(
            vin.couleur,
          )} bg-opacity-20`}
        >
          {couleurEmoji(vin.couleur)}
        </div>
      )}

      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <span className="truncate font-semibold text-stone-900">{vin.nom}</span>
          {vin.millesime ? <span className="text-sm text-stone-500">{vin.millesime}</span> : null}
        </div>
        <div className="truncate text-sm text-stone-500">
          {[vin.domaine, vin.region].filter(Boolean).join(' · ') || ' '}
        </div>
        {urgence && (
          <span className="mt-1 inline-block rounded-full bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-800">
            ⏳ {urgence}
          </span>
        )}
      </div>

      <div className="shrink-0 text-right">
        {prix != null && <div className="font-semibold text-wine-700">{formatPrix(prix)}</div>}
        <div
          className={`mt-0.5 inline-block rounded-full px-2 py-0.5 text-xs font-medium ${
            epuise ? 'bg-stone-200 text-stone-600' : 'bg-wine-50 text-wine-700'
          }`}
        >
          {epuise ? 'épuisé' : `× ${quantite}`}
        </div>
      </div>
    </Link>
  );
}
