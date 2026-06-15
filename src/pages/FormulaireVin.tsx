import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../db/db';
import { COULEURS } from '../db/types';
import type { Couleur } from '../db/types';
import Collapsible from '../components/Collapsible';
import PhotoCapture from '../components/PhotoCapture';
import StarRating from '../components/StarRating';
import TagInput from '../components/TagInput';
import VoiceButton from '../components/VoiceButton';
import LotFields, { lotDraftVide, lotVersBouteille, type LotDraft } from '../components/LotFields';
import { creerVin, majVin, setPhoto, supprimerPhoto, getVin } from '../repositories/vins';
import { creerBouteille } from '../repositories/bouteilles';

interface VinDraft {
  nom: string;
  domaine: string;
  couleur: string;
  millesime: string;
  region: string;
  appellation: string;
  cepages: string[];
  degre: string;
  notePerso: number;
  notesDegustation: string;
  accordsMets: string;
  tags: string[];
}

function draftVide(): VinDraft {
  return {
    nom: '',
    domaine: '',
    couleur: '',
    millesime: '',
    region: '',
    appellation: '',
    cepages: [],
    degre: '',
    notePerso: 0,
    notesDegustation: '',
    accordsMets: '',
    tags: [],
  };
}

function nombre(v: string): number | undefined {
  const n = Number(v.replace(',', '.'));
  return v.trim() === '' || Number.isNaN(n) ? undefined : n;
}

export default function FormulaireVin() {
  const { id } = useParams();
  const edition = !!id;
  const navigate = useNavigate();

  const [draft, setDraft] = useState<VinDraft>(draftVide());
  const [lot, setLot] = useState<LotDraft>(lotDraftVide());
  const [photoPending, setPhotoPending] = useState<{ blob: Blob; thumb: Blob } | null>(null);
  const [photoSupprimee, setPhotoSupprimee] = useState(false);
  const [pret, setPret] = useState(!edition);
  const [enregistrement, setEnregistrement] = useState(false);

  // Suggestions d'autocomplétion issues des données existantes.
  const suggestions = useLiveQuery(async () => {
    const [vins, bouteilles] = await Promise.all([db.vins.toArray(), db.bouteilles.toArray()]);
    return {
      regions: uniques(vins.map((v) => v.region)),
      domaines: uniques(vins.map((v) => v.domaine)),
      appellations: uniques(vins.map((v) => v.appellation)),
      cepages: uniques(vins.flatMap((v) => v.cepages ?? [])),
      tags: uniques(vins.flatMap((v) => v.tags ?? [])),
      sources: uniques(bouteilles.map((b) => b.sourceAchat)),
    };
  }, []);

  const thumbExistante = useLiveQuery(
    () => (edition && id ? db.thumbs.get(id) : undefined),
    [edition, id],
  );

  // Charge le vin en mode édition (une seule fois).
  useEffect(() => {
    if (!edition || !id) return;
    let actif = true;
    getVin(id).then((v) => {
      if (!actif || !v) return;
      setDraft({
        nom: v.nom,
        domaine: v.domaine ?? '',
        couleur: v.couleur ?? '',
        millesime: v.millesime != null ? String(v.millesime) : '',
        region: v.region ?? '',
        appellation: v.appellation ?? '',
        cepages: v.cepages ?? [],
        degre: v.degre != null ? String(v.degre) : '',
        notePerso: v.notePerso ?? 0,
        notesDegustation: v.notesDegustation ?? '',
        accordsMets: v.accordsMets ?? '',
        tags: v.tags ?? [],
      });
      setPret(true);
    });
    return () => {
      actif = false;
    };
  }, [edition, id]);

  const maj = (patch: Partial<VinDraft>) => setDraft((d) => ({ ...d, ...patch }));

  const champsVin = useMemo(
    () => ({
      nom: draft.nom.trim(),
      domaine: draft.domaine.trim() || undefined,
      couleur: (draft.couleur as Couleur) || undefined,
      millesime: nombre(draft.millesime),
      region: draft.region.trim() || undefined,
      appellation: draft.appellation.trim() || undefined,
      cepages: draft.cepages.length ? draft.cepages : undefined,
      degre: nombre(draft.degre),
      notePerso: draft.notePerso || undefined,
      notesDegustation: draft.notesDegustation.trim() || undefined,
      accordsMets: draft.accordsMets.trim() || undefined,
      tags: draft.tags.length ? draft.tags : undefined,
    }),
    [draft],
  );

  const enregistrer = async () => {
    if (!champsVin.nom) return;
    setEnregistrement(true);
    try {
      let vinId: string;
      if (edition && id) {
        await majVin(id, champsVin);
        vinId = id;
      } else {
        vinId = await creerVin(champsVin);
        // En création, on enregistre aussi le lot initial (achat/stock).
        await creerBouteille({ vinId, ...lotVersBouteille(lot) });
      }
      if (photoPending) await setPhoto(vinId, photoPending.blob, photoPending.thumb);
      else if (photoSupprimee) await supprimerPhoto(vinId);
      navigate(`/vin/${vinId}`, { replace: true });
    } finally {
      setEnregistrement(false);
    }
  };

  if (!pret) return <p className="py-10 text-center text-stone-500">Chargement…</p>;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <button type="button" className="btn-ghost px-2" onClick={() => navigate(-1)}>
          ← Annuler
        </button>
        <h1 className="text-lg font-semibold text-wine-800">
          {edition ? 'Modifier le vin' : 'Nouveau vin'}
        </h1>
        <span className="w-16" />
      </div>

      {/* Champ requis : le nom */}
      <div>
        <label className="field-label">Nom du vin *</label>
        <input
          className="field-input"
          autoFocus={!edition}
          placeholder="ex. Châteauneuf-du-Pape"
          value={draft.nom}
          onChange={(e) => maj({ nom: e.target.value })}
        />
      </div>

      {/* Couleur en accès rapide */}
      <div className="flex flex-wrap gap-2">
        {COULEURS.map((c) => (
          <button
            key={c}
            type="button"
            onClick={() => maj({ couleur: draft.couleur === c ? '' : c })}
            className={`min-h-touch rounded-full border px-3 text-sm capitalize ${
              draft.couleur === c
                ? 'border-wine-600 bg-wine-700 text-white'
                : 'border-stone-300 bg-white text-stone-600'
            }`}
          >
            {c}
          </button>
        ))}
      </div>

      <PhotoCapture
        thumb={photoSupprimee ? undefined : thumbExistante?.blob}
        onPhoto={(p) => {
          setPhotoPending(p);
          setPhotoSupprimee(false);
        }}
        onSupprimer={() => {
          setPhotoPending(null);
          setPhotoSupprimee(true);
        }}
      />

      {/* Détails repliés (tout optionnel) */}
      <Collapsible titre="Ajouter des détails">
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="field-label">Domaine</label>
            <input
              className="field-input"
              list="sugg-domaines"
              value={draft.domaine}
              onChange={(e) => maj({ domaine: e.target.value })}
            />
            <datalist id="sugg-domaines">
              {suggestions?.domaines.map((d) => <option key={d} value={d} />)}
            </datalist>
          </div>
          <div>
            <label className="field-label">Millésime</label>
            <input
              type="number"
              inputMode="numeric"
              className="field-input"
              placeholder="ex. 2018"
              value={draft.millesime}
              onChange={(e) => maj({ millesime: e.target.value })}
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="field-label">Région</label>
            <input
              className="field-input"
              list="sugg-regions"
              value={draft.region}
              onChange={(e) => maj({ region: e.target.value })}
            />
            <datalist id="sugg-regions">
              {suggestions?.regions.map((r) => <option key={r} value={r} />)}
            </datalist>
          </div>
          <div>
            <label className="field-label">Appellation</label>
            <input
              className="field-input"
              list="sugg-appellations"
              value={draft.appellation}
              onChange={(e) => maj({ appellation: e.target.value })}
            />
            <datalist id="sugg-appellations">
              {suggestions?.appellations.map((a) => <option key={a} value={a} />)}
            </datalist>
          </div>
        </div>

        <div>
          <label className="field-label">Cépages</label>
          <TagInput
            values={draft.cepages}
            onChange={(cepages) => maj({ cepages })}
            suggestions={suggestions?.cepages}
            placeholder="Ajouter un cépage…"
          />
        </div>

        <div className="grid grid-cols-2 items-end gap-3">
          <div>
            <label className="field-label">Degré (°)</label>
            <input
              type="number"
              inputMode="decimal"
              step="0.1"
              className="field-input"
              placeholder="ex. 13,5"
              value={draft.degre}
              onChange={(e) => maj({ degre: e.target.value })}
            />
          </div>
          <div>
            <label className="field-label">Ma note</label>
            <StarRating value={draft.notePerso} onChange={(notePerso) => maj({ notePerso })} />
          </div>
        </div>

        <div>
          <label className="field-label">Notes de dégustation</label>
          <div className="flex gap-2">
            <textarea
              className="field-input min-h-[90px] flex-1"
              placeholder="Ce que j'ai goûté, ressenti…"
              value={draft.notesDegustation}
              onChange={(e) => maj({ notesDegustation: e.target.value })}
            />
            <VoiceButton
              onTexte={(t) =>
                maj({
                  notesDegustation:
                    (draft.notesDegustation ? draft.notesDegustation + ' ' : '') + t,
                })
              }
            />
          </div>
        </div>

        <div>
          <label className="field-label">Accords mets</label>
          <input
            className="field-input"
            placeholder="Avec quoi le boire"
            value={draft.accordsMets}
            onChange={(e) => maj({ accordsMets: e.target.value })}
          />
        </div>

        <div>
          <label className="field-label">Tags</label>
          <TagInput
            values={draft.tags}
            onChange={(tags) => maj({ tags })}
            suggestions={suggestions?.tags}
            placeholder="apéro, cadeau, coup de cœur…"
          />
        </div>
      </Collapsible>

      {/* Achat & stock — uniquement en création (sinon géré depuis la fiche) */}
      {!edition && (
        <Collapsible titre="Achat & stock" defautOuvert>
          <LotFields value={lot} onChange={(p) => setLot((l) => ({ ...l, ...p }))} sources={suggestions?.sources} />
        </Collapsible>
      )}

      <button
        type="button"
        className="btn-primary w-full"
        onClick={enregistrer}
        disabled={!champsVin.nom || enregistrement}
      >
        {enregistrement ? 'Enregistrement…' : edition ? 'Enregistrer' : 'Ajouter à ma cave'}
      </button>
    </div>
  );
}

function uniques(valeurs: (string | undefined)[]): string[] {
  return [...new Set(valeurs.filter((v): v is string => !!v))].sort((a, b) =>
    a.localeCompare(b, 'fr'),
  );
}
