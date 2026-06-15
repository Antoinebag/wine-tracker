// Génère les icônes PNG de la PWA à partir d'un dessin SVG (verre de vin).
// Lancer : node scripts/gen-icons.mjs
import { Resvg } from '@resvg/resvg-js';
import { mkdirSync, writeFileSync, readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const racine = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const dossierIcons = resolve(racine, 'public/icons');
mkdirSync(dossierIcons, { recursive: true });

// SVG standard (coins arrondis) — réutilise le favicon.
const svgStandard = readFileSync(resolve(racine, 'public/favicon.svg'), 'utf8');

// SVG maskable : fond plein (pas de coins) + dessin réduit dans la zone de sécurité.
const svgMaskable = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512">
  <rect width="512" height="512" fill="#7b1e3b"/>
  <g transform="translate(256 256) scale(0.62) translate(-256 -256)">
    <path d="M168 116 H344 C344 224 304 286 256 286 C208 286 168 224 168 116 Z" fill="#faf7f2"/>
    <path d="M186 150 H326 C322 224 290 268 256 268 C222 268 190 224 186 150 Z" fill="#cf6280"/>
    <rect x="246" y="286" width="20" height="104" fill="#faf7f2"/>
    <rect x="190" y="396" width="132" height="22" rx="11" fill="#faf7f2"/>
  </g>
</svg>`;

function rendre(svg, taille, fichier) {
  const resvg = new Resvg(svg, { fitTo: { mode: 'width', value: taille } });
  const png = resvg.render().asPng();
  writeFileSync(resolve(dossierIcons, fichier), png);
  console.log('✓', fichier, `${taille}px`);
}

rendre(svgStandard, 192, 'icon-192.png');
rendre(svgStandard, 512, 'icon-512.png');
rendre(svgMaskable, 512, 'icon-512-maskable.png');
rendre(svgMaskable, 180, 'apple-touch-icon.png');
