import { type ReactNode, useEffect } from 'react';

interface Props {
  titre: string;
  ouvert: boolean;
  onClose: () => void;
  children: ReactNode;
}

/** Feuille modale ancrée en bas de l'écran (ergonomie pouce). */
export default function Modal({ titre, ouvert, onClose, children }: Props) {
  useEffect(() => {
    if (!ouvert) return;
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [ouvert, onClose]);

  if (!ouvert) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 sm:items-center"
      onClick={onClose}
    >
      <div
        className="safe-bottom max-h-[90vh] w-full max-w-screen-sm overflow-y-auto rounded-t-3xl bg-cream p-4 sm:rounded-3xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-stone-900">{titre}</h2>
          <button
            type="button"
            aria-label="Fermer"
            className="min-h-touch min-w-touch text-2xl text-stone-400"
            onClick={onClose}
          >
            ✕
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}
