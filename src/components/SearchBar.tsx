interface Props {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}

export default function SearchBar({ value, onChange, placeholder }: Props) {
  return (
    <div className="relative">
      <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-stone-400">
        🔍
      </span>
      <input
        type="search"
        inputMode="search"
        className="field-input pl-10"
        value={value}
        placeholder={placeholder ?? 'Rechercher un vin…'}
        onChange={(e) => onChange(e.target.value)}
        aria-label="Rechercher"
      />
    </div>
  );
}
