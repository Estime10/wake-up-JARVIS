/**
 * Refuse les POST cross-origin quand Origin est présent.
 * SameSite=Lax reste la base ; ceci renforce les routes à effets locaux.
 */
export function assertSameOrigin(request: Request): void {
  const origin = request.headers.get("origin");
  const host = request.headers.get("host");
  if (!host) {
    throw new Error("host_missing");
  }
  if (!origin) {
    return;
  }
  let originUrl: URL;
  try {
    originUrl = new URL(origin);
  } catch {
    throw new Error("origin_invalid");
  }
  if (originUrl.host !== host) {
    throw new Error("origin_mismatch");
  }
}
