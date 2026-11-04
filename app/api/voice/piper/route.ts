import { NextResponse, type NextRequest } from "next/server";

import {
  PIPER_PROXY_MAX_BYTES,
  piperSynthesizeBodySchema,
} from "@/adapters/piper/piperHttpSchemas";
import {
  assertBodyByteLength,
  assertSameOrigin,
  isPiperProxyEnabled,
  proxyPiperSynthesize,
} from "@/adapters/piper/piperProxy";
import { ownerAccessDeniedResponse } from "@/lib/auth/ownerAccessResponse";
import { requireOwnerAccess } from "@/lib/auth/requireOwnerAccess";
import { createLogger } from "@/lib/logger";

export const runtime = "nodejs";

const log = createLogger("voice.piper.proxy");

/**
 * Proxy TTS Piper — same-origin + owner (ADR 0008 / DEV-17).
 * Désactivé en production sauf `PIPER_PROXY_ENABLED=1`.
 * Upstream loopback uniquement (jamais 0.0.0.0).
 */
export async function POST(request: NextRequest) {
  if (!isPiperProxyEnabled()) {
    return NextResponse.json({ error: "disabled" }, { status: 503 });
  }

  try {
    assertSameOrigin(request);
  } catch {
    return NextResponse.json({ error: "origin" }, { status: 403 });
  }

  const access = await requireOwnerAccess();
  if (!access.ok) {
    return ownerAccessDeniedResponse(access);
  }

  const raw = await request.arrayBuffer();
  try {
    assertBodyByteLength(raw.byteLength);
  } catch {
    return NextResponse.json({ error: "payload" }, { status: 413 });
  }

  let json: unknown;
  try {
    json = JSON.parse(new TextDecoder().decode(raw)) as unknown;
  } catch {
    return NextResponse.json({ error: "json" }, { status: 400 });
  }

  const parsed = piperSynthesizeBodySchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: "shape" }, { status: 400 });
  }

  // Double plafond contenu texte (schéma Zod) vs octets corps.
  if (parsed.data.text.length > PIPER_PROXY_MAX_BYTES) {
    return NextResponse.json({ error: "payload" }, { status: 413 });
  }

  try {
    const wav = await proxyPiperSynthesize(parsed.data.text, request.signal);
    return new NextResponse(wav, {
      status: 200,
      headers: {
        "Content-Type": "audio/wav",
        "Cache-Control": "no-store",
      },
    });
  } catch (error) {
    log.error("upstream", {
      reason: error instanceof Error ? error.message : "unknown",
    });
    return NextResponse.json({ error: "upstream" }, { status: 502 });
  }
}
