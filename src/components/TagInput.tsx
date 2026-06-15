import { useState } from 'react';

interface Props {
  values: string[];
  onChange: (values: string[]) => void;
  suggestions?: string[];
  placeholder?: string;
}

/** Saisie multi-valeurs (tags, cépages…) sous forme de puces. */
export default function TagInput({ values, onChange, suggestions = [], placeholder }: Props) {
  const [saisie, setSaisie] = useState('');
  const listId = `sugg-${Math.random().toString(36).slice(2, 8)}`;

  const ajouter = (valeur: string) => {
    const v = valeur.trim();
    if (v && !values.includes(v)) onChange([...values, v]);
    setSaisie('');
  };

  const retirer = (v: string) => onChange(values.filter((x) => x !== v));

  const suggestionsFiltrees = suggestions.filter((s) => !values.includes(s));

  return (
    <div>
      {values.length > 0 && (
        <div className="mb-2 flex flex-wrap gap-2">
          {values.map((v) => (
            <span key={v} className="chip gap-1">
              {v}
              <button
                type="button"
                aria-label={`Retirer ${v}`}
                className="ml-1 text-wine-500"
                onClick={() => retirer(v)}
              >
                ✕
              </button>
            </span>
          ))}
        </div>
      )}
      <input
        className="field-input"
        list={listId}
        value={saisie}
        placeholder={placeholder}
        onChange={(e) => setSaisie(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ',') {
            e.preventDefault();
            ajouter(saisie);
          }
        }}
        onBlur={() => ajouter(saisie)}
      />
      <datalist id={listId}>
        {suggestionsFiltrees.map((s) => (
          <option key={s} value={s} />
        ))}
      </datalist>
    </div>
  );
}
