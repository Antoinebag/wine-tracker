import { useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../db/db';
import type { Bouteille } from '../db/types';
import StarRating from '../components/StarRating';
import StockControls from '../components/StockControls';
import Modal from '../components/Modal';
import LotFields, {
  lotDraftVide,
  lotDepuisBouteille,
  lotVersBouteille,
  type LotDraft,
} from '../components/LotFields';
import VoiceButton from '../components/VoiceButton';
import {
  ajusterQuantite,
  boireUne,
  creerBouteille,
  majBouteille,
  supprimerBouteille,
} from '../repositories/bouteilles';
import { supprimerVin } from '../repositories/vins';
import { annulerConsommation, listerConsommationsParVin } from '../repositories/consommations';
import { formatPrix, formatDate, couleurEmoji, pluriel } from '../lib/format';
import { urgenceLabel } from '../lib/garde';
import { urlDePhoto } from '../lib/photos';

export default function FicheVin() {
  const { id = '' } = useParams();
  const navigate = useNavigate();

  const vin = useLiveQuery(() => db.vins.get(id), [id]);
  const lots = useLiveQuery(
    () => db.bouteilles.where('vinId').equals(id).toArray(),
    [id],
  );
  const consommations = useLiveQuery(() => listerConsommationsParVin(id), [id]);
  const photo = useLiveQuery(() => db.photos.get(id), [id]);

  const [lotEnEdition, setLotEnEdition] = useState<{ draft: LotDraft; id?: string } | null>(null);
  const [boire, setBoire] = useState<{ lot: Bouteille; note: string; occasion: string } | null>(
    null,
  );

  if (vin === undefined || lots === undefined) {
    return <p className="py-10 text-center text-stone-500">Chargement…</p>;
  }
  if (vin === null) {
    return (
      <div className="py-10 text-center">
        <p className="text-stone-500">Ce vin n’existe pas (ou plus).</p>
        <Link to="/cave" className="btn-secondary mt-4">
          Retour à la cave
        </Link>
      </div>
    );
  }

  const quantiteTotale = lots.reduce((s, l) => s + l.quantite, 0);
  const lotsAvecPrix = lots.filter((l) => l.prixAchat != null);
  const prixRepere = lotsAvecPrix.length ? lotsAvecPrix[lotsAvecPrix.length - 1].prixAchat : undefined;
  const sources = [
    ...new Set(lots.map((l) => l.sourceAchat).filter((s): s is string => !!s)),
  ];
  const photoUrl = urlDePhoto(photo?.blob);

  const sauverLot = async () => {
    if (!lotEnEdition) return;
    const data = lotVersBouteille(lotEnEdition.draft);
    if (lotEnEdition.id) {
      await majBouteille(lotEnEdition.id, data);
    } else {
      await creerBouteille({ vinId: id, ...data });
    }
    setLotEnEdition(null);
  };

  const validerBoire = async () => {
    if (!boire) return;
    await boireUne(boire.lot, {
      noteDuJour: boire.note.trim() || undefined,
      occasion: boire.occasion.trim() || undefined,
    });
    setBoire(null);
  };

  const supprimerCeVin = async () => {
    if (confirm(`Supprimer « ${vin.nom} » et tout son historique ? Cette action est définitive.`)) {
      await supprimerVin(id);
      navigate('/cave');
    }
  };

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <button type="button" className="btn-ghost px-2" onClick={() => navigate(-1)}>
          ← Retour
        </button>
        <Link to={`/vin/${id}/edit`} className="btn-secondary px-3">
          ✎ Modifier
        </Link>
      </div>

      {/* En-tête */}
      <header className="flex gap-4">
        {photoUrl ? (
          <img
            src={photoUrl}
            alt={`Étiquette ${vin.nom}`}
            className="h-28 w-28 shrink-0 rounded-2xl border border-stone-200 object-cover"
          />
        ) : (
          <div className="flex h-28 w-28 shrink-0 items-center justify-center rounded-2xl bg-wine-50 text-5xl">
            {couleurEmoji(vin.couleur)}
          </div>
        )}
        <div className="min-w-0 flex-1">
          <h1 className="text-xl font-bold leading-tight text-stone-900">{vin.nom}</h1>
          {vin.domaine && <p className="text-stone-600">{vin.domaine}</p>}
          <p className="text-sm text-stone-500">
            {[vin.couleur, vin.millesime, vin.region].filter(Boolean).join(' · ')}
          </p>
          {vin.notePerso ? (
            <div className="mt-1">
              <StarRating value={vin.notePerso} size="sm" />
            </div>
          ) : null}
        </div>
      </header>

      {/* PRIX + NOTES en avant (priorité de la fiche) */}
      <div className="grid grid-cols-2 gap-3">
        <div className="card p-4">
          <div className="text-xs uppercase tracking-wide text-stone-500">Prix payé</div>
          <div className="text-2xl font-bold text-wine-700">{formatPrix(prixRepere)}</div>
        </div>
        <div className="card p-4">
          <div className="text-xs uppercase tracking-wide text-stone-500">En stock</div>
          <div className="text-2xl font-bold text-stone-800">
            {quantiteTotale > 0 ? quantiteTotale : 'épuisé'}
          </div>
        </div>
      </div>

      <div className="card p-4">
        <div className="mb-1 text-xs uppercase tracking-wide text-stone-500">
          Notes de dégustation
        </div>
        {vin.notesDegustation ? (
          <p className="whitespace-pre-wrap text-stone-800">{vin.notesDegustation}</p>
        ) : (
          <Link to={`/vin/${id}/edit`} className="text-sm text-wine-600">
            + Ajouter mes notes
          </Link>
        )}
      </div>

      {/* Lots / stock */}
      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-stone-500">
            Stock & achats
          </h2>
          <button
            type="button"
            className="text-sm font-medium text-wine-600"
            onClick={() => setLotEnEdition({ draft: lotDraftVide() })}
          >
            + Ajouter un lot
          </button>
        </div>

        {lots.length === 0 && (
          <p className="card p-4 text-sm text-stone-500">
            Aucun lot enregistré. Ajoutez-en un pour suivre le stock et le prix.
          </p>
        )}

        {lots.map((lot) => {
          const urgence = urgenceLabel(lot);
          return (
            <div key={lot.id} className="card space-y-3 p-4">
              <div className="flex items-start justify-between">
                <div>
                  <div className="font-medium text-stone-800">{lot.format}</div>
                  <div className="text-sm text-stone-500">
                    {lot.prixAchat != null ? formatPrix(lot.prixAchat) : 'prix non renseigné'}
                    {lot.dateAchat ? ` · acheté le ${formatDate(lot.dateAchat)}` : ''}
                  </div>
                  {lot.sourceAchat && (
                    <div className="text-sm text-stone-500">📍 {lot.sourceAchat}</div>
                  )}
                  {lot.emplacement && (
                    <div className="text-sm text-stone-500">🗄️ {lot.emplacement}</div>
                  )}
                  {(lot.aBoireAPartirDe || lot.aBoireAvant) && (
                    <div className="text-sm text-stone-500">
                      🍷 {lot.aBoireAPartirDe ? `dès ${formatDate(lot.aBoireAPartirDe)}` : ''}
                      {lot.aBoireAPartirDe && lot.aBoireAvant ? ' · ' : ''}
                      {lot.aBoireAvant ? `avant ${formatDate(lot.aBoireAvant)}` : ''}
                    </div>
                  )}
                  {urgence && (
                    <span className="mt-1 inline-block rounded-full bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-800">
                      ⏳ {urgence}
                    </span>
                  )}
                </div>
                <div className="flex flex-col items-end gap-1">
                  <button
                    type="button"
                    className="text-sm text-stone-400"
                    onClick={() =>
                      setLotEnEdition({ id: lot.id, draft: lotDepuisBouteille(lot) })
                    }
                  >
                    ✎
                  </button>
                  <button
                    type="button"
                    className="text-sm text-stone-400"
                    onClick={async () => {
                      if (confirm('Supprimer ce lot ?')) await supprimerBouteille(lot.id);
                    }}
                  >
                    🗑️
                  </button>
                </div>
              </div>

              <StockControls
                quantite={lot.quantite}
                onPlus={() => ajusterQuantite(lot.id, +1)}
                onMoins={() => ajusterQuantite(lot.id, -1)}
                onBoire={() => setBoire({ lot, note: '', occasion: '' })}
              />
            </div>
          );
        })}
      </section>

      {/* Détails du vin */}
      <DetailsVin vin={vin} />

      {/* Historique de consommation */}
      {consommations && consommations.length > 0 && (
        <section className="space-y-2">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-stone-500">
            Historique ({pluriel(consommations.length, 'bouteille bue', 'bouteilles bues')})
          </h2>
          {consommations.map((c) => (
            <div key={c.id} className="card flex items-start justify-between p-3">
              <div className="min-w-0">
                <div className="text-sm font-medium text-stone-700">{formatDate(c.date)}</div>
                {c.occasion && <div className="text-sm text-stone-500">{c.occasion}</div>}
                {c.noteDuJour && (
                  <div className="mt-0.5 whitespace-pre-wrap text-sm text-stone-600">
                    {c.noteDuJour}
                  </div>
                )}
              </div>
              <button
                type="button"
                className="shrink-0 text-xs text-stone-400"
                onClick={async () => {
                  if (confirm('Annuler cette consommation et remettre la bouteille en stock ?'))
                    await annulerConsommation(c.id);
                }}
              >
                annuler
              </button>
            </div>
          ))}
        </section>
      )}

      <button type="button" className="btn-ghost w-full text-red-600" onClick={supprimerCeVin}>
        Supprimer ce vin
      </button>

      {/* Modal lot */}
      <Modal
        titre={lotEnEdition?.id ? 'Modifier le lot' : 'Ajouter un lot'}
        ouvert={!!lotEnEdition}
        onClose={() => setLotEnEdition(null)}
      >
        {lotEnEdition && (
          <div className="space-y-4">
            <LotFields
              value={lotEnEdition.draft}
              sources={sources}
              onChange={(patch) =>
                setLotEnEdition((etat) =>
                  etat ? { ...etat, draft: { ...etat.draft, ...patch } } : etat,
                )
              }
            />
            <button type="button" className="btn-primary w-full" onClick={sauverLot}>
              Enregistrer
            </button>
          </div>
        )}
      </Modal>

      {/* Modal « j'en bois une » */}
      <Modal titre="J’en bois une 🍷" ouvert={!!boire} onClose={() => setBoire(null)}>
        {boire && (
          <div className="space-y-4">
            <p className="text-sm text-stone-600">
              Une bouteille va être retirée du stock. Vous pouvez noter l’instant (facultatif).
            </p>
            <div>
              <label className="field-label">Occasion</label>
              <input
                className="field-input"
                placeholder="ex. dîner entre amis"
                value={boire.occasion}
                onChange={(e) => setBoire({ ...boire, occasion: e.target.value })}
              />
            </div>
            <div>
              <label className="field-label">Note du jour</label>
              <div className="flex gap-2">
                <textarea
                  className="field-input min-h-[80px] flex-1"
                  placeholder="Comment était-il ?"
                  value={boire.note}
                  onChange={(e) => setBoire({ ...boire, note: e.target.value })}
                />
                <VoiceButton
                  onTexte={(t) =>
                    setBoire((b) => (b ? { ...b, note: (b.note ? b.note + ' ' : '') + t } : b))
                  }
                />
              </div>
            </div>
            <button type="button" className="btn-primary w-full" onClick={validerBoire}>
              C’est bu !
            </button>
          </div>
        )}
      </Modal>
    </div>
  );
}

function DetailsVin({ vin }: { vin: import('../db/types').Vin }) {
  const lignes: [string, string][] = [];
  if (vin.appellation) lignes.push(['Appellation', vin.appellation]);
  if (vin.cepages?.length) lignes.push(['Cépages', vin.cepages.join(', ')]);
  if (vin.degre != null) lignes.push(['Degré', `${vin.degre}°`]);
  if (vin.accordsMets) lignes.push(['Accords mets', vin.accordsMets]);

  if (!lignes.length && !vin.tags?.length) return null;

  return (
    <section className="card space-y-2 p-4">
      <h2 className="text-sm font-semibold uppercase tracking-wide text-stone-500">Détails</h2>
      {lignes.map(([k, v]) => (
        <div key={k} className="flex justify-between gap-4 text-sm">
          <span className="text-stone-500">{k}</span>
          <span className="text-right text-stone-800">{v}</span>
        </div>
      ))}
      {vin.tags?.length ? (
        <div className="flex flex-wrap gap-2 pt-1">
          {vin.tags.map((t) => (
            <span key={t} className="chip">
              {t}
            </span>
          ))}
        </div>
      ) : null}
    </section>
  );
}
