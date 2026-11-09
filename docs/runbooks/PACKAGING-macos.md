# Runbook — Packaging macOS E.L.S.A. (Tauri v2)

**Cible :** Apple Silicon (`aarch64-apple-darwin`) · id `be.devinchat.elsa`  
**Branche :** `feat/tauri` · plan étape 6

## Décisions V0

| Sujet       | Choix                                                             |
| ----------- | ----------------------------------------------------------------- |
| Artefact    | `.app` installé dans **`/Applications/ELSA.app`** (machine perso) |
| Repo        | **pas** de `dist/` — artefacts hors monorepo                      |
| Signing     | **Hors scope** — pas de Developer ID / notarization (usage perso) |
| Auto-update | **Manuel V0** — relancer `./scripts/package-elsa.sh`              |
| Piper       | **Hors bundle** — runtime Application Support                     |

Cible produit : **un seul Mac** (celui de build).

## Prérequis

1. Xcode CLT + Rust `aarch64-apple-darwin`
2. `pnpm` + deps à jour

## Build + install — **chemin nominal**

```bash
./scripts/package-elsa.sh
# → build Tauri
# → /Applications/ELSA.app
# → seed ~/Library/Application Support/be.devinchat.elsa/elsa-root.txt
# → supprime dist/ s’il existe
```

Override du dossier Apps (rare) : `ELSA_APPS_DIR=~/Applications ./scripts/package-elsa.sh`

Le binaire de build reste sous `CARGO_TARGET_DIR` / `src-tauri/target/…/bundle/` (hors tracking git). Un `.dmg` peut y apparaître — **ne pas** le committer ni le copier dans le repo.

**Note :** `hdiutil` (bundle DMG) nécessite un environnement non sandboxé.

## Build signé + notarié (archivé — hors scope)

Exporter (session shell, pas dans le repo) :

```bash
export APPLE_SIGNING_IDENTITY="Developer ID Application: … (TEAMID)"
export APPLE_ID="…"
export APPLE_PASSWORD="…"   # app-specific
export APPLE_TEAM_ID="…"
pnpm tauri:build
```

Sans notarization : clic droit → Ouvrir (exception Gatekeeper) — **OK perso**.

## Piper sans terminal (runtime Application Support)

Au **premier lancement** (ou premier `voice_speak`), le shell :

1. crée `~/Library/Application Support/be.devinchat.elsa/piper/` ;
2. y écrit le serveur Waitress (embarqué dans le binaire) ;
3. crée un venv Python + `piper-tts` / `waitress` (nécessite `python3` sur le Mac) ;
4. copie le modèle depuis le repo s’il est trouvé, sinon **télécharge** `fr_FR-siwis-medium` (sha256 pinée) ;
5. spawn Waitress sur `127.0.0.1:5911`.

Log : `…/piper/bootstrap.log`  
DX : si `ELSA_ROOT` ou le cwd pointe vers le monorepo avec `.venv-piper` + modèle → réutilise le repo.

**Prérequis machine :** `python3` (Homebrew ou CLT). Réseau au premier bootstrap si le modèle n’est pas déjà local.

## Liens

- Plan : `docs/plans/PLAN-tauri-elsa.md` § étape 6
- Crédits : `CREDITS.md` · `NOTICE` · `/credits`
- ADR 0014 (shell) · ADR 0012 (voix)
