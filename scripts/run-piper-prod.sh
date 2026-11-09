#!/usr/bin/env bash
# Piper prod locale (Waitress) — loopback only. Usage : ./scripts/run-piper-prod.sh
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
VENV="$ROOT/.venv-piper"
MODEL_DIR="$ROOT/models/piper"
MODEL="$MODEL_DIR/fr_FR-siwis-medium.onnx"
EXPECTED_SHA="641d1ab097da2b81128c076810edb052b385decc8be3381814802a64a73baf99"

if [[ ! -x "$VENV/bin/python" ]]; then
  echo "Création du venv Piper…"
  python3 -m venv "$VENV"
  # shellcheck disable=SC1091
  source "$VENV/bin/activate"
  python -m pip install -U pip
  python -m pip install 'piper-tts[http]' waitress
else
  # shellcheck disable=SC1091
  source "$VENV/bin/activate"
  python -m pip install -q waitress
fi

if [[ ! -f "$MODEL" ]]; then
  echo "Téléchargement de fr_FR-siwis-medium…"
  mkdir -p "$MODEL_DIR"
  python -m piper.download_voices fr_FR-siwis-medium --download-dir "$MODEL_DIR"
fi

ACTUAL_SHA="$(shasum -a 256 "$MODEL" | awk '{print $1}')"
if [[ "$ACTUAL_SHA" != "$EXPECTED_SHA" ]]; then
  echo "sha256 modèle invalide:" >&2
  echo "  attendu=$EXPECTED_SHA" >&2
  echo "  obtenu=$ACTUAL_SHA" >&2
  exit 3
fi

PORT="${PIPER_HTTP_PORT:-5911}"
export PIPER_HTTP_HOST="127.0.0.1"
export PIPER_HTTP_PORT="$PORT"
export PIPER_MODEL="$MODEL"

echo "Piper Waitress sur http://127.0.0.1:${PORT}"
exec python "$ROOT/scripts/piper_waitress_server.py" --model "$MODEL" --host 127.0.0.1 --port "$PORT"
