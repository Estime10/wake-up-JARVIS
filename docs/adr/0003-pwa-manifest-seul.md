# 0003 — PWA via `app/manifest.ts` seul, sans service worker pour l'instant

- **Statut** : Proposé
- **Date** : 2026-11-01
- **Révisé le 2026-11-01 après relecture PIXEL**
- **Relecteurs** : PIXEL

## Contexte

DevinChat veut pouvoir **installer** E.L.S.A. comme une app sur son Mac. La phase UI n'a pas besoin de cache hors ligne : toutes les données sont simulées. L'état « hors ligne » de l'UI doit quand même exister.

## Décision

On utilise le **manifeste natif de Next.js** (`app/manifest.ts`, avec `id: "/"` et `lang: "fr"`) + des icônes 192 et 512 (`purpose: "any"`), une **icône maskable 512 distincte** (`purpose: "maskable"`) et `app/apple-icon.png` (180 px) pour Safari. **Pas de service worker** dans la phase UI. L'état hors ligne vient des événements navigateur `online` / `offline`.

## Options envisagées

1. **`app/manifest.ts` seul** — retenu : intégré à Next, zéro dépendance ; le guide officiel Next.js indique que l'installation peut se déclencher **sans support hors ligne**.
2. **Serwist** — reporté : `@serwist/next` est documenté d'abord pour webpack ; avec Turbopack (défaut de Next 16) il faut `@serwist/turbopack`. Dépendance + config + `sw.ts` pour un cache dont on n'a pas besoin. À réévaluer en V0b pour une vraie page hors ligne.
3. **Service worker écrit à la main** — non : facile à mal faire (cache périmé), aucun besoin prouvé.
4. **Hook `useOffline` de Next** — non : expérimental.

## Conséquences

- **Gain** : simple, rien à maintenir, pas de bug de cache.
- **Risque** : installabilité sans service worker **non vérifiée** sur Safari macOS réel (« Ajouter au Dock ») ni pour l'invite d'installation de Chrome : à confirmer à l'étape 21 (critère : DevTools → Application → Manifest sans erreur, puis « Installer » ouvre une fenêtre E.L.S.A.) ; pas de démarrage hors ligne.
- **Coût** : aucun maintenant ; ajouter Serwist plus tard demandera de revoir la CSP (`worker-src`).
