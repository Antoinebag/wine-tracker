import { useState, type ReactNode } from 'react';

interface Props {
  titre: string;
  defautOuvert?: boolean;
  children: ReactNode;
}

export default function Collapsible({ titre, defautOuvert = false, children }: Props) {
  const [ouvert, setOuvert] = useState(defautOuvert);
  return (
    <div className="card overflow-hidden">
      <button
        type="button"
        className="flex min-h-touch w-full items-center justify-between px-4 py-3 text-left font-medium text-wine-800"
        onClick={() => setOuvert((o) => !o)}
        aria-expanded={ouvert}
      >
        <span>{titre}</span>
        <span className={`transition-transform ${ouvert ? 'rotate-180' : ''}`}>▾</span>
      </button>
      {ouvert && <div className="space-y-4 border-t border-stone-100 px-4 py-4">{children}</div>}
    </div>
  );
}
