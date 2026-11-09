# Runbook — Packaging macOS E.L.S.A. (Tauri v2)

**Cible :** Apple Silicon (`aarch64-apple-darwin`) · id `be.devinchat.elsa`  
**Branche :** `feat/tauri` · plan étape 6

## Décisions V0

| Sujet             | Choix                                                               |
| ----------------- | ------------------------------------------------------------------- |
| Artefacts         | `.app` + `.dmg` (même machine)                                      |
| Signing           | **Hors scope** — pas de Developer ID / notarization (usage perso)   |
| Auto-update       | **Manuel V0** — pas de `tauri-plugin-updater` ; rebuild / DMG local |
| Piper dans le DMG | **Hors bundle V0** — venv + modèle restent sur la machine (scripts) |

Cible produit : **un seul Mac** (celui de build). Les sections signing/notarization ci-dessous sont optionnelles / archivées.

## Prérequis

1. Xcode CLT + Rust `aarch64-apple-darwin`
2. `pnpm` + deps à jour

## Build local (unsigned / ad-hoc) — **chemin nominal**

```bash
./scripts/package-elsa.sh
# → dist/macos/ELSA.app
# → dist/macos/ELSA_0.1.0_aarch64.dmg
```

(`pnpm tauri:build` seul suffit ; le script copie aussi vers `dist/macos/` car `CARGO_TARGET_DIR` peut être hors repo.)

**Note :** la création DMG nécessite `hdiutil` hors sandbox restreint (device). Sur cette machine : build OK (~5 Mo DMG).

## Build signé + notarié

Exporter (session shell, pas dans le repo) :

```bash
export APPLE_SIGNING_IDENTITY="Developer ID Application: … (TEAMID)"
export APPLE_ID="…"
export APPLE_PASSWORD="…"   # app-specific
export APPLE_TEAM_ID="…"
# optionnel si plusieurs providers :
# export APPLE_PROVIDER_SHORT_NAME="…"
```

Puis :

```bash
pnpm tauri:build
```

Tauri lit l’identité via `bundle.macOS.signingIdentity` (env `APPLE_SIGNING_IDENTITY` si conf = null / omise selon CLI) et notarize si les vars Apple sont présentes.

**Vérifs :**

```bash
codesign -dv --verbose=4 "src-tauri/target/aarch64-apple-darwin/release/bundle/macos/ELSA.app"
spctl -a -vv "…/ELSA.app"
```

## Install hors machine de build

1. Copier le **DMG notarié** (AirDrop / disque / lien privé).
2. Ouvrir → glisser **ELSA** dans Applications.
3. Premier lancement : Piper (`pnpm voice:piper:prod` ou spawn shell si venv+modèle présents).

Sans notarization : clic droit → Ouvrir (exception Gatekeeper) — **OK perso**, pas pour un tiers.

## Piper sans terminal (runtime Application Support)

Au **premier lancement** (ou premier `voice_speak`), le shell :

1. crée `~/Library/Application Support/be.devinchat.elsa/piper/` ;
2. y écrit le serveur Waitress (embarqué dans le binaire) ;
3. crée un venv Python + `piper-tts` / `waitress` (nécessite `python3` sur le Mac) ;
4. copie le modèle depuis le repo s’il est trouvé, sinon **télécharge** `fr_FR-siwis-medium` (sha256 pinée) ;
5. spawn Waitress sur `127.0.0.1:5911`.

Log : `…/piper/bootstrap.log`  
DX : si `ELSA_ROOT` ou le cwd pointe vers le monorepo avec `.venv-piper` + modèle → réutilise le repo (pas de second venv).

**Prérequis machine :** `python3` (Homebrew ou CLT). Réseau au premier bootstrap si le modèle n’est pas déjà local.

## Liens

- Plan : `docs/plans/PLAN-tauri-elsa.md` § étape 6
- Crédits : `CREDITS.md` · `NOTICE` · `/credits`
- ADR 0014 (shell) · ADR 0012 (voix)
