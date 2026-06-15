import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import SearchBar from '../components/SearchBar';
import WineCard from '../components/WineCard';
import { useCaveData } from '../hooks/useCaveData';
import { agregerCave, type AggVin } from '../lib/cave';
import { filtreVins } from '../repositories/vins';
import { useReglages } from '../lib/preferences';
import { COULEURS } from '../db/types';
import { couleurEmoji, couleurClasse, formatPrix, pluriel } from '../lib/format';
import { urlDePhoto } from '../lib/photos';

type Tri = 'recent' | 'nom' | 'prix' | 'quantite' | 'aboire';

export default function Cave() {
  const data = useCaveData();
  const { seuilMois } = useReglages();

  const [requete, setRequete] = useState('');
  const [couleur, setCouleur] = useState('');
  const [region, setRegion] = useState('');
  const [source, setSource] = useState('');
  const [tri, setTri] = useState<Tri>('recent');
  const [galerie, setGalerie] = useState(false);
  const [inclureEpuises, setInclureEpuises] = useState(false);

  const aggs = useMemo(
    () => (data ? agregerCave(data.vins, data.bouteilles, seuilMois) : []),
    [data, seuilMois],
  );

  const regions = useMemo(
    () => trierUniques(data?.vins.map((v) => v.region)),
    [data],
  );
  const sources = useMemo(
    () => trierUniques(data?.bouteilles.map((b) => b.sourceAchat)),
    [data],
  );

  if (!data) return <p className="py-10 text-center text-stone-500">Chargement…</p>;

  const aggParVin = new Map(aggs.map((a) => [a.vin.id, a]));
  let vins = filtreVins(data.vins, requete);

  let liste: AggVin[] = vins.map((v) => aggParVin.get(v.id)!);

  if (couleur) liste = liste.filter((a) => a.vin.couleur === couleur);
  if (region) liste = liste.filter((a) => a.vin.region === region);
  if (source)
    liste = liste.filter((a) => a.lots.some((l) => l.sourceAchat === source));
  if (!inclureEpuises) liste = liste.filter((a) => a.quantite > 0);

  liste = trierListe(liste, tri);

  return (
    <div className="space-y-4">
      <header className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-wine-800">Ma cave</h1>
        <button
          type="button"
          className="btn-secondary px-3"
          onClick={() => setGalerie((g) => !g)}
        >
          {galerie ? '☰ Liste' : '▦ Galerie'}
        </button>
      </header>

      <SearchBar value={requete} onChange={setRequete} />

      {/* Filtres couleur */}
      <div className="flex flex-wrap gap-2">
        <FiltreChip actif={!couleur} onClick={() => setCouleur('')} label="Toutes" />
        {COULEURS.map((c) => (
          <FiltreChip
            key={c}
            actif={couleur === c}
            onClick={() => setCouleur(couleur === c ? '' : c)}
            label={`${couleurEmoji(c)} ${c}`}
          />
        ))}
      </div>

      {/* Filtres avancés + tri */}
      <div className="grid grid-cols-2 gap-2">
        <select className="field-input" value={region} onChange={(e) => setRegion(e.target.value)}>
          <option value="">Toutes régions</option>
          {regions.map((r) => (
            <option key={r} value={r}>
              {r}
            </option>
          ))}
        </select>
        <select className="field-input" value={source} onChange={(e) => setSource(e.target.value)}>
          <option value="">Toutes sources</option>
          {sources.map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </select>
        <select
          className="field-input col-span-2"
          value={tri}
          onChange={(e) => setTri(e.target.value as Tri)}
        >
          <option value="recent">Tri : récemment ajoutés</option>
          <option value="nom">Tri : nom (A→Z)</option>
          <option value="prix">Tri : prix décroissant</option>
          <option value="quantite">Tri : quantité décroissante</option>
          <option value="aboire">Tri : à boire en premier</option>
        </select>
      </div>

      <label className="flex items-center gap-2 text-sm text-stone-600">
        <input
          type="checkbox"
          className="h-5 w-5"
          checked={inclureEpuises}
          onChange={(e) => setInclureEpuises(e.target.checked)}
        />
        Inclure les vins épuisés
      </label>

      <p className="text-sm text-stone-500">{pluriel(liste.length, 'vin')}</p>

      {liste.length === 0 ? (
        <p className="py-8 text-center text-stone-500">Aucun vin ne correspond à ces filtres.</p>
      ) : galerie ? (
        <div className="grid grid-cols-3 gap-2">
          {liste.map((a) => (
            <GalerieTuile key={a.vin.id} agg={a} thumb={data.thumbs.get(a.vin.id)} />
          ))}
        </div>
      ) : (
        <div className="space-y-2">
          {liste.map((a) => (
            <WineCard
              key={a.vin.id}
              vin={a.vin}
              quantite={a.quantite}
              prix={a.prix}
              thumb={data.thumbs.get(a.vin.id)}
              urgence={a.urgence}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function trierUniques(valeurs?: (string | undefined)[]): string[] {
  if (!valeurs) return [];
  return [...new Set(valeurs.filter((v): v is string => !!v))].sort((a, b) =>
    a.localeCompare(b, 'fr'),
  );
}

function trierListe(liste: AggVin[], tri: Tri): AggVin[] {
  const copie = [...liste];
  switch (tri) {
    case 'nom':
      return copie.sort((a, b) => a.vin.nom.localeCompare(b.vin.nom, 'fr'));
    case 'prix':
      return copie.sort((a, b) => (b.prix ?? -1) - (a.prix ?? -1));
    case 'quantite':
      return copie.sort((a, b) => b.quantite - a.quantite);
    case 'aboire':
      return copie.sort(
        (a, b) =>
          (a.joursRestantsMin ?? Number.MAX_SAFE_INTEGER) -
          (b.joursRestantsMin ?? Number.MAX_SAFE_INTEGER),
      );
    case 'recent':
    default:
      return copie.sort((a, b) => (a.vin.createdAt < b.vin.createdAt ? 1 : -1));
  }
}

function FiltreChip({
  actif,
  onClick,
  label,
}: {
  actif: boolean;
  onClick: () => void;
  label: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`min-h-touch rounded-full border px-3 text-sm capitalize ${
        actif
          ? 'border-wine-600 bg-wine-700 text-white'
          : 'border-stone-300 bg-white text-stone-600'
      }`}
    >
      {label}
    </button>
  );
}

function GalerieTuile({ agg, thumb }: { agg: AggVin; thumb?: Blob }) {
  const url = urlDePhoto(thumb);
  const epuise = agg.quantite <= 0;
  return (
    <Link
      to={`/vin/${agg.vin.id}`}
      className={`relative block aspect-square overflow-hidden rounded-xl border border-stone-200 ${
        epuise ? 'opacity-60' : ''
      }`}
    >
      {url ? (
        <img src={url} alt={agg.vin.nom} className="h-full w-full object-cover" />
      ) : (
        <div
          className={`flex h-full w-full items-center justify-center text-4xl ${couleurClasse(
            agg.vin.couleur,
          )} bg-opacity-20`}
        >
          {couleurEmoji(agg.vin.couleur)}
        </div>
      )}
      <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/70 to-transparent p-1.5">
        <div className="truncate text-xs font-medium text-white">{agg.vin.nom}</div>
        <div className="flex items-center justify-between text-[10px] text-white/80">
          <span>{epuise ? 'épuisé' : `× ${agg.quantite}`}</span>
          {agg.prix != null && <span>{formatPrix(agg.prix)}</span>}
        </div>
      </div>
    </Link>
  );
}
