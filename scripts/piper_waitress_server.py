#!/usr/bin/env python3
"""Serveur TTS Piper en prod locale — Waitress, bind 127.0.0.1 uniquement.

Route unique : POST /synthesize  JSON { "text": "..." } → WAV.
Jamais 0.0.0.0 (ADR 0012 / 0014).
"""

from __future__ import annotations

import argparse
import hashlib
import io
import json
import os
import sys
import wave
from pathlib import Path

from flask import Flask, request
from piper import PiperVoice
from piper.config import SynthesisConfig
from waitress import serve

# sha256 du modèle vendu avec le repo (refuse un binaire altéré).
EXPECTED_MODEL_SHA256 = (
    "641d1ab097da2b81128c076810edb052b385decc8be3381814802a64a73baf99"
)


def _sha256_file(path: Path) -> str:
    digest = hashlib.sha256()
    with path.open("rb") as handle:
        while True:
            chunk = handle.read(1024 * 1024)
            if not chunk:
                break
            digest.update(chunk)
    return digest.hexdigest()


def build_app(model_path: Path) -> Flask:
    actual = _sha256_file(model_path)
    if actual != EXPECTED_MODEL_SHA256:
        raise SystemExit(
            f"sha256 modèle invalide\nattendu={EXPECTED_MODEL_SHA256}\nobtenu={actual}"
        )

    voice = PiperVoice.load(model_path)
    app = Flask("elsa-piper")

    @app.get("/health")
    def health() -> tuple[str, int]:
        return "ok", 200

    @app.post("/synthesize")
    def synthesize() -> bytes:
        try:
            data = json.loads(request.data or b"{}")
        except json.JSONDecodeError as exc:
            raise ValueError("invalid json") from exc
        text = str(data.get("text", "")).strip()
        if not text:
            raise ValueError("No text provided")
        if len(text) > 4096:
            raise ValueError("text too long")

        syn_config = SynthesisConfig()
        with io.BytesIO() as wav_io:
            with wave.open(wav_io, "wb") as wav_file:
                voice.synthesize_wav(text, wav_file, syn_config)
            return wav_io.getvalue()

    return app


def main() -> None:
    root = Path(__file__).resolve().parents[1]
    default_model = root / "models" / "piper" / "fr_FR-siwis-medium.onnx"
    parser = argparse.ArgumentParser(description="E.L.S.A. Piper Waitress (loopback)")
    parser.add_argument(
        "--model",
        type=Path,
        default=Path(os.environ.get("PIPER_MODEL", str(default_model))),
    )
    parser.add_argument(
        "--host",
        default=os.environ.get("PIPER_HTTP_HOST", "127.0.0.1"),
    )
    parser.add_argument(
        "--port",
        type=int,
        default=int(os.environ.get("PIPER_HTTP_PORT", "5911")),
    )
    args = parser.parse_args()

    if args.host not in {"127.0.0.1", "localhost", "::1"}:
        raise SystemExit(f"host interdit (loopback only): {args.host}")
    if not args.model.is_file():
        raise SystemExit(f"modèle introuvable: {args.model}")

    app = build_app(args.model)
    print(f"Piper Waitress sur http://{args.host}:{args.port}", flush=True)
    serve(app, host=args.host, port=args.port, threads=2)


if __name__ == "__main__":
    main()
