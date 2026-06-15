interface Props {
  quantite: number;
  onPlus: () => void;
  onMoins: () => void;
  onBoire: () => void;
}

export default function StockControls({ quantite, onPlus, onMoins, onBoire }: Props) {
  const epuise = quantite <= 0;
  return (
    <div className="flex items-center gap-2">
      <div className="flex items-center overflow-hidden rounded-xl border border-stone-300 bg-white">
        <button
          type="button"
          aria-label="Retirer une bouteille"
          className="flex h-12 w-12 items-center justify-center text-2xl text-wine-700 active:bg-wine-50 disabled:opacity-30"
          onClick={onMoins}
          disabled={epuise}
        >
          −
        </button>
        <span className="w-10 text-center text-lg font-semibold tabular-nums">{quantite}</span>
        <button
          type="button"
          aria-label="Ajouter une bouteille"
          className="flex h-12 w-12 items-center justify-center text-2xl text-wine-700 active:bg-wine-50"
          onClick={onPlus}
        >
          +
        </button>
      </div>
      <button type="button" className="btn-primary flex-1" onClick={onBoire} disabled={epuise}>
        🍷 J’en bois une
      </button>
    </div>
  );
}
