import { useRef, useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../db/db';
import { useReglages, setReglages } from '../lib/preferences';
import {
  exporterJsonFichier,
  exporterCsvFichier,
  appliquerSauvegarde,
  importerCsv,
} from '../lib/backup';
import { pluriel } from '../lib/format';

export default function Reglages() {
  const { seuilMois } = useReglages();
  const jsonRef = useRef<HTMLInputElement>(null);
  const csvRef = useRef<HTMLInputElement>(null);
  const [remplacer, setRemplacer] = useState(false);
  const [message, setMessage] = useState<{ type: 'ok' | 'err'; texte: string } | null>(null);

  const stats = useLiveQuery(async () => ({
    vins: await db.vins.count(),
    bouteilles: await db.bouteilles.count(),
    photos: await db.photos.count(),
  }));

  const importerJson = async (file: File) => {
    try {
      const texte = await file.text();
      const data = JSON.parse(texte);
      await appliquerSauvegarde(data, { remplacer });
      setMessage({ type: 'ok', texte: 'Sauvegarde importée avec succès.' });
    } catch (e) {
      setMessage({ type: 'err', texte: `Import impossible : ${(e as Error).message}` });
    }
  };

  const importerCsvFichier = async (file: File) => {
    try {
      const texte = await file.text();
      const n = await importerCsv(texte);
      setMessage({ type: 'ok', texte: `${pluriel(n, 'vin')} importé(s) depuis le CSV.` });
    } catch (e) {
      setMessage({ type: 'err', texte: `Import CSV impossible : ${(e as Error).message}` });
    }
  };

  const toutEffacer = async () => {
    if (!confirm('Effacer TOUTES les données de la cave ? Cette action est irréversible.')) return;
    if (!confirm('Êtes-vous vraiment sûr ? Pensez à exporter d’abord.')) return;
    await db.transaction('rw', [db.vins, db.bouteilles, db.consommations, db.photos, db.thumbs], async () => {
      await Promise.all([
        db.vins.clear(),
        db.bouteilles.clear(),
        db.consommations.clear(),
        db.photos.clear(),
        db.thumbs.clear(),
      ]);
    });
    setMessage({ type: 'ok', texte: 'Toutes les données ont été effacées.' });
  };

  // Lien public de l'app (origine + chemin de base) — dynamique selon l'hébergement.
  const lienApp = window.location.origin + import.meta.env.BASE_URL;

  const copierLien = async () => {
    try {
      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(lienApp);
      } else {
        // Repli pour les navigateurs sans API Clipboard.
        const ta = document.createElement('textarea');
        ta.value = lienApp;
        ta.style.position = 'fixed';
        ta.style.opacity = '0';
        document.body.appendChild(ta);
        ta.select();
        document.execCommand('copy');
        ta.remove();
      }
      setMessage({ type: 'ok', texte: 'Lien de l’application copié dans le presse-papier !' });
    } catch {
      setMessage({ type: 'err', texte: `Copie impossible. Lien : ${lienApp}` });
    }
  };

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-wine-800">Réglages</h1>

      {message && (
        <div
          className={`rounded-xl p-3 text-sm ${
            message.type === 'ok'
              ? 'bg-green-100 text-green-800'
              : 'bg-red-100 text-red-800'
          }`}
        >
          {message.texte}
        </div>
      )}

      {/* Sauvegarde */}
      <section className="card space-y-3 p-4">
        <h2 className="font-semibold text-stone-800">Sauvegarde</h2>
        <p className="text-sm text-stone-500">
          Exportez régulièrement vers votre Drive ou iCloud : c’est votre seule protection contre la
          perte de données.
        </p>
        <div className="grid grid-cols-2 gap-2">
          <button type="button" className="btn-secondary" onClick={exporterJsonFichier}>
            ⬇ Export JSON
          </button>
          <button type="button" className="btn-secondary" onClick={exporterCsvFichier}>
            ⬇ Export CSV
          </button>
        </div>
      </section>

      {/* Restauration */}
      <section className="card space-y-3 p-4">
        <h2 className="font-semibold text-stone-800">Importer / restaurer</h2>
        <label className="flex items-center gap-2 text-sm text-stone-600">
          <input
            type="checkbox"
            className="h-5 w-5"
            checked={remplacer}
            onChange={(e) => setRemplacer(e.target.checked)}
          />
          Remplacer les données existantes (sinon fusion)
        </label>
        <div className="grid grid-cols-2 gap-2">
          <button type="button" className="btn-secondary" onClick={() => jsonRef.current?.click()}>
            ⬆ Import JSON
          </button>
          <button type="button" className="btn-secondary" onClick={() => csvRef.current?.click()}>
            ⬆ Import CSV
          </button>
        </div>
        <input
          ref={jsonRef}
          type="file"
          accept="application/json,.json"
          className="hidden"
          onChange={(e) => {
            const f = e.target.files?.[0];
            e.target.value = '';
            if (f) importerJson(f);
          }}
        />
        <input
          ref={csvRef}
          type="file"
          accept=".csv,text/csv"
          className="hidden"
          onChange={(e) => {
            const f = e.target.files?.[0];
            e.target.value = '';
            if (f) importerCsvFichier(f);
          }}
        />
        <p className="text-xs text-stone-400">
          L’import CSV crée un vin par ligne (colonnes : Nom, Domaine, Couleur, Millésime, Région,
          Quantité, Prix unitaire…). Les photos ne sont présentes que dans l’export JSON.
        </p>
      </section>

      {/* Installer / partager */}
      <section className="card space-y-3 p-4">
        <h2 className="font-semibold text-stone-800">Installer / partager</h2>
        <p className="text-sm text-stone-500">
          Ouvrez ce lien sur un téléphone, puis « Ajouter à l’écran d’accueil » pour installer l’app.
        </p>
        <p className="break-all rounded-xl bg-stone-100 px-3 py-2 text-sm text-stone-600">
          {lienApp}
        </p>
        <button type="button" className="btn-secondary w-full" onClick={copierLien}>
          🔗 Copier le lien de l’application
        </button>
      </section>

      {/* Préférences */}
      <section className="card space-y-3 p-4">
        <h2 className="font-semibold text-stone-800">Préférences</h2>
        <div>
          <label className="field-label">Horizon « à boire bientôt »</label>
          <select
            className="field-input"
            value={seuilMois}
            onChange={(e) => setReglages({ seuilMois: Number(e.target.value) })}
          >
            <option value={3}>3 mois</option>
            <option value={6}>6 mois</option>
            <option value={12}>12 mois</option>
            <option value={24}>24 mois</option>
          </select>
        </div>
      </section>

      {/* Infos */}
      <section className="card space-y-1 p-4 text-sm text-stone-500">
        <h2 className="font-semibold text-stone-800">À propos</h2>
        {stats && (
          <p>
            {pluriel(stats.vins, 'vin')} · {pluriel(stats.bouteilles, 'lot')} ·{' '}
            {pluriel(stats.photos, 'photo')}
          </p>
        )}
        <p>
          Application 100 % locale : vos données restent sur cet appareil, et l’app fonctionne
          hors-ligne.
        </p>
        <p className="pt-1 font-medium text-wine-700">
          App 100 % réalisée par Antoine B pour votre bon plaisir 🍷
        </p>
      </section>

      {/* Zone dangereuse */}
      <section className="space-y-2">
        <button type="button" className="btn-ghost w-full text-red-600" onClick={toutEffacer}>
          Tout effacer
        </button>
      </section>
    </div>
  );
}
