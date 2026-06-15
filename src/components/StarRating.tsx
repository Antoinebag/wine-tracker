interface Props {
  value?: number;
  onChange?: (value: number) => void;
  size?: 'sm' | 'md' | 'lg';
}

const TAILLES = { sm: 'text-base', md: 'text-2xl', lg: 'text-3xl' };

export default function StarRating({ value = 0, onChange, size = 'md' }: Props) {
  const lecture = !onChange;
  return (
    <div className={`flex ${TAILLES[size]}`} role={lecture ? 'img' : 'radiogroup'} aria-label={`Note ${value} sur 5`}>
      {[1, 2, 3, 4, 5].map((n) => {
        const plein = n <= value;
        if (lecture) {
          return (
            <span key={n} className={plein ? 'text-amber-500' : 'text-stone-300'}>
              ★
            </span>
          );
        }
        return (
          <button
            key={n}
            type="button"
            aria-label={`${n} étoile${n > 1 ? 's' : ''}`}
            className={`min-h-touch min-w-touch px-0.5 ${plein ? 'text-amber-500' : 'text-stone-300'} active:scale-90`}
            onClick={() => onChange?.(n === value ? 0 : n)}
          >
            ★
          </button>
        );
      })}
    </div>
  );
}
