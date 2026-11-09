#!/usr/bin/env bash
# Build E.L.S.A. Apple Silicon et installe dans /Applications (hors repo).
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

export PATH="${HOME}/.cargo/bin:${PATH}"

APPS_DIR="${ELSA_APPS_DIR:-/Applications}"
APP_DEST="${APPS_DIR}/ELSA.app"

echo "== identities codesign =="
if ! security find-identity -v -p codesigning | grep -q "Developer ID Application"; then
  echo "AVERTISSEMENT: aucun « Developer ID Application » — build ad-hoc / unsigned."
  echo "Gatekeeper : clic droit → Ouvrir si besoin. Voir docs/runbooks/PACKAGING-macos.md"
fi

if [[ -n "${APPLE_SIGNING_IDENTITY:-}" ]]; then
  echo "APPLE_SIGNING_IDENTITY défini."
else
  echo "APPLE_SIGNING_IDENTITY non défini (signing optionnel)."
fi

if [[ -n "${APPLE_ID:-}" && -n "${APPLE_PASSWORD:-}" && -n "${APPLE_TEAM_ID:-}" ]]; then
  echo "Vars notarization présentes (APPLE_ID / PASSWORD / TEAM_ID)."
else
  echo "Notarization skip — hors scope usage perso."
fi

pnpm tauri:build

# Respecte CARGO_TARGET_DIR (Cursor / CI peuvent le rediriger hors du repo).
TARGET_DIR="${CARGO_TARGET_DIR:-$ROOT/src-tauri/target}"
BUNDLE="${TARGET_DIR}/aarch64-apple-darwin/release/bundle"
APP_SRC="${BUNDLE}/macos/ELSA.app"

echo
echo "== artefacts build =="
ls -la "${BUNDLE}/macos" 2>/dev/null || true
ls -la "${BUNDLE}/dmg" 2>/dev/null || true

if [[ ! -d "$APP_SRC" ]]; then
  echo "ERREUR: ELSA.app introuvable dans ${BUNDLE}/macos" >&2
  exit 1
fi

# Install machine — jamais dans dist/ (hors repo).
echo "== install → ${APP_DEST} =="
mkdir -p "$APPS_DIR"
rm -rf "$APP_DEST"
cp -R "$APP_SRC" "$APP_DEST"
echo "Installé → ${APP_DEST}"

# Ne pas laisser d’artefacts packaging dans le monorepo.
if [[ -d "$ROOT/dist" ]]; then
  rm -rf "$ROOT/dist"
  echo "Nettoyé → dist/ (hors repo)"
fi

# Seed chemin repo pour Studio/Piper depuis le Finder (Application Support).
SUPPORT="${HOME}/Library/Application Support/be.devinchat.elsa"
mkdir -p "$SUPPORT"
printf '%s\n' "$ROOT" > "${SUPPORT}/elsa-root.txt"
echo "elsa-root.txt → ${SUPPORT}/elsa-root.txt"

DMG="${BUNDLE}/dmg/ELSA_0.1.0_aarch64.dmg"
if [[ -f "$DMG" ]]; then
  echo "DMG (hors repo, cache build) → ${DMG}"
fi

echo "Done. Lance ELSA depuis ${APPS_DIR}. Runbook: docs/runbooks/PACKAGING-macos.md"
