import { PIPER_PROXY_MAX_BYTES } from "@/adapters/piper/piperHttpSchemas";

const DEFAULT_PIPER_URL = "http://127.0.0.1:5000";

type EnvMap = Record<string, string | undefined>;

export function isPiperProxyEnabled(env: EnvMap = process.env): boolean {
  if (env.PIPER_PROXY_ENABLED === "1") {
    return true;
  }
  if (env.PIPER_PROXY_ENABLED === "0") {
    return false;
  }
  return env.NODE_ENV !== "production";
}

export function getPiperUpstreamUrl(env: EnvMap = process.env): string {
  const raw = env.PIPER_HTTP_URL?.trim() || DEFAULT_PIPER_URL;
  let url: URL;
  try {
    url = new URL(raw);
  } catch {
    throw new Error("piper_url_invalid");
  }
  if (url.protocol !== "http:" && url.protocol !== "https:") {
    throw new Error("piper_url_protocol");
  }
  if (url.hostname !== "127.0.0.1" && url.hostname !== "localhost") {
    throw new Error("piper_url_not_loopback");
  }
  return url.origin;
}

export function assertSameOrigin(request: Request): void {
  const origin = request.headers.get("origin");
  const host = request.headers.get("host");
  if (!host) {
    throw new Error("piper_host_missing");
  }
  if (origin) {
    let originUrl: URL;
    try {
      originUrl = new URL(origin);
    } catch {
      throw new Error("piper_origin_invalid");
    }
    if (originUrl.host !== host) {
      throw new Error("piper_origin_mismatch");
    }
  }
}

export function assertBodyByteLength(bytes: number): void {
  if (bytes > PIPER_PROXY_MAX_BYTES) {
    throw new Error("piper_body_too_large");
  }
}
