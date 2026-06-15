// Sauvegarde / restauration (§4.6) : export & import JSON (avec photos) et CSV (Excel).
import { db, nouvelId, aujourdHuiIso, maintenantIso } from '../db/db';
import type { Vin, Bouteille, Consommation } from '../db/types';
import { COULEURS, FORMAT_DEFAUT } from '../db/types';

export interface PhotoSerialisee {
  vinId: string;
  type: string;
  blob: string; // base64
  thumb: string; // base64
}

export interface Sauvegarde {
  app: 'cave-a-vin';
  version: number;
  exportedAt: string;
  vins: Vin[];
  bouteilles: Bouteille[];
  consommations: Consommation[];
  photos: PhotoSerialisee[];
}

// --- Base64 <-> Blob (compatibles navigateur et Node 22 pour les tests) ---

function uint8ToBase64(bytes: Uint8Array): string {
  let binary = '';
  const chunk = 0x8000;
  for (let i = 0; i < bytes.length; i += chunk) {
    binary += String.fromCharCode(...bytes.subarray(i, i + chunk));
  }
  return btoa(binary);
}

async function blobToBase64(blob: Blob): Promise<string> {
  const buf = await blob.arrayBuffer();
  return uint8ToBase64(new Uint8Array(buf));
}

function base64ToBlob(data: string, type: string): Blob {
  const binary = atob(data);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  return new Blob([bytes], { type });
}

// --- Export JSON ---

export async function construireSauvegarde(): Promise<Sauvegarde> {
  const [vins, bouteilles, consommations, photos, thumbs] = await Promise.all([
    db.vins.toArray(),
    db.bouteilles.toArray(),
    db.consommations.toArray(),
    db.photos.toArray(),
    db.thumbs.toArray(),
  ]);

  const thumbsParId = new Map(thumbs.map((t) => [t.vinId, t.blob]));
  const photosSerialisees: PhotoSerialisee[] = await Promise.all(
    photos.map(async (p) => {
      const thumb = thumbsParId.get(p.vinId) ?? p.blob;
      return {
        vinId: p.vinId,
        type: p.blob.type || 'image/jpeg',
        blob: await blobToBase64(p.blob),
        thumb: await blobToBase64(thumb),
      };
    }),
  );

  return {
    app: 'cave-a-vin',
    version: 1,
    exportedAt: maintenantIso(),
    vins,
    bouteilles,
    consommations,
    photos: photosSerialisees,
  };
}

/** Restaure une sauvegarde JSON. `remplacer` vide la base avant import. */
export async function appliquerSauvegarde(
  s: Sauvegarde,
  options: { remplacer?: boolean } = {},
): Promise<void> {
  if (!s || s.app !== 'cave-a-vin' || !Array.isArray(s.vins)) {
    throw new Error('Fichier de sauvegarde invalide.');
  }

  await db.transaction(
    'rw',
    [db.vins, db.bouteilles, db.consommations, db.photos, db.thumbs],
    async () => {
      if (options.remplacer) {
        await Promise.all([
          db.vins.clear(),
          db.bouteilles.clear(),
          db.consommations.clear(),
          db.photos.clear(),
          db.thumbs.clear(),
        ]);
      }
      await db.vins.bulkPut(s.vins);
      await db.bouteilles.bulkPut(s.bouteilles ?? []);
      await db.consommations.bulkPut(s.consommations ?? []);
      const photos = (s.photos ?? []).map((p) => ({
        vinId: p.vinId,
        blob: base64ToBlob(p.blob, p.type),
      }));
      const thumbs = (s.photos ?? []).map((p) => ({
        vinId: p.vinId,
        blob: base64ToBlob(p.thumb, p.type),
      }));
      await db.photos.bulkPut(photos);
      await db.thumbs.bulkPut(thumbs);
    },
  );
}

// --- Export CSV (compatible Excel) ---

const CSV_SEP = ';';

const CSV_COLONNES: { cle: string; titre: string }[] = [
  { cle: 'nom', titre: 'Nom' },
  { cle: 'domaine', titre: 'Domaine' },
  { cle: 'couleur', titre: 'Couleur' },
  { cle: 'millesime', titre: 'Millésime' },
  { cle: 'region', titre: 'Région' },
  { cle: 'appellation', titre: 'Appellation' },
  { cle: 'cepages', titre: 'Cépages' },
  { cle: 'degre', titre: 'Degré' },
  { cle: 'notePerso', titre: 'Note perso' },
  { cle: 'notesDegustation', titre: 'Notes de dégustation' },
  { cle: 'accordsMets', titre: 'Accords mets' },
  { cle: 'tags', titre: 'Tags' },
  { cle: 'format', titre: 'Format' },
  { cle: 'quantite', titre: 'Quantité' },
  { cle: 'prixAchat', titre: 'Prix unitaire' },
  { cle: 'valeurLot', titre: 'Valeur lot' },
  { cle: 'dateAchat', titre: "Date d'achat" },
  { cle: 'sourceAchat', titre: "Source d'achat" },
  { cle: 'emplacement', titre: 'Emplacement' },
  { cle: 'gardeType', titre: 'Garde' },
  { cle: 'aBoireAPartirDe', titre: 'À boire à partir de' },
  { cle: 'aBoireAvant', titre: 'À boire avant' },
];

function champCsv(valeur: unknown): string {
  if (valeur == null) return '';
  let s = Array.isArray(valeur) ? valeur.join(', ') : String(valeur);
  if (s.includes(CSV_SEP) || s.includes('"') || s.includes('\n')) {
    s = '"' + s.replace(/"/g, '""') + '"';
  }
  return s;
}

export async function genererCsv(): Promise<string> {
  const [vins, bouteilles] = await Promise.all([
    db.vins.toArray(),
    db.bouteilles.toArray(),
  ]);
  const vinsParId = new Map(vins.map((v) => [v.id, v]));

  const lignes: string[] = [];
  lignes.push(CSV_COLONNES.map((c) => c.titre).join(CSV_SEP));

  // Une ligne par lot de bouteilles. Un vin sans lot apparaît tout de même.
  const vinsAvecLot = new Set<string>();
  for (const b of bouteilles) {
    const v = vinsParId.get(b.vinId);
    if (!v) continue;
    vinsAvecLot.add(v.id);
    lignes.push(ligneCsv(v, b));
  }
  for (const v of vins) {
    if (!vinsAvecLot.has(v.id)) lignes.push(ligneCsv(v, undefined));
  }

  // BOM UTF-8 pour qu'Excel affiche correctement les accents.
  return '\uFEFF' + lignes.join('\r\n');
}

function ligneCsv(v: Vin, b: Bouteille | undefined): string {
  const valeurLot =
    b?.prixAchat != null ? Math.round(b.prixAchat * b.quantite * 100) / 100 : '';
  const valeurs: Record<string, unknown> = {
    nom: v.nom,
    domaine: v.domaine,
    couleur: v.couleur,
    millesime: v.millesime,
    region: v.region,
    appellation: v.appellation,
    cepages: v.cepages,
    degre: v.degre,
    notePerso: v.notePerso,
    notesDegustation: v.notesDegustation,
    accordsMets: v.accordsMets,
    tags: v.tags,
    format: b?.format,
    quantite: b?.quantite,
    prixAchat: b?.prixAchat,
    valeurLot,
    dateAchat: b?.dateAchat,
    sourceAchat: b?.sourceAchat,
    emplacement: b?.emplacement,
    gardeType: b?.gardeType,
    aBoireAPartirDe: b?.aBoireAPartirDe,
    aBoireAvant: b?.aBoireAvant,
  };
  return CSV_COLONNES.map((c) => champCsv(valeurs[c.cle])).join(CSV_SEP);
}

// --- Import CSV ---

/** Découpe une ligne CSV en tenant compte des guillemets. */
function parseLigne(ligne: string, sep: string): string[] {
  const champs: string[] = [];
  let courant = '';
  let dansGuillemets = false;
  for (let i = 0; i < ligne.length; i++) {
    const c = ligne[i];
    if (dansGuillemets) {
      if (c === '"') {
        if (ligne[i + 1] === '"') {
          courant += '"';
          i++;
        } else {
          dansGuillemets = false;
        }
      } else {
        courant += c;
      }
    } else if (c === '"') {
      dansGuillemets = true;
    } else if (c === sep) {
      champs.push(courant);
      courant = '';
    } else {
      courant += c;
    }
  }
  champs.push(courant);
  return champs;
}

const ALIAS_ENTETES: Record<string, string> = {
  nom: 'nom',
  domaine: 'domaine',
  producteur: 'domaine',
  château: 'domaine',
  chateau: 'domaine',
  couleur: 'couleur',
  millésime: 'millesime',
  millesime: 'millesime',
  année: 'millesime',
  annee: 'millesime',
  région: 'region',
  region: 'region',
  appellation: 'appellation',
  cépages: 'cepages',
  cepages: 'cepages',
  degré: 'degre',
  degre: 'degre',
  'note perso': 'notePerso',
  note: 'notePerso',
  'notes de dégustation': 'notesDegustation',
  'notes de degustation': 'notesDegustation',
  notes: 'notesDegustation',
  'accords mets': 'accordsMets',
  accords: 'accordsMets',
  tags: 'tags',
  format: 'format',
  quantité: 'quantite',
  quantite: 'quantite',
  qté: 'quantite',
  qte: 'quantite',
  'prix unitaire': 'prixAchat',
  prix: 'prixAchat',
  "prix d'achat": 'prixAchat',
  "date d'achat": 'dateAchat',
  'date achat': 'dateAchat',
  "source d'achat": 'sourceAchat',
  source: 'sourceAchat',
  emplacement: 'emplacement',
  garde: 'gardeType',
  'à boire à partir de': 'aBoireAPartirDe',
  'à boire avant': 'aBoireAvant',
  'a boire avant': 'aBoireAvant',
};

function nombreOuUndef(v: string): number | undefined {
  const s = v.replace(',', '.').trim();
  if (!s) return undefined;
  const n = Number(s);
  return Number.isNaN(n) ? undefined : n;
}

function listeOuUndef(v: string): string[] | undefined {
  const items = v
    .split(/[,;]/)
    .map((s) => s.trim())
    .filter(Boolean);
  return items.length ? items : undefined;
}

export interface ResultatImportCsv {
  vins: Vin[];
  bouteilles: Bouteille[];
}

/** Construit vins + lots à partir d'un texte CSV (sans écrire en base). */
export function parserCsv(texte: string): ResultatImportCsv {
  const sansBom = texte.replace(/^\uFEFF/, '');
  const lignes = sansBom.split(/\r?\n/).filter((l) => l.trim().length > 0);
  if (lignes.length < 2) return { vins: [], bouteilles: [] };

  // Détection du séparateur sur l'en-tête.
  const entete = lignes[0];
  const sep = entete.split(';').length >= entete.split(',').length ? ';' : ',';

  const colonnes = parseLigne(entete, sep).map((c) =>
    (ALIAS_ENTETES[c.trim().toLowerCase()] ?? '').trim(),
  );

  const vins: Vin[] = [];
  const bouteilles: Bouteille[] = [];

  for (let i = 1; i < lignes.length; i++) {
    const champs = parseLigne(lignes[i], sep);
    const get = (cle: string): string => {
      const idx = colonnes.indexOf(cle);
      return idx >= 0 ? (champs[idx] ?? '').trim() : '';
    };

    const nom = get('nom').trim();
    if (!nom) continue;

    const now = maintenantIso();
    const couleurBrute = get('couleur').toLowerCase();
    const vin: Vin = {
      id: nouvelId(),
      nom,
      domaine: get('domaine') || undefined,
      couleur: (COULEURS as string[]).includes(couleurBrute)
        ? (couleurBrute as Vin['couleur'])
        : undefined,
      millesime: nombreOuUndef(get('millesime')),
      region: get('region') || undefined,
      appellation: get('appellation') || undefined,
      cepages: listeOuUndef(get('cepages')),
      degre: nombreOuUndef(get('degre')),
      notePerso: nombreOuUndef(get('notePerso')),
      notesDegustation: get('notesDegustation') || undefined,
      accordsMets: get('accordsMets') || undefined,
      tags: listeOuUndef(get('tags')),
      createdAt: now,
      updatedAt: now,
    };

    const quantite = nombreOuUndef(get('quantite')) ?? 1;
    const bouteille: Bouteille = {
      id: nouvelId(),
      vinId: vin.id,
      quantite: Math.max(0, Math.round(quantite)),
      format: (get('format') as Bouteille['format']) || FORMAT_DEFAUT,
      prixAchat: nombreOuUndef(get('prixAchat')),
      dateAchat: get('dateAchat') || aujourdHuiIso(),
      sourceAchat: get('sourceAchat') || undefined,
      emplacement: get('emplacement') || undefined,
      aBoireAvant: get('aBoireAvant') || undefined,
      aBoireAPartirDe: get('aBoireAPartirDe') || undefined,
      gardeType: (get('gardeType') as Bouteille['gardeType']) || undefined,
    };

    vins.push(vin);
    bouteilles.push(bouteille);
  }

  return { vins, bouteilles };
}

export async function importerCsv(texte: string): Promise<number> {
  const { vins, bouteilles } = parserCsv(texte);
  if (!vins.length) return 0;
  await db.transaction('rw', db.vins, db.bouteilles, async () => {
    await db.vins.bulkAdd(vins);
    await db.bouteilles.bulkAdd(bouteilles);
  });
  return vins.length;
}

// --- Déclenchement des téléchargements (navigateur uniquement) ---

export function telecharger(nomFichier: string, contenu: Blob): void {
  const url = URL.createObjectURL(contenu);
  const a = document.createElement('a');
  a.href = url;
  a.download = nomFichier;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export async function exporterJsonFichier(): Promise<void> {
  const s = await construireSauvegarde();
  const blob = new Blob([JSON.stringify(s)], { type: 'application/json' });
  telecharger(`ma-cave-${aujourdHuiIso()}.json`, blob);
}

export async function exporterCsvFichier(): Promise<void> {
  const csv = await genererCsv();
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' });
  telecharger(`ma-cave-${aujourdHuiIso()}.csv`, blob);
}
