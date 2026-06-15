import { FORMATS, GARDE_TYPES, FORMAT_DEFAUT } from '../db/types';
import type { Bouteille, Format, GardeType } from '../db/types';
import { aujourdHuiIso } from '../db/db';

/** État de formulaire d'un lot (valeurs en chaînes pour les inputs). */
export interface LotDraft {
  quantite: string;
  format: string;
  prixAchat: string;
  dateAchat: string;
  sourceAchat: string;
  emplacement: string;
  gardeType: string;
  aBoireAPartirDe: string;
  aBoireAvant: string;
}

export function lotDraftVide(): LotDraft {
  return {
    quantite: '1',
    format: FORMAT_DEFAUT,
    prixAchat: '',
    dateAchat: aujourdHuiIso(),
    sourceAchat: '',
    emplacement: '',
    gardeType: '',
    aBoireAPartirDe: '',
    aBoireAvant: '',
  };
}

export function lotDepuisBouteille(b: Bouteille): LotDraft {
  return {
    quantite: String(b.quantite),
    format: b.format ?? FORMAT_DEFAUT,
    prixAchat: b.prixAchat != null ? String(b.prixAchat) : '',
    dateAchat: b.dateAchat ?? aujourdHuiIso(),
    sourceAchat: b.sourceAchat ?? '',
    emplacement: b.emplacement ?? '',
    gardeType: b.gardeType ?? '',
    aBoireAPartirDe: b.aBoireAPartirDe ?? '',
    aBoireAvant: b.aBoireAvant ?? '',
  };
}

function nombre(v: string): number | undefined {
  const n = Number(v.replace(',', '.'));
  return v.trim() === '' || Number.isNaN(n) ? undefined : n;
}

export function lotVersBouteille(d: LotDraft): Omit<Bouteille, 'id' | 'vinId'> {
  return {
    quantite: Math.max(0, Math.round(nombre(d.quantite) ?? 1)),
    format: (d.format as Format) || FORMAT_DEFAUT,
    prixAchat: nombre(d.prixAchat),
    dateAchat: d.dateAchat || undefined,
    sourceAchat: d.sourceAchat.trim() || undefined,
    emplacement: d.emplacement.trim() || undefined,
    gardeType: (d.gardeType as GardeType) || undefined,
    aBoireAPartirDe: d.aBoireAPartirDe || undefined,
    aBoireAvant: d.aBoireAvant || undefined,
  };
}

interface Props {
  value: LotDraft;
  onChange: (patch: Partial<LotDraft>) => void;
  sources?: string[];
  /** Affiche le champ quantité (masqué lors de l'édition d'un lot dont la qté est gérée ailleurs). */
  avecQuantite?: boolean;
}

export default function LotFields({ value, onChange, sources = [], avecQuantite = true }: Props) {
  return (
    <div className="space-y-4">
      {avecQuantite && (
        <div>
          <label className="field-label">Quantité</label>
          <input
            type="number"
            inputMode="numeric"
            min={0}
            className="field-input"
            value={value.quantite}
            onChange={(e) => onChange({ quantite: e.target.value })}
          />
        </div>
      )}

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="field-label">Format</label>
          <select
            className="field-input"
            value={value.format}
            onChange={(e) => onChange({ format: e.target.value })}
          >
            {FORMATS.map((f) => (
              <option key={f} value={f}>
                {f}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="field-label">Prix unitaire (€)</label>
          <input
            type="number"
            inputMode="decimal"
            min={0}
            step="0.01"
            className="field-input"
            placeholder="ex. 12,50"
            value={value.prixAchat}
            onChange={(e) => onChange({ prixAchat: e.target.value })}
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="field-label">Date d’achat</label>
          <input
            type="date"
            className="field-input"
            value={value.dateAchat}
            onChange={(e) => onChange({ dateAchat: e.target.value })}
          />
        </div>
        <div>
          <label className="field-label">Emplacement</label>
          <input
            className="field-input"
            placeholder="ex. casier B3"
            value={value.emplacement}
            onChange={(e) => onChange({ emplacement: e.target.value })}
          />
        </div>
      </div>

      <div>
        <label className="field-label">Où acheté</label>
        <input
          className="field-input"
          list="sources-achat"
          placeholder="caviste, domaine, foire…"
          value={value.sourceAchat}
          onChange={(e) => onChange({ sourceAchat: e.target.value })}
        />
        <datalist id="sources-achat">
          {sources.map((s) => (
            <option key={s} value={s} />
          ))}
        </datalist>
      </div>

      <div>
        <label className="field-label">Garde</label>
        <select
          className="field-input"
          value={value.gardeType}
          onChange={(e) => onChange({ gardeType: e.target.value })}
        >
          <option value="">Non précisé</option>
          {GARDE_TYPES.map((g) => (
            <option key={g} value={g}>
              {g}
            </option>
          ))}
        </select>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="field-label">À boire à partir de</label>
          <input
            type="date"
            className="field-input"
            value={value.aBoireAPartirDe}
            onChange={(e) => onChange({ aBoireAPartirDe: e.target.value })}
          />
        </div>
        <div>
          <label className="field-label">À boire avant</label>
          <input
            type="date"
            className="field-input"
            value={value.aBoireAvant}
            onChange={(e) => onChange({ aBoireAvant: e.target.value })}
          />
        </div>
      </div>
    </div>
  );
}
