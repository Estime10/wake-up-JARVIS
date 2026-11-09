# 0014 — Shell macOS Tauri v2 pour E.L.S.A.

- **Statut** : Proposé
- **Niveau** : 2
- **Date** : 2026-11-09
- **Relecteurs** : ARCHITECT, HACKER, THE JUDGE, PIXEL
- **Liés** : [0005](./0005-cible-macos.md) · [0009](./0009-capabilities-tauri.md) · [0012](./0012-voix-de-jarvis.md) · [0013](./0013-supabase-platform-studio-embarque.md)

## Contexte

La prod web (Vercel) est GO ; les limites navigateur (iframe Studio/browser, Piper loopback, agent Mac) exigent un **shell desktop**. Plan : `docs/plans/PLAN-tauri-elsa.md`.

## Décision

- **Runtime** : Tauri **v2**, cible **`aarch64-apple-darwin`** uniquement (ADR 0005).
- **UI V0** : WebView principal charge **l’URL prod** `https://wake-up-jarvis.vercel.app` en release ; **`http://127.0.0.1:3000`** en DX (`tauri:dev` + `next dev`).
- **Bridge** : commandes Rust **nommées** + validation args ; capabilities ADR **0009**. Pas de `fetch('http://127.0.0.1')` depuis l’origine https.
- **Studio** : child WKWebView `elsa-studio` positionné sur le frame DOM (plein panneau droite) ; proxy `:54332` = **web only**. `studio_ensure` → Docker Desktop + `supabase start` sur le Mac (repo via `ELSA_ROOT` / cache Application Support) — zéro terminal utilisateur.
- **Navigateur libre** : **abandonné** (anti-frame) — pas de WebView `elsa-browser`.
- **Terminal interactif (user)** : **vrai `/bin/zsh -l`** via PTY (`portable-pty` + xterm) — cwd `$HOME`. Pas l’agent LLM ; l’agent ordres signés reste ADR **0006** (gate HACKER). Risque : UI distante peut `invoke` le PTY → capabilities bornées + une session à la fois.
- **Voix shell** : `invoke` → Rust → Piper **`127.0.0.1:5911`** ; repli `speechSynthesis` si Piper down (aligné ADR 0012). Cycle de vie process Piper = responsabilité du shell (DX : script repo OK).
- **Packaging V0** : artefacts `.app` + `.dmg` **machine perso** ; **pas** de Developer ID / notarization (décision 2026-11-09) ; **pas** d’auto-update (`createUpdaterArtifacts: false`). Runbook : `docs/runbooks/PACKAGING-macos.md`.
- **Piper autonome** : runtime sous Application Support (`…/be.devinchat.elsa/piper/`) — bootstrap venv + modèle (sha256) au lancement, **sans terminal**. Repo `.venv-piper` = DX seulement.

## Options envisagées

1. **URL prod + bridge allowlist** — retenu.
2. **Static export Next dans le bundle** — écarté (App Router + API).
3. **Electron** — écarté (poids, surface, ADR stack).

## Conséquences

- **Gain** : un build UI ; Studio/voix natifs sans open-proxy.
- **Risque** : auth/cookies WKWebView ; bundle Piper ~60 Mo ; confusion web vs shell → `isTauri()` + ports.
- **Coût** : crate `src-tauri/`, permissions, sidecars/scripts Piper ; packaging local sans distribution Apple.
- **Updater** : reporter `tauri-plugin-updater` tant que la distribution reste perso / 1–2 Macs.
