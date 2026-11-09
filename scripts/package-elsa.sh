#!/usr/bin/env bash
# Build .app + .dmg Apple Silicon pour E.L.S.A.
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

export PATH="${HOME}/.cargo/bin:${PATH}"

echo "== identities codesign =="
if ! security find-identity -v -p codesigning | grep -q "Developer ID Application"; then
  echo "AVERTISSEMENT: aucun « Developer ID Application » — build ad-hoc / unsigned."
  echo "Gatekeeper bloquera l’install sur un autre Mac. Voir docs/runbooks/PACKAGING-macos.md"
fi

if [[ -n "${APPLE_SIGNING_IDENTITY:-}" ]]; then
  echo "APPLE_SIGNING_IDENTITY défini."
else
  echo "APPLE_SIGNING_IDENTITY non défini (signing optionnel)."
fi

if [[ -n "${APPLE_ID:-}" && -n "${APPLE_PASSWORD:-}" && -n "${APPLE_TEAM_ID:-}" ]]; then
  echo "Vars notarization présentes (APPLE_ID / PASSWORD / TEAM_ID)."
else
  echo "Notarization skip — exporter APPLE_ID, APPLE_PASSWORD, APPLE_TEAM_ID pour notarier."
fi

pnpm tauri:build

# Respecte CARGO_TARGET_DIR (Cursor / CI peuvent le rediriger hors du repo).
TARGET_DIR="${CARGO_TARGET_DIR:-$ROOT/src-tauri/target}"
BUNDLE="${TARGET_DIR}/aarch64-apple-darwin/release/bundle"
OUT="$ROOT/dist/macos"
mkdir -p "$OUT"

echo
echo "== artefacts =="
ls -la "${BUNDLE}/macos" 2>/dev/null || true
ls -la "${BUNDLE}/dmg" 2>/dev/null || true

if [[ -d "${BUNDLE}/macos/ELSA.app" ]]; then
  rm -rf "${OUT}/ELSA.app"
  cp -R "${BUNDLE}/macos/ELSA.app" "${OUT}/ELSA.app"
  echo "Copié → dist/macos/ELSA.app"
fi
if [[ -f "${BUNDLE}/dmg/ELSA_0.1.0_aarch64.dmg" ]]; then
  cp -f "${BUNDLE}/dmg/ELSA_0.1.0_aarch64.dmg" "${OUT}/"
  echo "Copié → dist/macos/ELSA_0.1.0_aarch64.dmg"
fi

echo "Done. Runbook: docs/runbooks/PACKAGING-macos.md"
