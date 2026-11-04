#!/usr/bin/env bash
# Lance Piper HTTP (siwis) en loopback pour JARVIS.
# Usage : depuis la racine du repo → ./scripts/run-piper.sh
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
VENV="$ROOT/.venv-piper"
MODEL_DIR="$ROOT/models/piper"
MODEL="$MODEL_DIR/fr_FR-siwis-medium.onnx"

if [[ ! -x "$VENV/bin/python" ]]; then
  echo "Création du venv Piper…"
  python3 -m venv "$VENV"
  # shellcheck disable=SC1091
  source "$VENV/bin/activate"
  python -m pip install -U pip
  python -m pip install 'piper-tts[http]'
else
  # shellcheck disable=SC1091
  source "$VENV/bin/activate"
fi

if [[ ! -f "$MODEL" ]]; then
  echo "Téléchargement de fr_FR-siwis-medium…"
  mkdir -p "$MODEL_DIR"
  python -m piper.download_voices fr_FR-siwis-medium --download-dir "$MODEL_DIR"
fi

# Port 5911 : éviter 5000 (AirPlay / Control Center sur macOS → 403, repli voix Mac).
PORT="${PIPER_HTTP_PORT:-5911}"
echo "Piper écoute sur http://127.0.0.1:${PORT} (Ctrl+C pour arrêter)"
exec python -m piper.http_server \
  -m "$MODEL" \
  --data-dir "$MODEL_DIR" \
  --host 127.0.0.1 \
  --port "$PORT"
