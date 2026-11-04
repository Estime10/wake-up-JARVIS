# JARVIS — Splash v1 « démarrage HUD » (SKETCH)

> **Emplacement dans le dépôt** : les vidéos sont copiées dans `public/motion/` (`splash-v1-1440x900.mp4` → `public/motion/splash-v1.mp4`, les deux autres gardent leur nom). Le prototype HTML/GSAP qui les a rendues reste hors dépôt (box SKETCH). Le mark v2 est décrit dans `NOTE-mark-v2.md`.

Prototype motion à valider par DevinChat **avant** tout code. Sans voix ni son.
Dossier : `design/motion/splash-v1/` (box uniquement, rien poussé sur GitHub).

| Livrable                                | Contenu                                                                                                               |
| --------------------------------------- | --------------------------------------------------------------------------------------------------------------------- |
| `splash-v1-1440x900.mp4`                | Version complète : intro 5,6 s + 0,6 s de Home tenue = 6,2 s, 1440×900, 60 fps, H.264 yuv420p, sans audio, +faststart |
| `splash-v1-short.mp4`                   | Version courte : intro 1,6 s + 0,5 s tenue = 2,1 s                                                                    |
| `splash-v1-reduced-motion.mp4`          | Reduced motion : 1,2 s + 0,5 s tenue = 1,7 s, fondus seuls                                                            |
| `splash-v1-storyboard.png`              | 8 frames clés annotées avec leurs temps                                                                               |
| `index.html`, `splash.css`, `splash.js` | Prototype autonome (GSAP 3.15 + CustomEase en local, polices Plex locales). `?mode=full                               | short | reduced` |
| `render.mjs`                            | Rendu déterministe : timeline GSAP en pause, `__seek(t)` image par image, Playwright → ffmpeg                         |

---

## 1. Le splash actuel (lu en lecture seule)

**Branche.** Il n'existe ni `mssages-to-api` ni `messages-to-api` sur `Estime10/wake-up-JARVIS` (branches distantes : `main`, `develop`, `feature/api` ; aucune PR). J'ai analysé `feature/api` (= `develop`, même commit `fc347fd`, 2 nov. 2026 11:58 UTC+1), qui contient le commit splash `2f08265 feat(intro): splash mark+wake`. **À confirmer** : si `messages-to-api` existe seulement en local chez toi, elle n'est pas poussée.

**Séquence actuelle (mode full, `buildFullIntroTimeline`)** — 2,9 s (`INTRO_DURATION_FULL_MS = 2900`, `--duration-intro-full: 2900ms`) :

| Temps         | Ce qui se passe                                                                                                                                                         |
| ------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 0 – 0,9 s     | Icône « barres de son » + texte Mono « Réveil détecté : « Wake up, JARVIS » » tapé lettre par lettre, en bas                                                            |
| 0,55 – 0,9 s  | Le mark apparaît en fondu                                                                                                                                               |
| 0,9 – 1,75 s  | `blinkCoreTwice` : 2 flashs du noyau (0,14 s + pause 0,2 s, ≈ 2,9 Hz), puis allumage                                                                                    |
| 1,75 – 2,55 s | Anneau extérieur « dessiné » en **stroke-dashoffset**                                                                                                                   |
| 1,95 – 2,55 s | Cadran pointillé + accents en opacité                                                                                                                                   |
| 2,0 – 2,75 s  | Traînée dessinée en **stroke-dashoffset**                                                                                                                               |
| 2,55 – 2,9 s  | Tête de la traînée (scale + opacité), puis rotation idle du cadran                                                                                                      |
| après         | Flip GSAP du mark vers son slot Home (`MARK_ENTER_DURATION` 1,2 s) puis chrome Home (0,75 s). Les ~3,5 s « validées » correspondent à peu près à splash + début du Flip |

**Ce qui va bien.** Bouton « Passer » ghost md, `aria-label="Passer l'intro"`, premier dans le DOM, visible dès le départ ; Échap / Entrée / toute touche imprimable / clic n'importe où = passer ; focus envoyé sur `main` via `mainFocus.request()` ; reduced motion = fondu 300 ms sans tracé ni Flip ; clignotement < 3 Hz ; décor `aria-hidden` ; `HudAmbient` = vignette + scanlines à 3 %.

**Écarts et manques.**

- Durées incohérentes : token 2900 ms (pas 3,5 s) ; version courte annoncée 800 ms mais allongée à 1,8 s par `padTimelineToDuration(max(0.8, 1.8))`.
- Le tracé utilise `stroke-dashoffset` (autorisé par l'exception de l'ADR 0004, mais contraire à la décision « transform/opacity uniquement »).
- L'icône « barres de son » + « Wake up, JARVIS » renvoient à la voix, alors que le splash doit être muet.
- Aucune annonce aux lecteurs d'écran pendant le splash (tout est `aria-hidden`) : pas d'annonce unique « systèmes en ligne ».
- Pour l'effet « Iron Man », il manque : l'assemblage des anneaux (rotations), les graduations, un balayage, les réticules qui verrouillent, la télémétrie, le moment du titre, une progression lisible (INIT %, modules). Le splash actuel est un logo qui s'allume, pas un démarrage de système.

---

## 2. Concept

Un **démarrage de système en 6 actes**, lisible comme une check-list : le noyau s'allume, les anneaux s'assemblent, le scan verrouille la cible, les modules passent EN LIGNE, le nom apparaît, puis l'interface se pose sur la Home. Traits fins (1 px), gris acier `--color-hud` / `--color-hud-strong`, nacré en dégradés rgba, aucune lueur animée, aucun cyan, aucun ambre. Le mark est dessiné avec **la même géométrie que le slot Home** (`home-repo-1440x900`), à l'échelle ×1,5 au centre ; il rejoint son slot à l'échelle ×1 à la fin (alignement vérifié au pixel près sur la maquette).

**Pourquoi 5,6 s.** Six actes demandent environ 0,8 à 1 s chacun pour être lus ; en dessous de 5 s, la télémétrie et le titre se chevauchent et l'effet « système qui démarre » disparaît. 5,6 s reste sous la limite de 6 s, est sautable à tout moment (Passer, Échap, Entrée, clic) et n'est joué **qu'au premier lancement** (du jour ou de la session, à trancher). Les lancements suivants jouent la **version courte de 1,6 s**.

---

## 3. Timeline seconde par seconde (version complète, 5,6 s)

| Acte                | Fenêtre       | Détail                                                                                                                                                                                                                                                                                                                                                                                                       |
| ------------------- | ------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| 1 · Noyau           | 0,00 – 1,22 s | Noir. 0,15 s : noyau à 12 % + halo `scale .6 → 1`. Flashs à 0,40 et 0,74 s (0,14 s + 0,2 s), allumage 1,08 → 1,22 s. « SÉQUENCE / NOYAU OK » à droite (1,0 – 1,5 s)                                                                                                                                                                                                                                          |
| 2 · Anneaux         | 1,00 – 2,50 s | r60 `rotate 120° → 0`, r70 `-150° → 0`, r80/88 `90° → 0` (+ scale .8–.9 → 1), r120 `scale .92 → 1`, arcs r114 `-90° → 0`. Anneaux boot r138 / r150 / r160 en sens inverses puis dérive lente. 72 graduations en opacité décalée (1,45 – 2,05 s). Traînée : 108 segments révélés en opacité (1,65 – 2,4 s), la tête tourne `-195° → 0` avec le même easing. « ANNEAUX 4/4 » (2,2 s), « CADRAN 360° » (2,45 s) |
| 3 · Scan & verrou   | 2,20 – 3,20 s | Ligne de scan `translateY -64 → 900 px` (2,2 – 3,1 s). Balayage radial conique `rotate 0 → 360°` (2,3 – 3,2 s). Équerres d'écran : `translate ±24 px → 0` (2,4 – 3,0 s). Croix cardinales et réticules `scale 1,25 → 1` (2,5 – 3,05 s), **1 seul flash de verrou** (3,05 – 3,19 s). Repères 000 / 090 / 180 / 270. « VERROU OK » (3,12 s)                                                                    |
| 4 · Télémétrie      | 2,60 – 4,10 s | LAT/LON, ville, horloge, « 14 MAILS » (opacité + `x -8 → 0`). Colonne MODULES : MAILS, GITHUB, AGENT, TERMINAL, MÉMOIRE (3,0 – 3,5 s), chaque « • EN LIGNE » 0,15 s après. INIT 000 → 100 % + barre `scaleX 0 → 1` (2,6 – 4,1 s)                                                                                                                                                                             |
| 5 · Titre           | 3,70 – 4,70 s | J A R V I S lettre par lettre : opacité 0 → 0,82 + `y 14 → 0`, décalage 0,08 s. Reflet nacré : bande dégradée masquée par les lettres, `translateX` (4,15 – 4,85 s), puis lettres à 100 %                                                                                                                                                                                                                    |
| 6 · En ligne → Home | 4,60 – 5,60 s | « • Systèmes en ligne » (4,6 s) + annonce unique. 4,9 s : décor en fondu (0,3 s), anneaux boot `opacity 0 + scale 1,06`. 4,95 – 5,45 s : mark `translate(-180, -193) scale 1,5 → 1` et titre `translate(-184, -345)` vers leur slot Home. 5,35 – 5,6 s : fondu de la Home. Fin : focus sur `main#main`                                                                                                       |

**Version courte (1,6 s)** : noyau sans clignotement (0 – 0,2 s), anneaux en rotations croisées groupées (0,05 – 0,8 s), graduations + traînée (0,15 – 0,8 s), équerres (0,2 – 0,6 s), titre (0,5 – 1,05 s), passage vers la Home (1,0 – 1,6 s). Pas de scan, pas de télémétrie.

**Reduced motion (1,2 s)** : aucun mouvement. Le mark statique complet et le titre apparaissent **directement dans leur slot Home** en fondu de 300 ms (`--duration-reduced`), puis la Home arrive en fondu de 300 ms (0,9 – 1,2 s). Pas de clignotement, pas de rotation, pas de Flip.

---

## 4. Éléments et tokens (aucune valeur orpheline)

| Élément                                                                                  | Token(s)                                                                                                                                  | Remarque                                                     |
| ---------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------ |
| Fond                                                                                     | `--color-bg` #0B0B0C                                                                                                                      |                                                              |
| Anneaux r60 / r120 / r138, anneau épais r88                                              | `--color-hud` #3A3A3E                                                                                                                     | 1 px (6 px à 50 % pour r88, comme la maquette)               |
| Graduations, arcs r114, pointillés r70, ticks r160, repères degrés, en-têtes de colonnes | `--color-hud-strong` #55555A                                                                                                              |                                                              |
| Anneau r80, balayage radial                                                              | `--accent-light-faint` rgb(236 234 228 / .12)                                                                                             |                                                              |
| Croix, réticules, barre INIT                                                             | `--accent-light-mid` rgb(236 234 228 / .55)                                                                                               |                                                              |
| Tête de traînée, puces « EN LIGNE », point de statut                                     | `--accent-light-strong` rgb(236 234 228 / .95)                                                                                            |                                                              |
| Halo du noyau                                                                            | dégradé radial 22 % → 0 (repris de `JarvisMark`)                                                                                          |                                                              |
| Anneau segmenté r150                                                                     | **nouveau** `--accent-light-ring` rgb(236 234 228 / .20)                                                                                  | à créer                                                      |
| Voile de la ligne de scan                                                                | **nouveau** `--accent-light-ghost` rgb(236 234 228 / .06)                                                                                 | à créer                                                      |
| Trait de la ligne de scan                                                                | **nouveau** `--accent-light-trace` rgb(236 234 228 / .32)                                                                                 | à créer                                                      |
| Reflet du titre                                                                          | **nouveau** `--accent-light-peak` rgb(255 255 255 / .90)                                                                                  | même blanc que le dégradé du point de la maquette Home       |
| Grain + scanlines                                                                        | **nouveau** `--ambient-opacity: .035`                                                                                                     | une seule couche fixe et statique, sous le texte (z-index 1) |
| Titre                                                                                    | Plex Sans 600, `--text-wordmark-display` 32 px, `--tracking-wordmark` .32em, `--color-text`                                               |                                                              |
| Télémétrie                                                                               | Plex Mono 400, `--text-dial` 12 px, **tracking 0**, `--color-text-muted` / `--color-text`, chiffres tabulaires                            | toujours `aria-hidden`                                       |
| « Systèmes en ligne »                                                                    | Plex Sans 500, `--text-sm` 14 px, `--color-text-muted`                                                                                    | visuel `aria-hidden`, l'annonce passe par la région live     |
| Bouton Passer                                                                            | ghost md : 44 px (`--spacing-touch`), Sans 500 16 px, `--radius-md`, survol `--color-surface-2`, focus 2 px `--color-accent`              | + indice `Échap` en Mono 12 px `aria-hidden`                 |
| Durées                                                                                   | **`--duration-intro-full: 5600ms`** (au lieu de 2900), **`--duration-intro-short: 1600ms`** (au lieu de 800), `--duration-reduced: 300ms` | miroir à mettre à jour dans `lib/intro/timings.ts`           |

**Easings** : `--ease-out-soft` cubic-bezier(0.22, 1, 0.36, 1) pour les entrées (anneaux, lettres, équerres, télémétrie) ; `--ease-in-out-soft` cubic-bezier(0.65, 0, 0.35, 1) pour les déplacements (scan, balayage, traînée, passage vers la Home) ; `none` pour les flashs et les révélations en escalier ; `power1` pour les fondus courts. Dans GSAP : `CustomEase.create("outSoft", "0.22,1,0.36,1")` et `("inOutSoft", "0.65,0,0.35,1")`.

---

## 5. Accessibilité

- **Passer** : ghost md ≥ 44 px, nom accessible « Passer l'intro », premier arrêt Tab, visible de 0 à la fin (et en reduced motion). Échap / Entrée / clic = passer. Fin ou passage : `tl.progress(1)` puis focus sur `main#main` (`tabindex="-1"`).
- **Reduced motion** : aucun mouvement, uniquement deux fondus de 300 ms, mark statique déjà à sa place.
- **WCAG 2.3.1** : 2 flashs du noyau (0,14 s + 0,2 s, ≈ 2,9 Hz < 3) sur une petite surface ; 1 seul flash de verrou (opacité 1 → 0,45 → 1). Aucun flash plein écran ; la ligne de scan est à 6 % / 32 % et ne clignote pas.
- **Décor** : anneaux, télémétrie, repères, équerres, titre animé, « Systèmes en ligne » → `aria-hidden`. Le conteneur reste `role="presentation"`.
- **Une seule annonce** : région `aria-live="polite"` remplie une fois, à l'acte 6 : « JARVIS : systèmes en ligne. » (à aligner avec `StatusAnnouncer`, qui est l'annonceur unique de la Home).
- Textes de télémétrie ≥ 12 px réservés au décor ; le seul texte à lire (Passer) est en 16 px.

---

## 6. Contraintes ADR 0004

Tout passe par **transform** (rotate, scale, translate) et **opacity** :

- « tracé » des anneaux = rotations croisées + scale + opacité ;
- graduations = opacité en escalier ;
- traînée = 108 segments `path` révélés en opacité + tête qui tourne avec le même easing (aucun `stroke-dashoffset`) ;
- scan = `translateY` ; balayage = `rotate` d'un disque en `conic-gradient` statique ;
- reflet du titre = `translateX` d'un `rect` en dégradé, dans un `mask` SVG fait des lettres ;
- barre INIT = `scaleX`. Le compteur INIT change de texte (`textContent`, décor `aria-hidden`), ce n'est pas une propriété animée.
- Aucun filtre, flou ou ombre animé ; aucune largeur animée.

---

## 7. Faisabilité pour PIXEL

- Même architecture qu'aujourd'hui : `createIntroTimeline` → remplacer `buildFullIntroTimeline` par un builder par acte (`animateCoreAct`, `animateRingsAct`, `animateScanAct`, `animateTelemetryAct`, `animateTitleAct`, `animateHandoff`), `blinkCoreTwice` réutilisé tel quel. `buildShortIntroTimeline` et `buildReducedIntroTimeline` gardent leur rôle.
- `SplashHudChrome` : retirer la ligne « wake » (voix) du splash ; réutiliser `HudCornerBracket` pour les équerres et les classes Mono existantes pour la télémétrie (données réelles : `useDeviceLocation`, `useIntroClock`, `useInboxMailCount`).
- Traînée : découper la traînée en N segments (comme `TRAIL_FADE_SEGMENTS` existe déjà pour le masque) ou faire tourner un masque en transform. Supprimer `prepareDrawStroke`.
- Passage vers la Home : brancher l'acte 6 sur le Flip existant (`homeEnterHandoff`) mais en **0,5 s** au lieu de 1,2 s, sinon l'intro dépasse 6 s.
- Coût : ~200 nœuds SVG animés en opacité ou transform, aucun repaint de filtre ; à mesurer à l'étape INP / tâches longues prévue par l'ADR.
- Prototype et rendu reproductibles : `node render.mjs full splash-v1-1440x900.mp4 0.6`.

---

## 8. Points ouverts

1. **Branche** : `messages-to-api` introuvable sur GitHub ; analyse faite sur `feature/api` = `develop`. Confirmer la bonne branche.
2. **Géométrie du mark** : le prototype reprend l'anneau de la maquette Home (viewBox 248 : r60/70/80/88/108/114/120). Le composant `JarvisMark` du code utilise une autre géométrie (viewBox 512 : r140/180/210/232/246). Lequel fait foi ?
3. **ADR 0004** autorise encore `stroke-dashoffset` pour dessiner l'anneau une fois ; le prototype n'en a pas besoin. Proposition : retirer l'exception de l'ADR.
4. **Tracking de la télémétrie** : la consigne dit Mono sans tracking ; la classe `.dial` du code a `--tracking-dial: .18em`. À trancher.
5. **Couleur des statuts** : tout est nacré, sans ambre ni vert. La Home affiche « En ligne » et « Sys nominal » en `--color-success` ; option : une micro-touche verte sur « Systèmes en ligne » seulement. Ma recommandation : rester nacré dans le splash.
6. **Quand jouer la version complète** : au premier lancement du jour, de la session, ou seulement après une mise à jour ? La préférence `none` reste disponible.
7. **Quatre nouveaux tokens** à valider (`--accent-light-ring`, `--accent-light-ghost`, `--accent-light-trace`, `--accent-light-peak`) + `--ambient-opacity`, ainsi que les nouvelles valeurs de `--duration-intro-full` / `--duration-intro-short`.
8. **Données de télémétrie** : réelles (géoloc, horloge, nombre de mails) ou figées pendant l'intro ? Si la géoloc n'est pas encore connue, afficher « GEOLOC · … » comme aujourd'hui.
9. **Clic n'importe où pour passer** (comportement actuel) : à garder ? Toute touche imprimable passe aussi l'intro.
