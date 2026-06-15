# 🍷 Ma Cave à Vin

Application personnelle de gestion de cave à vin. **100 % locale**, **hors-ligne**, **mobile-first**.
Pensée pour la rapidité : ajouter une bouteille en 10 secondes (un nom suffit), la retrouver en 2.

Aucun serveur, aucune base de données distante, aucun compte. Toutes les données restent **sur votre
appareil** (IndexedDB). L'app s'installe sur l'écran d'accueil du téléphone et fonctionne même dans la
cave sans réseau.

## Fonctionnalités (v1)

- **Ajout rapide** : un seul champ requis (le nom), tout le reste replié sous « Ajouter des détails ».
  Pré-remplissage intelligent (date du jour, format 75 cl, quantité 1), photo de l'étiquette en un tap,
  dictée vocale sur les champs texte.
- **Consultation ultra-rapide** : recherche live (nom / domaine / région / appellation / cépages / tags),
  vue **liste** ou **galerie** de photos. La fiche met **le prix payé et les notes de dégustation en avant**.
- **Gestion du stock** : boutons **+1 / −1** et **« J'en bois une »** (décrémente et propose une note du jour).
  Plusieurs lots par vin (prix/dates d'achat différents). Les vins épuisés sont conservés (historique).
- **Garde** : type de garde (à boire vite / peut attendre / garde longue), fenêtre d'apogée, et une
  section **« À boire bientôt »** sur l'accueil.
- **Inventaire & tableau de bord** : nombre total de bouteilles, **valeur totale du stock**, répartitions
  par couleur / région / millésime, mises en avant (plus anciennes, valeur dormante, grosses quantités),
  achetées vs bues sur l'année, et un **mode inventaire** exportable.
- **Sauvegarde** : export / import **JSON** (avec photos) et **CSV** (compatible Excel).

## Stack technique

- React + TypeScript, **Vite**
- **Tailwind CSS**
- **Dexie.js** (IndexedDB) + `dexie-react-hooks`
- **vite-plugin-pwa** (service worker, manifest, installable, hors-ligne)
- `react-router-dom` (HashRouter — aucune config serveur nécessaire)

## Développement

```bash
npm install
npm run dev          # serveur de dev (http://localhost:5173/wine-tracker/)
npm test             # tests unitaires + smoke tests (Vitest)
npm run build        # build de production (type-check + bundle PWA)
npm run preview      # sert le build de production localement
npm run gen:icons    # régénère les icônes PWA depuis public/favicon.svg
```

## Déploiement (GitHub Pages)

Le workflow `.github/workflows/deploy.yml` build et déploie automatiquement à chaque push.

1. Sur GitHub : **Settings → Pages → Build and deployment → Source : GitHub Actions**.
2. Pousser sur la branche suivie → l'app est publiée sur `https://<utilisateur>.github.io/wine-tracker/`.

> Le chemin de base est `/wine-tracker/` (voir `vite.config.ts`). Pour un autre hébergeur (Netlify,
> Vercel, Cloudflare Pages), buildez avec `BASE_PATH=/ npm run build`.

## Installer sur le téléphone (PWA)

Ouvrir l'URL publiée dans le navigateur du téléphone, puis **« Ajouter à l'écran d'accueil »**
(Safari : Partager → Sur l'écran d'accueil ; Chrome : menu → Installer l'application). L'app se lance
ensuite en plein écran et fonctionne hors-ligne.

## Sauvegarde de vos données ⚠️

Les données vivent uniquement sur cet appareil. **Exportez régulièrement** (Réglages → Export JSON) vers
votre Drive / iCloud : c'est la seule protection contre une perte (téléphone cassé, cache vidé…).

## Structure du projet

```
src/
  db/            modèle de données + configuration Dexie
  repositories/  accès aux données (vins, bouteilles, consommations)
  lib/           logique métier (stats, garde, sauvegarde, photos, format)
  components/    composants d'UI réutilisables
  pages/         écrans (Accueil, Cave, FicheVin, FormulaireVin, Inventaire, Réglages)
  hooks/         hooks de données
  test/          tests Vitest
```

## Limites connues / pistes v2

Reconnaissance automatique d'étiquette (OCR/scan), calcul auto de l'apogée, suggestions d'accords,
cote du marché, plan de cave visuel, notifications, synchro multi-appareils. Voir la spécification.
