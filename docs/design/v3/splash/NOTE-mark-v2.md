# JARVIS — Mark v2 (SKETCH)

Le mark v2 est l'état final du splash v1 (même dessin que le slot Home `home-repo-1440x900`).
Planche : `mark-v2-board.png`.

## Fichiers

| Fichier                               | Rôle                                                                                                                                                                                               |
| ------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `public/brand/jarvis-mark.svg`        | Monochrome. Tout est en `currentColor`. Les gris HUD sont rendus par l'opacité (.21 ≈ #3A3A3E, .33 ≈ #55555A sur #0B0B0C). Il prend la couleur du parent (`color: var(--color-accent)` = #ECEAE4). |
| `public/brand/jarvis-mark-pearl.svg`  | Version nacrée autonome, sur fond transparent. Elle reprend les dégradés rgba de la vidéo. Les ids sont préfixés `jmp-`. À utiliser en `<img>`.                                                    |
| `public/brand/jarvis-mark-layers.svg` | Calques nommés pour l'animation. Il est en `currentColor` et ses ids sont préfixés `jml-`. Son viewBox est élargi à `-60 -60 368 368` pour garder les réticules.                                   |
| `app/icon.svg` + `app/favicon.ico`    | Favicon simplifié sur une grille de 32 : fond, anneau extérieur, traînée en 3 tons, tête et noyau. Le .ico contient les tailles 16, 32 et 48.                                                      |
| `app/apple-icon.png`                  | 180 × 180 px, mark nacré sur fond plein #0B0B0C. iOS arrondit les coins lui-même.                                                                                                                  |

## Géométrie (viewBox 248, centre 124,124, angles en degrés avec y vers le bas)

- **ring-outer** :
  - cercle r120, trait hud de 1 px ;
  - arcs r114 de 115→160° et de 295→340°, trait hud-strong de 1,25 px.
- **ticks** : un trait tous les 5° à partir de −90°.
  - Les majeurs (tous les 30°) vont de r100 à r108 ; les mineurs de r104 à r108.
  - Trait hud-strong de 1 px. Tous les traits sont dans un seul `<path>`.
- **ring-inner** :
  - r88 : trait hud de 6 px, opacité .5 ;
  - r78 : remplissage par un dégradé radial (accent .07 → 0) ;
  - r80 : trait accent, opacité .12, 2 px ;
  - r70 : trait hud-strong en pointillés `2 5` ;
  - r60 : trait hud.
- **trail** : arc r80 de 120° à 315°, trait accent de 2 px.
  - Dans la vidéo, la traînée est faite de 108 segments.
  - Dans le SVG, elle est faite de 32 arcs imbriqués qui finissent tous à la tête. Leur empilement redonne la même rampe d'opacité (.12 → .95), sans joints visibles et pour un fichier plus léger.
- **trail-head** : centré en (180,57 ; 67,43). Halo r9 (accent .22 → 0) et point r3 (accent .95).
- **core** : halo r22 (accent .22 → 0) et point r6 en dégradé radial (blanc → accent .6).
- **reticles** (uniquement dans `jarvis-mark-layers.svg`, ce sont les couches du boot) :
  - r138, en pointillés `200 16.77` ;
  - r150, accent .2, pointillés `36 52 18 96 48 140` ;
  - graduations r154/158 → r162 tous les 3° ;
  - croix de r168 à r180 ;
  - coins en L à ±178, avec des branches de 18 px.

## Accessibilité et sécurité

- **Par défaut**, chaque SVG porte `aria-hidden="true"` et `focusable="false"` : c'est un logo décoratif.
- **Si le logo doit porter du sens**, retirez `aria-hidden`, ajoutez `role="img"`, puis placez `<title id="…">JARVIS</title>` comme premier enfant avec `aria-labelledby`. En `<img>`, utilisez `alt="JARVIS"` ou `alt=""`.
- **Contenu exclu** : aucun script, aucun lien externe, aucun `foreignObject`, aucune image `data:` et aucun filtre. Les lueurs sont faites avec des dégradés radiaux.
- **Version currentColor dans un `<img>`** : elle s'affiche en noir, car `currentColor` n'hérite pas à travers `<img>`. Pour un `<img>`, utilisez `jarvis-mark-pearl.svg`. La version currentColor est faite pour l'inline (composant React).
- **Ids** : ils sont uniques par fichier. Si le même SVG est inséré plusieurs fois en inline dans une page, suffixez les ids, par exemple avec `useId()` comme le fait déjà `JarvisMark.tsx`.

## Calques de `jarvis-mark-layers.svg` (pour PIXEL)

- **Repérage** : chaque `<g>` porte `data-layer="…"`, un `id="jml-…"` et la classe `jm-layer`.
- **Point de pivot** : le fichier contient la règle `.jm-layer{transform-box:view-box;transform-origin:124px 124px}`. Toutes les rotations et tous les changements d'échelle pivotent donc autour du centre du mark. Avec GSAP, vous pouvez aussi utiliser `svgOrigin: "124 124"`.
- **Ordre d'empilement** (du fond vers le dessus) : reticles, ring-outer, ticks, ring-inner, trail, trail-head, core.
- **Propriétés animées** : uniquement `transform` et `opacity` (ADR 0004). Aucun `stroke-dashoffset` n'est nécessaire.
- **Apparition de la traînée** : dans la vidéo, les 108 segments apparaissent un par un en opacité. Avec les arcs imbriqués du SVG, deux options :
  - faire apparaître les arcs du plus court au plus long, ce qui donne une traînée qui pousse depuis la tête ;
  - garder les segments générés en JS, comme dans le prototype (`splash.js`).

## Ce que PIXEL devra changer (SKETCH ne touche pas au code)

Le composant réel est `components/ui/JarvisMark/JarvisMark.tsx` (viewBox 512, anneaux r246/r232/r210/r140, traînée r180 avec masque `trailFadeSegments.ts`). Le chemin `features/intro/components/jarvis-mark.tsx` n'existe pas sur `develop`.

1. **Dessin idle** : passer le dessin idle sur la géométrie v2. Deux façons de faire :
   - passer en viewBox 248 ;
   - garder 512 et multiplier les rayons par 512/248 ≈ 2,0645.
2. **Traînée** : remplacer le masque `TRAIL_FADE_SEGMENTS` par les arcs imbriqués, ou par les segments à opacité croissante.
3. **Noms** : garder les `data-jarvis` existants, dont les timelines GSAP dépendent (`trail-group`, `trail`, `head`, `core`, `ring-outer`, `ring-dial`…). Leur faire correspondre les calques v2 :
   - `ring-outer` ↔ ring-outer ;
   - `ring-dial` ↔ ring-inner ;
   - nouveaux nœuds pour les ticks et les arcs r114.
4. **Autres modes** : vérifier `voiceRingGeometry.ts`. `STATUS_RING_RADIUS` et les autres modes (écoute, réflexion, parole, erreur, hors ligne) sont calés sur l'ancien dessin 512.
5. **Chemins d'assets** : `lib/assets/index.ts` pointe `jarvisMark` vers `/assets/jarvis-mark.svg` (ancien mark), et ce chemin n'est importé nulle part ailleurs. Il faut soit le pointer vers `/brand/jarvis-mark-pearl.svg`, soit retirer l'ancien fichier, au choix de PIXEL et DevinChat.
6. **Splash** : `SplashMarkStage.tsx` et `buildFullIntroTimeline.ts` peuvent reprendre la séquence de `NOTE-splash.md`.
