# THE JUDGE — revue partielle intents IV2 + CI (2026-11-07)

- **SHA candidat (pré-merge)** : working tree sur `main` + correctifs IV2-03/06/07 (à merger)
- **Base audit** : `dbde1b8` (CI verte Node 24)
- **Verdict partiel** : **APPROVED WITH RECOMMENDATIONS** sur le périmètre intents/CI/protection — **pas un GO release** tant que §5–7 / dump / CRASH e2e complet ne sont pas prouvés

## Approuvé

- CI : actions Node 24 + `ubuntu-24.04` ; checks verts sur `dbde1b8`
- Protection `main` : status check `lint · typecheck · test · build` + PR reviews (0 approvals, `enforce_admins: false`)
- H2 code : `shouldPersistAssistantReply` pour `mail.*`
- IV2-03 : `isUnsafePathCapture` sur slots `folder`/`file`
- IV2-06 : `assertReadOnlyPatScopes` sur connect GitHub
- IV2-07 : strip `\p{Cf}` (ex. U+200B) avant match corbeille
- Libellé overview : liste titres, plus « résumé de contenu »

## Recommandations / ouvert

1. Dump prod + repair migrations + purge 53 assistant — **bloqués** sans `SUPABASE_DB_PASSWORD` (CLI 403)
2. pgTAP local : ré-exécuter après `db reset` (fonction `set_status` doit contenir `mail_account_needs_reauth`)
3. CRASH TEST Playwright : uniquement `e2e/csp.spec.ts` aujourd’hui — élargir parcours home/mail
4. `enforce_admins: true` une fois le flux PR rodée
5. HACKER : revalider IV2-03/06/07 sur le SHA final
