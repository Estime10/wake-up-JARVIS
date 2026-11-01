# Maquettes front v3 « blanc nacré » — JARVIS (mobile + planche de composants)

Alignées sur [README.md](./README.md) (v3-blanc, validée). Le cyan a complètement disparu. UI seule, données simulées.
Captures Playwright (`playwright-core` + Chrome système), `deviceScaleFactor: 2`.
Les anciens `front-*` (v1 cyan) sont remplacés et ne sont pas dans le dépôt.

> **Dans le dépôt** (`docs/design/v3/`) : seuls les 3 PNG et ce fichier sont copiés. Les sources `src-front/` (HTML, `jarvis-v3.css`, `build.py`, polices) restent hors dépôt, dans les maquettes de SKETCH.

## Fichiers

| Fichier                                                                   | Contenu                                                                                                                                                                                                               | PNG         |
| ------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------- |
| `front-hud-mobile-390x844.png`                                            | HUD mobile au repos : en-tête (JARVIS · « Prêt » · heure), cadre en équerre, « Système OK », anneau `idle` (traînée + point de tête), cartes Météo / Agenda, journal, champ de saisie (verre) + micro clair 60 px     | 780 × 1688  |
| `front-hud-mobile-390x844-listening.png`                                  | Écoute : « Micro actif » (texte + icône) dans l'en-tête **et** en bas, ligne fixe « Coupure auto après 15 s de silence », bouton « Couper le micro » 52 px, anneau `listening`, transcription en direct dans le champ | 780 × 1688  |
| `front-components-board.png`                                              | Planche 1440 px : tokens, typographie (5 rôles), anneau 6 états, boutons (5 variantes × 4 états), cartes (info, métrique, attention, erreur, signature avec payload v1 en JSON JCS), journal (info / warn / error)    | 2880 × 6516 |
| `src-front/build.py` _(hors dépôt)_                                       | Génère les 3 pages (géométrie SVG calculée)                                                                                                                                                                           | —           |
| `src-front/*.html`, `jarvis-v3.css`, `fonts.css`, `fonts/` _(hors dépôt)_ | Sources statiques + IBM Plex en local (woff2)                                                                                                                                                                         | —           |

Pour recapturer (dans le dossier des maquettes de SKETCH, hors dépôt) : `python3 src-front/build.py`, puis le script de capture de PIXEL (hors dépôt).

## Règles de sécurité appliquées (consigne du 01/11, 00:43)

1. **L'ambre `#F5B84A` est réservé à la signature Touch ID.** **Changement par rapport à l'écran 03 de la designer** : `thinking` n'est plus ambre. Il passe en **nacré**, avec des segments discontinus en traînée, une icône sablier et le libellé « Réfléchit… ». Le niveau **`warn`** du journal et la carte « Attention » n'utilisent pas d'ambre : on a un **losange avec point d'exclamation**, le texte « warn » ou « Attention », un **contour pointillé nacré** pour le badge et une barre nacrée à gauche pour la carte. L'ambre n'apparaît que sur la carte « Signature Touch ID » (et sur sa pastille de couleur dans les tokens).
2. **En écoute**, un indicateur « Micro actif » (icône micro + texte) reste affiché en permanence dans l'en-tête (`role="status"`, **seul statut annoncé**) et en bas, à côté du bouton. Le bloc du bas (« Micro actif / Rien ne part sans toi » + « Coupure auto après 15 s de silence ») est en `aria-hidden="true"` : c'est un rappel visuel, pas une seconde annonce. Le bouton **« Couper le micro »** est visible, avec un libellé texte et `aria-pressed="true"`. Sur la planche, la cellule `listening` montre aussi les deux.
3. **SVG statiques** : aucun `<script>`, aucun attribut `on*`, aucune `<image>`/`<img>`, aucune URL `http(s)`. Les seuls `url()` sont des références internes (`#gradient`) et les polices locales `fonts/*.woff2`. Vérifié par grep sur les sources (0 occurrence). Le grain de la designer (image SVG en `data:` URI) n'est pas repris dans ce board ; dans le vrai front, il deviendra une petite image statique servie par le site (étape 2, scannée par HACKER avant copie).

## Coupure auto du micro (écoute)

- Sous « Micro actif / Rien ne part sans toi », une ligne **fixe** : « Coupure auto après 15 s de silence ». Texte statique, `#9A9A97` (6,97:1 sur le fond), 14 px, aligné sur le texte de l'indicateur.
- **Pas de compte à rebours** ni d'animation : la ligne ne change pas pendant l'écoute.
- Marquée `aria-hidden="true"` avec l'indicateur du bas. Le bouton « Couper le micro » reste hors de la zone masquée, donc accessible.

## Payload de signature v1 (carte « Signature Touch ID »)

L'exemple montre une **action de niveau 2/3** : `git push`, irréversible vers le dépôt distant. Une lecture comme `git status` ne passe jamais par la signature, donc elle n'est pas montrée ici.

Le payload final est affiché **en JSON brut sérialisé JCS** (RFC 8785 : clés triées, sans espace), en Plex Mono 14 px, **sans troncature**, avec retour à la ligne n'importe où (`white-space:pre-wrap; word-break:break-all; overflow-wrap:anywhere`). Le bloc porte `dir="ltr"` dans le HTML. Champs :

| Clé          | Type                                            | Exemple (fictif)                          |
| ------------ | ----------------------------------------------- | ----------------------------------------- |
| `action`     | chaîne                                          | `"git.push"`                              |
| `argv`       | tableau de chaînes, exécutable en chemin absolu | `["/usr/bin/git","push","origin","main"]` |
| `cwd`        | chemin absolu                                   | `"/Users/demo/projects/wake-up-jarvis"`   |
| `expires_at` | date ISO 8601 UTC                               | `"2026-11-01T00:52:00Z"`                  |
| `machine_id` | chaîne                                          | `"mac-01"`                                |
| `nonce`      | 22 caractères base64url (128 bits)              | `"Xk3vQ9pL2mT7wR4yZ8nB1c"`                |
| `order_id`   | chaîne                                          | `"ord_0001"`                              |
| `params`     | objet (clés triées aussi)                       | `{"branch":"main","remote":"origin"}`     |
| `v`          | entier, version du format                       | `1`                                       |

Exemple affiché (JCS exact, vérifié octet par octet contre le texte rendu) :

`{"action":"git.push","argv":["/usr/bin/git","push","origin","main"],"cwd":"/Users/demo/projects/wake-up-jarvis","expires_at":"2026-11-01T00:52:00Z","machine_id":"mac-01","nonce":"Xk3vQ9pL2mT7wR4yZ8nB1c","order_id":"ord_0001","params":{"branch":"main","remote":"origin"},"v":1}`

Règles d'affichage (fonctions `payload_html` / `_str_html` de `build.py`). Le classement est fait **caractère par caractère avec `unicodedata`**, sans compter sur JCS : JCS n'échappe que `"`, `\` et U+0000–U+001F, donc U+007F (DEL) et les C1 U+0080–U+009F arrivent bruts.

- **Toujours rendus dans une petite case** (Plex Mono 14 px, texte `#E8E8E6`, contour pointillé `#9A9A97`, fond surface-2 `#1C1C1F`, **jamais d'ambre**) :
  - `"`, `\` et U+0000–U+001F : leur **échappement JCS** en case (`\"`, `\\`, `\n`, `\t`, `\u0007`…). Un retour à la ligne dans une valeur apparaît donc comme `\n` dans une case ;
  - toute autre **catégorie `Cc`** (U+007F DEL, C1 U+0080–U+009F comme U+0085) : case `U+XXXX` ;
  - toute **catégorie `Cf`** (format, dont les bidi comme U+202E et U+200B) : case `U+XXXX` ;
  - dans `argv` et `cwd`, **tout autre caractère hors ASCII imprimable** : case `U+XXXX`.
- **Légende de la carte** (texte de SKETCH, repris exactement ; Plex Sans 14 px, `#9A9A97`, « U+XXXX » rendu en case) :
  « Texte exact qui sera signé. Les cases U+XXXX signalent un caractère invisible, de contrôle ou non ASCII. Si tu en vois une que tu n'attendais pas, annule. »
- L'exemple ne contient aucun de ces cas. Les coupures dans le bloc sont seulement visuelles.
- Ambre uniquement sur la carte (liseré, en-tête). Le payload est en texte `#E8E8E6` sur un fond assombri.
- Ce même format s'applique partout où un payload de signature est montré. Dans ce dossier, seule cette carte en montre un.
- **À prouver par CRASH TEST** : un paramètre contenant chacun des caractères suivants doit être rendu dans sa case, sans effet sur l'affichage du payload (pas d'inversion, pas de saut de ligne, rien d'invisible) : `U+202E` (RIGHT-TO-LEFT OVERRIDE), `U+200B` (ZERO WIDTH SPACE), `U+007F` (DEL), `U+0085` (NEXT LINE, C1). Le rendu de ces 4 cas a été vérifié hors maquette sur une entrée de test, mais la preuve sur l'app réelle reste à faire.

## Décisions validées par SKETCH

- **« Réfléchit… » en nacré** (segments discontinus + sablier), plus d'ambre.
- **Grain + scanlines (décision SKETCH, 01/11/2026)** : un seul calque fixe et statique, `aria-hidden`, `pointer-events: none`, les deux effets ensemble ≤ 4 % d'opacité, rien sur le texte, rien ne change en reduced motion. Le board n'affiche que les scanlines ; le grain arrive à l'étape 2 en image statique servie par le site, jamais en `data:`.
- **« Micro actif » permanent** en écoute (en-tête + bas), avec « Couper le micro » visible.
- **Micro principal rond de 60 px**, clair, hors du champ.
- **Bouton Envoyer bordé**, cible ≥ 44 px (44 × 44).

## Tokens et contrastes (WCAG 2.x, calculés)

Exigences : 4,5:1 pour le texte, 3:1 pour l'interface et le focus.

| Premier plan                                                                | bg `#0B0B0C`              | surface `#141416` | surface-2 `#1C1C1F` | verre 85 % (`#131314`) | Rôle                             |
| --------------------------------------------------------------------------- | ------------------------- | ----------------- | ------------------- | ---------------------- | -------------------------------- |
| text `#E8E8E6`                                                              | 16,04                     | 15,00             | 13,86               | 15,13                  | texte ✅                         |
| text-muted `#9A9A97`                                                        | 6,97                      | 6,52              | 6,03                | 6,58                   | texte secondaire, offline ✅     |
| accent nacré `#ECEAE4`                                                      | 16,35                     | 15,29             | 14,13               | 15,43                  | focus, icônes d'état, traînée ✅ |
| line `#6A6A6E`                                                              | 3,65                      | 3,42              | **3,16**            | 3,45                   | bordures de contrôles ✅ (3:1)   |
| attention `#F5B84A`                                                         | 11,09                     | 10,37             | 9,58                | 10,47                  | **signature uniquement** ✅      |
| danger `#FF6B6B`                                                            | 7,09                      | 6,63              | 6,13                | 6,69                   | erreur ✅                        |
| success `#5EE3A1`                                                           | 12,16                     | 11,37             | 10,51               | 11,48                  | « Système OK », réussite ✅      |
| light-mid (0,55 → `#878683`)                                                | 5,40                      | 5,05              | 4,67                | 5,10                   | pointes de segments (décor)      |
| hud `#3A3A3E` / hud-strong `#55555A` / line-subtle `#2A2A2D` / faint (0,12) | 1,74 / 2,65 / 1,37 / 1,30 | —                 | —                   | —                      | **décor uniquement**             |

Fonds teintés :

| Fond                                              | text  | muted | couleur sémantique | line `#6A6A6E` |
| ------------------------------------------------- | ----- | ----- | ------------------ | -------------- |
| tint-danger `#3C272A` (14 % rouge sur surface-2)  | 11,29 | 4,91  | danger 4,99 ✅     | 2,57 ❌        |
| tint-attention `#2F281C` (12 % ambre sur surface) | 11,88 | 5,16  | ambre 8,21 ✅      | 2,71 ❌        |
| tint-neutral `#28282B` (6 % nacré sur surface-2)  | 11,98 | 5,21  | nacré 12,22 ✅     | 2,73 ❌        |

Comme `line` passe sous 3:1 sur ces fonds teintés, les boutons secondaires des cartes teintées ont un bord `#9A9A97` (4,91 à 5,21:1).

Texte des boutons pleins (choix fait selon le calcul) :

| Fond du bouton                        | texte sombre `#0B0B0C` | texte clair `#E8E8E6` | Choix         |
| ------------------------------------- | ---------------------- | --------------------- | ------------- |
| clair, haut `#F1EFEA` / bas `#CFCCC5` | 17,12 / **12,27**      | 1,07 / 1,31           | **sombre** ✅ |
| clair survol, `#FFFFFF` → `#DEDBD4`   | 19,67 / 14,23          | 1,23 / 1,13           | **sombre** ✅ |
| danger `#FF6B6B`                      | **7,09**               | 2,26                  | **sombre** ✅ |
| danger survol `#FF8A8A`               | 8,67                   | 1,85                  | **sombre** ✅ |

- Focus : contour `#ECEAE4` plein de 2 px, décalé de 2 px, soit 16,35:1 sur le fond.
- Bouton clair contre le fond : 12,27:1, au-dessus de 3:1 pour l'interface.
- Disabled : texte `#9A9A97` à 6,97:1, bord pointillé `hud-strong` décoratif, `aria-disabled`.
- Accent et texte : 1,02:1. Comme le dit la designer, l'accent ne porte donc jamais seul une information. Il se reconnaît à la forme (traînée, point de tête, barres) et au halo.

Lueurs : `--glow` 6 px à 0,18 et `--glow-strong` 14 px à 0,22, en blanc. Elles ne s'appliquent qu'aux traits et au bouton clair, jamais au texte. Scanlines statiques à 3 %.

## Typographie

Décision SKETCH du 01/11 (le titre JARVIS plaît à DevinChat) : le style du wordmark s'étend aux textes courts, dans la même famille IBM Plex. Tokens dans `jarvis-v3.css` (`:root`) et classes partagées `.t-wordmark`, `.t-title`, `.t-label`, `.t-body`, `.t-mono`. Aucune valeur de tracking en dur dans les pages : seulement `var(--tracking-*)`.

| Rôle             | Classe                             | Police                              | Casse                        | Tracking (token)             | Taille                                                         | Éléments                                                                                                                                                                                                                                                                                                                                                                                                                                                                      |
| ---------------- | ---------------------------------- | ----------------------------------- | ---------------------------- | ---------------------------- | -------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Wordmark         | `.t-wordmark`                      | Plex Sans 600                       | uppercase CSS (sigle JARVIS) | `--tracking-wordmark: .32em` | 18 px (mobile), 32 px (planche)                                | `.wordmark` de l'en-tête, `.wm` du titre de planche                                                                                                                                                                                                                                                                                                                                                                                                                           |
| Titre            | `.t-title`                         | Plex Sans 600                       | **uppercase CSS**            | `--tracking-title: .16em`    | 14 px (en-têtes de carte) · 22 px (sections) · 32 px (planche) | titre de planche, `h2` de section, `.card-head` (Bruxelles, Demain, Info · Météo, Métrique · Latence, Alerte · Attention, Alerte · Erreur, Signature Touch ID), « Journal »                                                                                                                                                                                                                                                                                                   |
| Libellé          | `.t-label`                         | Plex Sans 500                       | **uppercase CSS**            | `--tracking-label: .12em`    | 14 · 16 px                                                     | tous les `.btn` (Envoyer, Réessayer, Annuler, Supprimer, Plus tard, Couper le micro), statut d'en-tête (« Prêt », « Micro actif »), « Système OK », « OK » de la carte métrique, libellés d'anneau (Prêt, Écoute…, Réfléchit…, Parle…, Erreur, Hors ligne), `.chip` « Micro actif », « Transcription en cours… », indicateur « Micro actif » du bas, en-tête « Payload signé · v1 · JSON JCS », noms des tokens, noms de variantes de bouton, en-têtes de colonnes du journal |
| Texte courant    | `.t-body` (défaut du `body`)       | Plex Sans 400                       | casse normale                | aucun (`normal`)             | 14 · 16 px                                                     | réponses et phrases des cartes, aides (« Dis « Jarvis »… »), messages du journal, champ de saisie, « Rien ne part sans toi », « Coupure auto… », sous-titres et légendes, **dont la légende de la carte Signature Touch ID**                                                                                                                                                                                                                                                  |
| Mono             | `.t-mono`, `.mono`, `code`, `time` | Plex Mono 400 / 500, `tabular-nums` | **jamais d'uppercase**       | **aucun** (`normal`)         | 14 px                                                          | payload signé JCS et cases `U+XXXX` / `\n`, heures, horloge, compteur « 3 / 24 », sources (SYS, ACT, LLM, VOX), badges de niveau (info / warn / error), codes hexadécimaux, noms d'état (`idle`…), en-têtes d'états de bouton                                                                                                                                                                                                                                                 |
| Chiffre de carte | — (inchangé)                       | Plex Sans 500, tabular-nums         | —                            | aucun                        | 28 px                                                          | « 8 °C », « 182 ms »                                                                                                                                                                                                                                                                                                                                                                                                                                                          |

Règles :

- **Les capitales viennent toujours de CSS** (`text-transform: uppercase`). Le HTML garde la casse normale (« Couper le micro », « Journal »…), donc un lecteur d'écran lit des mots et non des sigles épelés. Seuls les vrais sigles sont saisis en capitales (JARVIS, JCS, JSON, ASCII, ID, OK, U+XXXX, sources du journal). Les libellés de cadran sont maintenant saisis en minuscules (« vox · veille ») et mis en capitales par `.dial`.
- **Mono sans tracking ni uppercase** (règle sécurité HACKER : l/1 et O/0 doivent rester distincts). Une règle de garde dans `jarvis-v3.css` (`.mono, code, kbd, samp, time, .inv, .lvl { letter-spacing: normal; text-transform: none }`) empêche le Mono d'hériter du tracking d'un titre ou d'un libellé parent. Le payload est rendu à l'identique du JCS (vérifié au caractère près), `letter-spacing: normal`.
- Le tracking élargit les libellés : le bouton « Couper le micro » de l'écoute mobile passe à 14 px (padding 12 px, gap icône 6 px, 209 → 197 px) pour tenir à côté de « Rien ne part sans toi » sur une seule ligne dans 358 px ; même libellé 14 px que sur la planche. Hauteur 52 px inchangée.
- Taille minimale : **14 px**, sauf `.dial`.

**`.dial` (exception tranchée par SKETCH le 01/11)** : décor seul, Plex Mono 12 px, capitales CSS, tracking 0,18 em, **toujours `aria-hidden="true"`** (l'info est déjà portée par le statut sous l'anneau et par le titre). Classe dédiée, hors de la règle de garde Mono. Le zéro espacement reste obligatoire pour les commandes, les chemins et la carte de signature.

Contrôle automatique à la capture (`shoot-v3.mjs`) : polices Plex chargées (`document.fonts.check` + `document.fonts`), aucun débordement ni boîte qui sort de son parent, aucun libellé court qui passe sur deux lignes (sauf l'en-tête du payload, coupé volontairement avant « · JSON JCS » par une espace insécable), seul `.dial` sous 14 px, aucun élément Mono avec tracking ou uppercase hors `.dial`. Cibles : Envoyer 44 × 44, micro 60 × 60, boutons de planche 44 px de haut.

## Anneau vocal : la couleur n'est jamais le seul repère

| État      | Libellé    | Icône        | Forme                                                       | Couleur                  |
| --------- | ---------- | ------------ | ----------------------------------------------------------- | ------------------------ |
| idle      | Prêt       | point        | traînée continue 0,12 → 0,95 + point de tête, point central | nacré                    |
| listening | Écoute…    | micro        | 72 segments radiaux (forts à la base, moyens aux pointes)   | nacré                    |
| thinking  | Réfléchit… | sablier      | 16 segments discontinus en traînée                          | **nacré (plus d'ambre)** |
| speaking  | Parle…     | haut-parleur | barres verticales au centre (moyen → fort → moyen)          | nacré                    |
| error     | Erreur     | triangle     | anneau plein figé + 4 repères                               | rouge                    |
| offline   | Hors ligne | nuage barré  | anneau en pointillés, sans lueur ni traînée                 | gris `#9A9A97`           |

## Faisabilité par composant

- **VoiceRing (SVG + GSAP)** : un seul `<svg viewBox="0 0 248 248">` statique, en `aria-hidden`. L'état est dit par `RingStatusLabel`.
  - Traînée : 150 petits arcs dont l'opacité monte selon t^1.6, plus un point de tête. C'est la méthode de la designer, car SVG n'a pas de dégradé conique. On les précalcule une fois au build ou dans un `useMemo`.
  - Graduations : un seul `<path>`. Bande et cercles pointillés : `<circle>` avec `stroke-dasharray`.
  - Animations GSAP en **transform/opacity seulement** :
    - `idle` : rotation lente du groupe de la traînée, ou respiration en `scale` / `opacity` (4 s) ;
    - `thinking` : `rotation: 360` du groupe de segments (2,4 s, `transformOrigin: 50% 50%`) ;
    - `listening` : `scaleY` des 72 segments, piloté par le niveau simulé ;
    - `speaking` : `scaleY` des barres centrales (ou Canvas 2D `VoiceWave`) ;
    - `error` et `offline` : aucune animation.
  - `prefers-reduced-motion` : via `gsap.matchMedia()`, anneau fixe, fondu de 300 ms, barres figées à un niveau moyen.
- **Indicateur « Micro actif » et bouton « Couper le micro »** (HTML/CSS) :
  - l'indicateur de l'en-tête est un `role="status"` affiché tant que l'état vaut `listening`, sans animation (rien ne clignote) ; celui du bas et la ligne « Coupure auto après 15 s de silence » sont `aria-hidden="true"` et statiques ;
  - le bouton est un `<button aria-pressed="true">` avec un libellé texte. Il envoie `STOP_LISTEN`.
- **Micro principal** : `<button aria-pressed>` de 60 px, fond `--btn-light`, icône `#0B0B0C`. En écoute, il est remplacé par « Couper le micro ».
- **Boutons** (CSS pur) :
  - `:hover` : dégradé clair plus lumineux, ou bord `#9A9A97` avec fond surface-2 ;
  - `:focus-visible` : outline nacré de 2 px ;
  - indisponible : `aria-disabled` ;
  - transitions de 150 ms sur la couleur ou le fond seulement.
- **Cartes** (CSS pur) : surface-2 sans bordure, comme les entrées du Journal de la designer.
  - Variantes : `warn` (fond tint-neutral + barre nacrée en `box-shadow inset`), `err` (tint-danger + liseré rouge), `sign` (tint-attention + liseré ambre).
  - La sparkline est une `<polyline>` SVG avec un `linearGradient` de 0,12 à 0,95.
  - Apparition : GSAP `opacity` + `y` en 250 ms, coupée en reduced motion.
- **Ligne du journal** (CSS grid) : heure en Mono tabular-nums, source, badge de niveau (texte + icône : info = cercle i, warn = losange + pointillé, error = cercle barré rouge), message, durée. Le conteneur est en `role="log"`.
- **Fond** : un pseudo-élément statique (vignette radiale + scanlines à 3 %), `pointer-events: none`.
- **Coins en équerre** : 8 `linear-gradient` en `background` en `hud-strong`, sans DOM supplémentaire.

## Écarts avec les écrans de la designer

- `thinking` passe de l'ambre au nacré, avec des segments au lieu de l'anneau ambre (règle « ambre = signature »). Il faudra aussi mettre à jour son écran 03.
- `warn` et la carte « Attention » n'ont pas d'ambre : le repère est le losange avec pointillé nacré.
- Grain : absent du board seulement ; gardé dans le vrai front (étape 2), en image statique servie par le site, jamais en `data:`.
- Mobile seulement, sans panneau Journal/Mails à onglets : le journal est une carte compacte (heure HH:MM, source, message tronqué).
- « Micro actif » en écoute : la designer ne l'affiche que dans un texte d'aide sous le champ. Ici, c'est un statut permanent avec un bouton « Couper le micro » visible.
- Micro principal mobile : bouton clair rond de 60 px hors du champ, alors que la designer l'intègre dans le champ en bouton bordé. Le bouton Envoyer devient bordé pour garder un seul bouton clair principal.

## Limites

- Images statiques : le survol et le focus sont simulés par des classes, et les animations sont seulement décrites.
- Les segments d'écoute et les barres de parole sont des instantanés générés par calcul.
- Les contrastes sont calculés sur des aplats. Un contrôle axe sur l'app réelle reste à faire.
