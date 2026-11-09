# Runbook — Packaging macOS E.L.S.A. (Tauri v2)

**Cible :** Apple Silicon (`aarch64-apple-darwin`) · id `be.devinchat.elsa`  
**Branche :** `feat/tauri` · plan étape 6

## Décisions V0

| Sujet             | Choix                                                                |
| ----------------- | -------------------------------------------------------------------- |
| Artefacts         | `.app` + `.dmg` (user-level : glisser vers `/Applications`)          |
| Signing           | **Developer ID Application** (compte DevinChat) + notarization Apple |
| Auto-update       | **Manuel V0** — pas de `tauri-plugin-updater` ; réinstaller le DMG   |
| Piper dans le DMG | **Hors bundle V0** — venv + modèle restent sur la machine (scripts)  |

Réévaluer l’updater quand il y aura ≥ 2 Macs à tenir à jour ou une release semi-publique.

## Prérequis

1. Xcode CLT + Rust `aarch64-apple-darwin`
2. Certificat **Developer ID Application** dans le trousseau :
   ```bash
   security find-identity -v -p codesigning
   ```
3. App-specific password Apple ID (notarization) — **jamais** committer
4. `pnpm` + deps à jour

## Build local (unsigned / ad-hoc)

Utile sur la machine de build ; Gatekeeper bloquera sur un autre Mac.

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

## Ce qui n’est pas dans le `.app` (V0)

- `.venv-piper/`
- `models/piper/fr_FR-siwis-medium.onnx` (~60 Mo, sha256 pinée)

→ installer via scripts repo ou parcours DX documenté. Bundling sidecar = itération ultérieure.

## Liens

- Plan : `docs/plans/PLAN-tauri-elsa.md` § étape 6
- Crédits : `CREDITS.md` · `NOTICE` · `/credits`
- ADR 0014 (shell) · ADR 0012 (voix)
