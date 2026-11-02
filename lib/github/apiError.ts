import { NextResponse } from "next/server";

import type { GithubTokenLoad } from "@/lib/github/connectionToken";

export function githubTokenErrorResponse(
  load: Extract<GithubTokenLoad, { ok: false }>,
): NextResponse {
  const map = {
    auth: 401,
    missing: 404,
    needs_reauth: 401,
    vault: 500,
    config: 503,
  } as const;
  return NextResponse.json(
    { ok: false, error: load.reason },
    { status: map[load.reason] },
  );
}

export function githubUpstreamErrorResponse(
  reason: "unauthorized" | "forbidden" | "not_found" | "upstream",
): NextResponse {
  const status =
    reason === "unauthorized"
      ? 401
      : reason === "forbidden"
        ? 403
        : reason === "not_found"
          ? 404
          : 502;
  return NextResponse.json({ ok: false, error: reason }, { status });
}
