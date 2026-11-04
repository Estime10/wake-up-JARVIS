import { NextResponse } from "next/server";

/** Réponses JSON API — jamais cachables (mails / repos privés). */
export function jsonNoStore(
  body: unknown,
  init?: { status?: number },
): NextResponse {
  const response = NextResponse.json(body, { status: init?.status ?? 200 });
  response.headers.set("Cache-Control", "no-store");
  return response;
}
