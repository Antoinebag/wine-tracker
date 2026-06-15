import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../db/db';
import StatBar from '../components/StatBar';
import { calculerInventaire, type LigneInventaire } from '../lib/stats';
import { formatPrix, formatDate, pluriel, couleurClasse } from '../lib/format';
import { exporterCsvFichier } from '../lib/backup';

export default function Inventaire() {
  const data = useLiveQuery(async () => {
    const [vins, bouteilles, consommations] = await Promise.all([
      db.vins.toArray(),
      db.bouteilles.toArray(),
      db.consommations.toArray(),
    ]);
    return { vins, bouteilles, consommations };
  }, []);

  const [modeInventaire, setModeInventaire] = useState(false);

  const inv = useMemo(
    () => (data ? calculerInventaire(data.vins, data.bouteilles, data.consommations) : null),
    [data],
  );

  if (!inv) return <p className="py-10 text-center text-stone-500">Chargement…</p>;

  if (inv.totalBouteilles === 0) {
    return (
      <div className="space-y-4">
        <h1 className="text-2xl font-bold text-wine-800">Inventaire</h1>
        <p className="card p-6 text-center text-stone-500">
          Aucune bouteille en stock pour l’instant.
        </p>
      </div>
    );
  }

  const maxCouleur = Math.max(...inv.parCouleur.map((r) => r.bouteilles), 1);
  const maxRegion = Math.max(...inv.parRegion.map((r) => r.bouteilles), 1);
  const maxMillesime = Math.max(...inv.parMillesime.map((r) => r.bouteilles), 1);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-wine-800">Inventaire</h1>
        <button
          type="button"
          className="btn-secondary px-3"
          onClick={() => setModeInventaire((m) => !m)}
        >
          {modeInventaire ? '← Synthèse' : '☰ Mode inventaire'}
        </button>
      </div>

      {/* Totaux clés */}
      <div className="grid grid-cols-2 gap-3">
        <Stat carte label="Bouteilles en cave" valeur={String(inv.totalBouteilles)} />
        <Stat carte label="Valeur totale" valeur={formatPrix(inv.valeurTotale)} accent />
        <Stat carte label="Références" valeur={String(inv.nbReferences)} />
        <Stat
          carte
          label="Cette année"
          valeur={`+${inv.achatsAnnee} / −${inv.consosAnnee}`}
          sousTitre="achetées / bues"
        />
      </div>

      {modeInventaire ? (
        <ModeInventaire lignes={inv.lignes} total={inv.valeurTotale} />
      ) : (
        <>
          {/* Répartitions */}
          <Section titre="Par couleur">
            {inv.parCouleur.map((r) => (
              <StatBar
                key={r.cle}
                label={r.cle}
                bouteilles={r.bouteilles}
                valeur={r.valeur || undefined}
                max={maxCouleur}
                couleurClasse={couleurClasse(r.cle)}
              />
            ))}
          </Section>

          <Section titre="Par région">
            {inv.parRegion.slice(0, 8).map((r) => (
              <StatBar
                key={r.cle}
                label={r.cle}
                bouteilles={r.bouteilles}
                valeur={r.valeur || undefined}
                max={maxRegion}
              />
            ))}
          </Section>

          <Section titre="Par millésime">
            {inv.parMillesime.slice(0, 10).map((r) => (
              <StatBar key={r.cle} label={r.cle} bouteilles={r.bouteilles} max={maxMillesime} />
            ))}
          </Section>

          {/* Mises en avant */}
          <Section titre="🕰️ Les plus anciennes en cave">
            {inv.plusAnciennes.map((l) => (
              <LigneVin
                key={l.vin.id}
                ligne={l}
                droite={l.dateAchatMin ? formatDate(l.dateAchatMin) : '—'}
              />
            ))}
          </Section>

          <Section titre="💤 Valeur dormante (les plus gros postes)">
            {inv.valeurDormante.map((l) => (
              <LigneVin key={l.vin.id} ligne={l} droite={formatPrix(l.valeur)} />
            ))}
          </Section>

          <Section titre="📦 Plus grosses quantités">
            {inv.grossesQuantites.map((l) => (
              <LigneVin key={l.vin.id} ligne={l} droite={pluriel(l.quantite, 'bt', 'bt')} />
            ))}
          </Section>
        </>
      )}
    </div>
  );
}

function ModeInventaire({ lignes, total }: { lignes: LigneInventaire[]; total: number }) {
  return (
    <section className="space-y-3">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-stone-500">
          {pluriel(lignes.length, 'référence')} en stock
        </h2>
        <button type="button" className="text-sm font-medium text-wine-600" onClick={exporterCsvFichier}>
          ⬇ Export CSV
        </button>
      </div>

      <div className="card overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-stone-200 text-left text-xs uppercase text-stone-500">
              <th className="p-2">Vin</th>
              <th className="p-2 text-right">Qté</th>
              <th className="p-2 text-right">P.U.</th>
              <th className="p-2 text-right">Total</th>
            </tr>
          </thead>
          <tbody>
            {lignes.map((l) => (
              <tr key={l.vin.id} className="border-b border-stone-100 last:border-0">
                <td className="p-2">
                  <Link to={`/vin/${l.vin.id}`} className="font-medium text-stone-800">
                    {l.vin.nom}
                  </Link>
                  <div className="text-xs text-stone-500">
                    {[l.vin.millesime, l.vin.region].filter(Boolean).join(' · ')}
                  </div>
                </td>
                <td className="p-2 text-right tabular-nums">{l.quantite}</td>
                <td className="p-2 text-right tabular-nums text-stone-500">
                  {l.valeurUnitaireMoy != null ? formatPrix(l.valeurUnitaireMoy) : '—'}
                </td>
                <td className="p-2 text-right font-medium tabular-nums">
                  {l.valeur > 0 ? formatPrix(l.valeur) : '—'}
                </td>
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr className="border-t-2 border-stone-300 font-semibold">
              <td className="p-2">Total</td>
              <td className="p-2 text-right tabular-nums">
                {lignes.reduce((s, l) => s + l.quantite, 0)}
              </td>
              <td />
              <td className="p-2 text-right tabular-nums text-wine-700">{formatPrix(total)}</td>
            </tr>
          </tfoot>
        </table>
      </div>
    </section>
  );
}

function Section({ titre, children }: { titre: string; children: React.ReactNode }) {
  return (
    <section className="space-y-3">
      <h2 className="text-sm font-semibold uppercase tracking-wide text-stone-500">{titre}</h2>
      <div className="card space-y-3 p-4">{children}</div>
    </section>
  );
}

function Stat({
  label,
  valeur,
  sousTitre,
  accent,
}: {
  label: string;
  valeur: string;
  sousTitre?: string;
  accent?: boolean;
  carte?: boolean;
}) {
  return (
    <div className="card p-4">
      <div className="text-xs uppercase tracking-wide text-stone-500">{label}</div>
      <div className={`text-2xl font-bold ${accent ? 'text-wine-700' : 'text-stone-800'}`}>
        {valeur}
      </div>
      {sousTitre && <div className="text-xs text-stone-400">{sousTitre}</div>}
    </div>
  );
}

function LigneVin({ ligne, droite }: { ligne: LigneInventaire; droite: string }) {
  return (
    <Link to={`/vin/${ligne.vin.id}`} className="flex items-center justify-between gap-3">
      <div className="min-w-0">
        <div className="truncate font-medium text-stone-800">{ligne.vin.nom}</div>
        <div className="truncate text-xs text-stone-500">
          {[ligne.vin.millesime, ligne.vin.region].filter(Boolean).join(' · ')}
        </div>
      </div>
      <span className="shrink-0 text-sm font-medium text-stone-600">{droite}</span>
    </Link>
  );
}
