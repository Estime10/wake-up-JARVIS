#!/usr/bin/env bash
# Build E.L.S.A. Apple Silicon et installe dans /Applications (hors repo).
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

export PATH="${HOME}/.cargo/bin:${PATH}"

APPS_DIR="${ELSA_APPS_DIR:-/Applications}"
APP_DEST="${APPS_DIR}/ELSA.app"

echo "== identities codesign =="
# Identité STABLE obligatoire : sans ça, TCC (Automation/Accessibility) est
# piqué au CDHash ad-hoc → chaque rebuild = Now Playing/play morts, sans popup.
if [[ -n "${APPLE_SIGNING_IDENTITY:-}" ]]; then
  SIGN_IDENTITY="$APPLE_SIGNING_IDENTITY"
  echo "APPLE_SIGNING_IDENTITY=$SIGN_IDENTITY"
elif security find-identity -v -p codesigning 2>/dev/null | grep -q "Developer ID Application"; then
  SIGN_IDENTITY="$(security find-identity -v -p codesigning | grep "Developer ID Application" | head -1 | sed -E 's/.*"(.+)"/\1/')"
  echo "Developer ID: $SIGN_IDENTITY"
else
  SIGN_IDENTITY="$("$ROOT/scripts/ensure-elsa-codesign-identity.sh")"
  echo "Identité locale stable: $SIGN_IDENTITY"
fi

if [[ -n "${APPLE_ID:-}" && -n "${APPLE_PASSWORD:-}" && -n "${APPLE_TEAM_ID:-}" ]]; then
  echo "Vars notarization présentes (APPLE_ID / PASSWORD / TEAM_ID)."
else
  echo "Notarization skip — hors scope usage perso."
fi

echo "== clean anciennes copies =="
# Tue les instances + retire l’app installée pour éviter un binaire stale.
pkill -x elsa 2>/dev/null || true
pkill -f "/Applications/ELSA.app" 2>/dev/null || true
rm -rf "${APP_DEST}"
# Bundle précédent dans le cache cargo (évite de réinstaller une vieille copie).
TARGET_DIR_PRE="${CARGO_TARGET_DIR:-$ROOT/src-tauri/target}"
rm -rf "${TARGET_DIR_PRE}/aarch64-apple-darwin/release/bundle/macos/ELSA.app"
rm -rf "${TARGET_DIR_PRE}/release/bundle/macos/ELSA.app"
echo "Anciennes apps retirées."

# --bundles app : le DMG hdiutil casse souvent (« Ressource occupée ») et
# faisait échouer tout le packaging alors que ELSA.app était déjà prêt.
pnpm exec tauri build --target aarch64-apple-darwin --bundles app

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

echo "== MediaRemote helper =="
# Le binaire compilé renvoie souvent vide (MediaRemote) ; `xcrun swift` sur les
# sources fonctionne. On copie le .swift dans Resources.
MR_SWIFT="$ROOT/src-tauri/macos/mediaremote-now-playing.swift"
MR_RES="${APP_DEST}/Contents/Resources/mediaremote-now-playing.swift"
if [[ -f "$MR_SWIFT" ]]; then
  mkdir -p "${APP_DEST}/Contents/Resources"
  cp "$MR_SWIFT" "$MR_RES"
  echo "Helper → $MR_RES"
fi

echo "== codesign stable (TCC survit aux rebuilds) =="
ENTITLEMENTS="$ROOT/src-tauri/Entitlements.plist"
codesign --force --deep --sign "$SIGN_IDENTITY" \
  --identifier "be.devinchat.elsa" \
  --entitlements "$ENTITLEMENTS" \
  --options runtime \
  "$APP_DEST"
codesign -d -r- "$APP_DEST" 2>&1 | head -5
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
