import { useRef, useState } from 'react';

// La Web Speech API n'est pas typée dans la lib DOM standard — déclarations minimales.
interface SpeechRecognitionLike {
  lang: string;
  interimResults: boolean;
  continuous: boolean;
  onresult: ((e: { results: ArrayLike<ArrayLike<{ transcript: string }>> }) => void) | null;
  onend: (() => void) | null;
  onerror: (() => void) | null;
  start: () => void;
  stop: () => void;
}

function getRecognitionCtor(): (new () => SpeechRecognitionLike) | null {
  const w = window as unknown as {
    SpeechRecognition?: new () => SpeechRecognitionLike;
    webkitSpeechRecognition?: new () => SpeechRecognitionLike;
  };
  return w.SpeechRecognition ?? w.webkitSpeechRecognition ?? null;
}

interface Props {
  /** Reçoit le texte dicté à ajouter au champ. */
  onTexte: (texte: string) => void;
}

/** Bouton de dictée vocale (français). Ne s'affiche pas si le navigateur ne le supporte pas. */
export default function VoiceButton({ onTexte }: Props) {
  const [ecoute, setEcoute] = useState(false);
  const recRef = useRef<SpeechRecognitionLike | null>(null);
  const Ctor = getRecognitionCtor();
  if (!Ctor) return null;

  const basculer = () => {
    if (ecoute) {
      recRef.current?.stop();
      return;
    }
    const rec = new Ctor();
    rec.lang = 'fr-FR';
    rec.interimResults = false;
    rec.continuous = false;
    rec.onresult = (e) => {
      let texte = '';
      for (let i = 0; i < e.results.length; i++) {
        texte += e.results[i][0].transcript;
      }
      if (texte) onTexte(texte.trim());
    };
    rec.onend = () => setEcoute(false);
    rec.onerror = () => setEcoute(false);
    recRef.current = rec;
    rec.start();
    setEcoute(true);
  };

  return (
    <button
      type="button"
      onClick={basculer}
      aria-label="Dictée vocale"
      title="Dictée vocale"
      className={`min-h-touch min-w-touch shrink-0 rounded-xl border px-3 ${
        ecoute
          ? 'animate-pulse border-wine-500 bg-wine-100 text-wine-700'
          : 'border-stone-300 bg-white text-stone-500'
      }`}
    >
      🎤
    </button>
  );
}
