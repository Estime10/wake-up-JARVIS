# 0004 — Animations : SVG + CSS + GSAP, Canvas 2D pour la voix, Three.js reporté

- **Statut** : Proposé
- **Date** : 2026-11-01
- **Révisé le 2026-11-01 après relecture PIXEL**
- **Relecteurs** : SKETCH, PIXEL

## Contexte

La direction artistique (SKETCH) demande un anneau holographique, des arcs de cadran, une intro, et une onde qui suit la voix. Il faut que ce soit beau **sans** coûter cher en CPU, sans gêner la saisie, et accessible (reduced motion, pas de flash).

## Décision

- Anneau et cadran en **SVG + CSS**, animés avec **GSAP** (`useGSAP`, `gsap.matchMedia`), **transform et opacity uniquement**.
- Mark de session (`PersistentMark`) : pose initiale via **`useGSAP`** + `gsap.set` (DEV-9) — pas de `useLayoutEffect` GSAP.
- Seule exception validée par SKETCH : `stroke-dashoffset` pour **dessiner l'anneau une fois** dans l'intro.
- Niveau de voix (~30 valeurs/s) : **jamais en state React ni en dépendance de hook** ; une ref + `gsap.quickTo(el, "scale")`.
- Fin de l'intro : **GSAP Flip** (`import { Flip } from "gsap/Flip"`, `gsap.registerPlugin(useGSAP, Flip)`) : `Flip.getState` dans un handler `contextSafe` avant le `setState`, `Flip.from` dans `useGSAP` ; anneau de l'intro et anneau principal avec le même `data-flip-id` ; pas de Flip en reduced motion.
- Pas de `return () => mm.revert()` dans `useGSAP` : il annule déjà `gsap.matchMedia`.
- Onde de voix en **Canvas 2D**, dans sa propre étape.
- **Three.js reporté** à un « mode cinéma » optionnel (V5).
- **Reduced motion obligatoire** : anneau complet et fixe en fondu 300 ms, pas de rotation, pas de zoom, pas de tracé.
- Fenêtre cachée : le navigateur suspend déjà `requestAnimationFrame` (GSAP et Canvas) ; on coupe seulement l'amplitude simulée hors écoute/parole. Au repos, juste une respiration lente.
- Max **3 flashs par seconde** (WCAG 2.3.1) : critère de revue, aucun tween de luminance au-dessus de 3 Hz.

## Options envisagées

1. **SVG + CSS + GSAP + Canvas 2D** — retenu : léger, net à toutes les tailles, GSAP gratuit avec tous ses plugins (Flip pour poser l'anneau).
2. **Tout en CSS** — non : timeline de l'intro et changements d'état difficiles à orchestrer et à interrompre.
3. **Three.js / WebGL dès maintenant** — non : poids, CPU/GPU, accessibilité plus dure ; pas de besoin prouvé.
4. **Lottie / vidéo** — non : moins réactif aux états et au volume, fichiers à produire.

## Conséquences

- **Gain** : rendu fidèle à SKETCH, coût CPU faible, interruption facile (Passer, Échap, frappe).
- **Risque** : animations qui tournent en fond ; texte sur flou animé. Parade : pause hors écran, jamais de texte sur flou animé, mesures INP et tâches longues à l'étape 23.
- **Coût** : une dépendance (`gsap` + `@gsap/react`) ; tests visuels en reduced motion à chaque étape d'animation.
