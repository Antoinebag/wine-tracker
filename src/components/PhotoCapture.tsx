import { useRef, useState } from 'react';
import { preparerPhoto, urlDePhoto } from '../lib/photos';

interface Props {
  /** Aperçu existant (miniature) si une photo est déjà enregistrée. */
  thumb?: Blob;
  /** Appelée avec l'image préparée (pleine + miniature) après capture. */
  onPhoto: (photo: { blob: Blob; thumb: Blob }) => void;
  onSupprimer?: () => void;
}

export default function PhotoCapture({ thumb, onPhoto, onSupprimer }: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [apercu, setApercu] = useState<string | undefined>(urlDePhoto(thumb));
  const [chargement, setChargement] = useState(false);

  const choisir = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    setChargement(true);
    try {
      const prep = await preparerPhoto(file);
      setApercu(urlDePhoto(prep.thumb));
      onPhoto(prep);
    } finally {
      setChargement(false);
    }
  };

  return (
    <div>
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        capture="environment"
        className="hidden"
        onChange={choisir}
      />
      {apercu ? (
        <div className="relative inline-block">
          <img
            src={apercu}
            alt="Étiquette"
            className="h-40 w-40 rounded-2xl border border-stone-200 object-cover"
            onClick={() => inputRef.current?.click()}
          />
          <button
            type="button"
            aria-label="Supprimer la photo"
            className="absolute -right-2 -top-2 flex h-9 w-9 items-center justify-center rounded-full bg-white text-stone-600 shadow"
            onClick={() => {
              setApercu(undefined);
              onSupprimer?.();
            }}
          >
            ✕
          </button>
        </div>
      ) : (
        <button
          type="button"
          className="btn-secondary w-full"
          onClick={() => inputRef.current?.click()}
          disabled={chargement}
        >
          {chargement ? 'Traitement…' : '📷 Photo de l’étiquette'}
        </button>
      )}
    </div>
  );
}
