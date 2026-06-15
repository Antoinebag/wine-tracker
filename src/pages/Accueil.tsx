import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import SearchBar from '../components/SearchBar';
import WineCard from '../components/WineCard';
import { useCaveData } from '../hooks/useCaveData';
import { agregerCave } from '../lib/cave';
import { filtreVins } from '../repositories/vins';
import { calculerInventaire } from '../lib/stats';
import { formatPrix, pluriel } from '../lib/format';
import { useReglages } from '../lib/preferences';

export default function Accueil() {
  const data = useCaveData();
  const { seuilMois } = useReglages();
  const [requete, setRequete] = useState('');

  const aggs = useMemo(
    () => (data ? agregerCave(data.vins, data.bouteilles, seuilMois) : []),
    [data, seuilMois],
  );

  const inventaire = useMemo(
    () => (data ? calculerInventaire(data.vins, data.bouteilles) : null),
    [data],
  );

  if (!data) return <ChargementAccueil />;

  const aggParVin = new Map(aggs.map((a) => [a.vin.id, a]));
  const resultats = requete.trim()
    ? filtreVins(data.vins, requete).map((v) => aggParVin.get(v.id)!)
    : [];

  const aBoireBientot = aggs
    .filter((a) => a.quantite > 0 && a.urgence)
    .sort((a, b) => {
      const ja = a.joursRestantsMin ?? Number.MAX_SAFE_INTEGER;
      const jb = b.joursRestantsMin ?? Number.MAX_SAFE_INTEGER;
      return ja - jb;
    });

  const vide = data.vins.length === 0;

  return (
    <div className="space-y-5">
      <header className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-wine-800">Ma Cave</h1>
        {inventaire && inventaire.totalBouteilles > 0 && (
          <span className="text-sm text-stone-500">
            {pluriel(inventaire.totalBouteilles, 'bouteille')}
          </span>
        )}
      </header>

      <SearchBar value={requete} onChange={setRequete} />

      {requete.trim() ? (
        <section className="space-y-2">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-stone-500">
            {pluriel(resultats.length, 'résultat')}
          </h2>
          {resultats.map((a) => (
            <WineCard
              key={a.vin.id}
              vin={a.vin}
              quantite={a.quantite}
              prix={a.prix}
              thumb={data.thumbs.get(a.vin.id)}
              urgence={a.urgence}
            />
          ))}
          {resultats.length === 0 && (
            <p className="py-8 text-center text-stone-500">Aucun vin ne correspond.</p>
          )}
        </section>
      ) : vide ? (
        <EtatVide />
      ) : (
        <>
          {inventaire && (
            <Link
              to="/inventaire"
              className="card flex items-center justify-between p-4 active:bg-stone-50"
            >
              <div>
                <div className="text-sm text-stone-500">Valeur de la cave</div>
                <div className="text-2xl font-bold text-wine-800">
                  {formatPrix(inventaire.valeurTotale)}
                </div>
              </div>
              <div className="text-right text-sm text-stone-500">
                {pluriel(inventaire.nbReferences, 'référence')}
                <div className="text-wine-600">Voir l’inventaire →</div>
              </div>
            </Link>
          )}

          <section className="space-y-2">
            <h2 className="text-sm font-semibold uppercase tracking-wide text-stone-500">
              ⏳ À boire bientôt
            </h2>
            {aBoireBientot.length === 0 ? (
              <p className="card p-4 text-sm text-stone-500">
                Rien d’urgent. Tout peut encore attendre 🍷
              </p>
            ) : (
              aBoireBientot
                .slice(0, 10)
                .map((a) => (
                  <WineCard
                    key={a.vin.id}
                    vin={a.vin}
                    quantite={a.quantite}
                    prix={a.prix}
                    thumb={data.thumbs.get(a.vin.id)}
                    urgence={a.urgence}
                  />
                ))
            )}
          </section>
        </>
      )}
    </div>
  );
}

function EtatVide() {
  return (
    <div className="card mt-6 space-y-3 p-6 text-center">
      <div className="text-5xl">🍷</div>
      <h2 className="text-lg font-semibold text-stone-800">Votre cave est vide</h2>
      <p className="text-stone-500">
        Ajoutez votre première bouteille avec le bouton <strong>+</strong> en bas à droite. Un nom
        suffit, vous compléterez plus tard.
      </p>
      <Link to="/vin/nouveau" className="btn-primary mx-auto w-full max-w-xs">
        + Ajouter un vin
      </Link>
    </div>
  );
}

function ChargementAccueil() {
  return (
    <div className="space-y-3">
      <div className="h-8 w-32 animate-pulse rounded bg-stone-200" />
      <div className="h-12 animate-pulse rounded-xl bg-stone-200" />
      <div className="h-20 animate-pulse rounded-2xl bg-stone-200" />
      <div className="h-20 animate-pulse rounded-2xl bg-stone-200" />
    </div>
  );
}
