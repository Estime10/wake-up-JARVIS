# CRASH TEST — home → mails → disconnect

- **Date** : 2026-11-07
- **SHA candidat** : `b21c984`
- **Spec** : `e2e/home-mail-flow.spec.ts`

## Parcours prévu

1. Accueil / login
2. `/home`
3. Composer : « liste mes mails »
4. Bouton déconnecter / révoquer boîte (si compte présent)

## Exécution

| Condition                    | Statut                                       |
| ---------------------------- | -------------------------------------------- |
| Spec Playwright ajoutée      | ✅                                           |
| `E2E_EMAIL` / `E2E_PASSWORD` | ❌ absents dans l’environnement agent        |
| Run authentifié              | **SKIP** (`test.skip` si pas de credentials) |

## Preuve partielle

- Spec skippe explicitement sans secrets (pas de faux vert).
- Pour clore §10 checklist : lancer localement  
  `E2E_EMAIL=… E2E_PASSWORD=… pnpm e2e e2e/home-mail-flow.spec.ts`  
  après `pnpm build && pnpm start` (selon `playwright.config`).

## Verdict CRASH

**INCOMPLET** — instrumentation OK ; preuve runtime authentifiée à fournir par DevinChat / machine avec comptes.
