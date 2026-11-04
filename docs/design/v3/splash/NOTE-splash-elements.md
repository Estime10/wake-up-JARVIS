# JARVIS · Splash v1 · éléments SVG (SKETCH)

Tous les éléments visibles du splash v1 (`design/motion/splash-v1/`, 5,6 s, 6 actes) sont exportés en SVG autonomes pour reconstruire le splash en code (GSAP). Ils se trouvent dans `public/motion/splash/elements/`. La planche de contrôle est `docs/design/v3/splash/splash-elements-board.png`.

Source de la géométrie : `splash.js` et `splash.css` du prototype. Les positions des textes sont mesurées dans le DOM du prototype (Chromium, 1440×900). Rien n'a été redessiné à la main.

## 1. Repère commun

- **Un seul viewBox pour tous les fichiers : `-356 -129.333 960 600`.** Les unités sont celles du mark v2 (viewBox 248, centre **124,124**), donc chaque calque se superpose exactement à `public/brand/jarvis-mark*.svg`.
- Ce viewBox couvre l'écran 1440×900 à l'échelle du splash (mark ×1,5) : **1 u = 1,5 px**. Conversion : `x_px = 720 + (u − 124) × 1,5` et `y_px = 380 + (v − 124) × 1,5`. Affiché en 1440×900, le fichier tombe pixel pour pixel sur la vidéo.
- Le mark n'est pas centré verticalement dans ce cadre, parce qu'il est à 380 px sur 900 dans le splash. Le centre de rotation de tout le mark reste 124,124.
- Variantes serrées, ajoutées seulement là où elles servent :
  - `splash-rig.svg` : tout le groupe animé du mark (balayage, anneaux boot, mark), viewBox `-100 -100 448 448`, identique au `<svg id="mark">` du prototype. C'est ce groupe qui rejoint le slot Home.
  - `splash-sheen-band.svg` : la bande de reflet seule (56×48).
- **Couleur.** `currentColor` vaut `--color-accent` #ECEAE4 : posez `color: var(--color-accent)` sur le parent. Les gris sont des opacités calibrées sur #0B0B0C : hud .21 (#3A3A3E), hud-strong .33 (#55555A), muted .64 (#9A9A97), text .99 (#E8E8E6). Couleurs fixes conservées : le fond #0B0B0C, le noir .55 de la vignette et le blanc du reflet (`--accent-light-peak`). Aucun ambre, aucun cyan.
- **Règles respectées dans chaque fichier :** `aria-hidden="true"`, `focusable="false"`, aucun script, aucune référence externe, dégradés définis dans le fichier, ids préfixés `splash-` / `sx-`. Un `<style>` interne définit `.sx-rig` (`transform-box: view-box; transform-origin: 124px 124px`), `.sx-box` (centre de la boîte) et `.sx-left` (bord gauche).
- Les ids sont communs à un élément et à `splash-assembled.svg`. N'insérez donc pas les deux dans la même page.

## 2. Liste des éléments (ordre z = ordre d'empilement de l'image finale)

| z   | Fichier                            | Élément                                                                | Acte  | Animation (mode full)                                                                         |
| --- | ---------------------------------- | ---------------------------------------------------------------------- | ----- | --------------------------------------------------------------------------------------------- |
| 0   | `splash-background.svg`            | Fond #0B0B0C                                                           | tout  | statique                                                                                      |
| 1   | `splash-vignette.svg`              | Lueur nacrée .025 + vignette noire .55                                 | tout  | statique                                                                                      |
| 2   | `splash-ambient.svg`               | Grain (feTurbulence) + scanlines 1/3 px, couche à .035, sous le texte  | tout  | statique (filtre jamais animé)                                                                |
| 3   | `splash-corners.svg`               | 4 équerres d'écran 20 px (`#splash-corner-tl/tr/bl/br`, `data-dx/dy`)  | 3     | 2,40 – 3,00 s : opacité + translate ±24 px → 0                                                |
| 4   | `splash-telemetry-geo.svg`         | LAT/LON, BRUXELLES · BE                                                | 4     | 2,60 s, puis +0,1 s : opacité + x −8 px → 0                                                   |
| 5   | `splash-telemetry-clock.svg`       | Horloge `#splash-tm-clock-time`, mails `#splash-tm-mails`              | 4     | 2,75 s, puis +0,1 s                                                                           |
| 6   | `splash-telemetry-modules.svg`     | MODULES + 5 lignes (conduite pointillée, puce, EN LIGNE)               | 4     | en-tête 2,90 s ; ligne i 3,00 + 0,12·i s ; `…-ok` 3,15 + 0,12·i s                             |
| 7   | `splash-telemetry-sequence.svg`    | SÉQUENCE : NOYAU OK, ANNEAUX 4/4, CADRAN 360°, VERROU OK               | 1 → 4 | 1,00 / 1,15 / 2,20 / 2,45 / 3,12 s                                                            |
| 8   | `splash-init-gauge.svg`            | INIT · `#splash-init-pct` % + barre `#splash-init-bar`                 | 4     | 2,60 s ; barre scaleX 0 → 1 de 2,60 à 4,10 s (origine à gauche) ; compteur 000 → 100 en texte |
| 9   | `splash-degrees.svg`               | Repères 000 / 090 / 180 / 270                                          | 3     | 2,70 s, décalage 0,05 s                                                                       |
| 10  | `splash-sweep.svg`                 | Balayage radial (conique 0 → 50°, accent .12, disque r120)             | 3     | opacité 2,30 – 2,50 s, rotate 0 → 360° de 2,30 à 3,20 s, sortie 3,00 – 3,20 s                 |
| 11  | `splash-boot-ring-r138.svg`        | Anneau boot r138 tireté                                                | 2     | 1,20 – 2,30 s : rotate 60° → 0                                                                |
| 12  | `splash-boot-ring-r150.svg`        | Anneau boot segmenté r150 (accent .20)                                 | 2     | 1,30 – 2,50 s : rotate −140° → 0, puis dérive 0 → 14° (2,50 – 5,60 s)                         |
| 13  | `splash-boot-graduations-r160.svg` | 120 graduations boot r154/158 → 162                                    | 2     | 1,40 – 2,50 s : rotate 45° → 0, puis dérive 0 → −8°                                           |
| 14  | `splash-crosshair.svg`             | Croix cardinales r168 → 180                                            | 3     | 2,50 – 2,95 s : scale .9 → 1                                                                  |
| 15  | `splash-reticles.svg`              | 4 réticules (`#splash-reticle-tl/tr/br/bl`)                            | 3     | 2,55 – 3,05 s : scale 1,25 → 1 ; **1 flash de verrou** 1 → .45 → 1 (3,05 – 3,19 s)            |
| 16  | `splash-ring-outer.svg`            | Anneau r120                                                            | 2     | 1,30 – 2,20 s : scale .92 → 1                                                                 |
| 17  | `splash-ticks.svg`                 | 72 graduations r100/104 → 108 (`path[data-i]`, 0 = midi, sens horaire) | 2     | opacité en escalier 1,45 – 2,17 s                                                             |
| 18  | `splash-arcs-r114.svg`             | 2 arcs r114                                                            | 2     | 1,35 – 2,35 s : rotate −90° → 0                                                               |
| 19  | `splash-ring-r80.svg`              | Bande r88 + voile r78 + piste r80                                      | 2     | 1,16 – 2,16 s : rotate 90° → 0, scale .9 → 1                                                  |
| 20  | `splash-trail.svg`                 | Traînée : 108 segments chevauchants (`path[data-i]`)                   | 2     | opacité segment par segment 1,65 – 2,48 s (stagger 0,75 s, ease inOutSoft)                    |
| 20  | `splash-trail-static.svg`          | Variante : traînée en 32 arcs imbriqués (mark v2)                      | 2     | aucune (état final, reduced motion)                                                           |
| 21  | `splash-trail-head.svg`            | Tête de traînée (halo r9 + point r3)                                   | 2     | 1,65 – 2,48 s : rotate −195° → 0                                                              |
| 22  | `splash-ring-r70-dashed.svg`       | Cadran pointillé r70                                                   | 2     | 1,08 – 2,03 s : rotate −150° → 0, scale .85 → 1                                               |
| 23  | `splash-ring-r60.svg`              | Anneau r60                                                             | 2     | 1,00 – 1,90 s : rotate 120° → 0, scale .8 → 1                                                 |
| 24  | `splash-core.svg`                  | Noyau : halo r22 `#splash-core-halo` + point r6                        | 1     | halo scale .6 → 1 (0,15 – 1,15 s) ; 2 flashs (0,40 et 0,74 s) ; allumage 1,08 – 1,22 s        |
| 25  | `splash-scan.svg`                  | Ligne de scan (voile .06 + trait .32)                                  | 3     | 2,20 – 3,10 s : translateY −64 px → 900 px (−42,667 u → 600 u)                                |
| 26  | `splash-title.svg`                 | J A R V I S en texte (`text#splash-letter-*`)                          | 5     | lettre i à 3,70 + 0,08·i s : opacité 0 → .82 + y 14 px → 0 ; puis → 1 à 4,45 + 0,05·i s       |
| 26  | `splash-title-outlined.svg`        | Variante : titre en contours                                           | 5     | mêmes tweens (`path#splash-letter-*`)                                                         |
| 27  | `splash-title-sheen.svg`           | Reflet nacré : bande dégradée masquée par les lettres                  | 5     | 4,15 – 4,85 s : translateX 0 → 305,2 px (203,47 u)                                            |
| 28  | `splash-status.svg`                | • Systèmes en ligne                                                    | 6     | 4,60 – 4,95 s : opacité + y 6 px → 0                                                          |
| 28  | `splash-status-outlined.svg`       | Variante en contours                                                   | 6     | mêmes tweens                                                                                  |
| 29  | `splash-skip.svg`                  | Repère visuel du bouton Passer + Échap                                 | tout  | toujours visible ; **en code, garder un vrai `<button>` HTML**                                |

En plus de ces fichiers :

- `splash-assembled.svg` : tous les calques dans l'ordre z, chacun dans un `<g id="layer-…">` (les 15 calques du mark sont regroupés dans `g#layer-rig`). Il est figé à **t = 4,90 s**, la dernière image complète : r150 à +10,84°, r160 à −6,19°, INIT 100 %, et balayage, scan et reflet présents à opacité 0.
- `splash-elements.json` : le manifeste. Pour chaque fichier : rôle, acte, z, origine de transformation, début et fin (s) et la liste des tweens (propriétés de départ et d'arrivée, en px écran et en u, easing), plus le passage vers la Home.

**Passage vers la Home (acte 6, commun).** À 4,90 s, le décor passe en fondu (0,3 s, power1.out) et les anneaux boot, la croix et les réticules sortent (opacité 0 et scale 1,06 en 0,35 s). De 4,95 à 5,45 s (inOutSoft), le groupe rig fait `translate(−180 px, −193 px)` avec scale 1,5 → 1 autour de son centre, et le titre fait `translate(−184 px, −345 px)`. La Home apparaît en fondu de 5,35 à 5,60 s.

## 3. Consignes d'animation

- **Transform et opacity uniquement** (ADR 0004). Pas de `stroke-dashoffset`, pas de largeur animée, pas de filtre animé. Le grain est un filtre statique : en code, préférez une texture PNG ou CSS fixe.
- **Origines.** Calques du mark : `svgOrigin: "124 124"` dans GSAP, ou la classe `.sx-rig` fournie. Lignes de télémétrie et lettres : `transform-box: fill-box`. Barre INIT : origine à gauche.
- **Easings.** `outSoft` = cubic-bezier(0.22, 1, 0.36, 1) pour les entrées. `inOutSoft` = cubic-bezier(0.65, 0, 0.35, 1) pour les déplacements (scan, balayage, traînée, passage vers la Home). `none` pour les flashs et les escaliers.
- **Flashs : 3 par seconde au maximum (WCAG 2.3.1).** Le noyau clignote 2 fois (0,14 s + pause 0,2 s, ≈ 2,9 Hz), sur une petite surface. Les réticules font un seul flash. Aucun flash plein écran : le scan reste à 6 % / 32 % et ne clignote pas.
- **Reduced motion.** Aucun mouvement. Le mark statique (`splash-trail-static.svg` à la place des 108 segments) et le titre apparaissent directement dans leur slot Home, en fondu de 300 ms. Pas de balayage, pas de scan, pas de clignotement, pas de rotation.
- **Version courte (1,6 s).** Noyau, anneaux, graduations, traînée, équerres et titre seulement, sans scan ni télémétrie (voir `NOTE-splash.md`).
- **Accessibilité.** Tout le décor reste `aria-hidden`. L'annonce unique « JARVIS : systèmes en ligne. » passe par une région live, pas par ces SVG.

## 4. Textes et polices

- Les textes restent des `<text>` en IBM Plex Sans / Mono (la page doit charger les polices). Chaque glyphe reçoit la position x mesurée dans le prototype : Chromium arrondit l'avance de Plex Mono 12 px à 7 px, et sans ces positions le texte SVG serait environ 2 % plus large. Pour les textes dynamiques (horloge, mails, INIT), ces positions sont celles des valeurs de démonstration. **En code, la télémétrie doit rester du texte HTML.** Les SVG servent de référence de placement.
- **Contours.** Le titre (`splash-title-outlined.svg`) et la ligne de statut (`splash-status-outlined.svg`) existent aussi en tracés. Ils sont générés avec fonttools à partir de `IBMPlexSans-var.woff2`, instancié à wght 600 et 500. Le masque du reflet utilise ces tracés, donc il ne dépend d'aucune police. La télémétrie n'est pas vectorisée : ce sont des valeurs qui changent.

## 5. Vérification

- `splash-assembled.svg`, rendu en 1440×900 avec les polices locales, a été comparé à l'image 294 de `public/motion/splash-v1.mp4` (alias `splash-v1-1440x900.mp4` dans le prototype) (t = 4,90 s, extraite avec ffmpeg). La dernière image de la vidéo (6,2 s) montre la Home et non le splash, d'où le choix de cette image.
- **Écarts mesurés** (sur 255) : 1,7 en moyenne sur toute l'image, et 1,9 sur le mark avec 0,001 % de pixels au-dessus de 32. Il ne reste que la compression vidéo, le grain aléatoire et l'anticrénelage des bords de texte. Ce dernier vient du texte HTML indicé face au texte SVG mis à l'échelle : un décalage vertical de 0,5 à 0,7 px sur « Systèmes en ligne » et « Passer ».
- La planche `splash-elements-board.png` montre chaque élément sur #0B0B0C, puis la vidéo, l'assemblé, la différence ×4, la dernière image réelle, des zooms du mark et le tableau des écarts.
- Les scripts de génération sont sur la box, dans `design/motion/splash-v1/elements-src/` : `extract.mjs`, `gen.py`, `manifest.py`, `shot.mjs`, `board.mjs`.
