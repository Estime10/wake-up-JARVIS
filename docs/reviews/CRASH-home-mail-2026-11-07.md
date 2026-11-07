# CRASH TEST — home → mails → disconnect

- **Date** : 2026-11-07T19:26Z
- **SHA candidat** : `93ba7fd` (+ spec e2e locale)
- **Commande** : `PLAYWRIGHT_PORT=3001 pnpm exec playwright test e2e/home-mail-flow.spec.ts --project=chromium`
- **Serveur** : `next start` prod sur `:3001` (évite HMR `pnpm dev` qui bloque le boot)

## Parcours

1. Auth admin (OWNER_EMAILS + service role → cookies `tokens-only`)
2. `/home` — boot reduced-motion → composer prêt
3. « liste mes mails » → réponse titres (50 mails)
4. « Ouvrir les mails » → **retirer** une boîte → compte décrémenté

## Résultat

```
✓  [chromium] › e2e/home-mail-flow.spec.ts › accueil → home → liste mails → retirer boîte (4.8s)
1 passed (15.2s)
```

Log : `/tmp/elsa-crash-e2e13.log`

## Effet de bord

Une boîte Gmail a été **retirée** (preuve disconnect). À reconnecter via OAuth si besoin (`+ compte`).

## Verdict CRASH

**PASS**
