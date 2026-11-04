import "server-only";

import { createServer, request as httpRequest, type Server } from "node:http";

/** Port du reverse-proxy → Studio (:54323). */
const STUDIO_EMBED_PORT = 54332;
const STUDIO_EMBED_URL = `http://127.0.0.1:${STUDIO_EMBED_PORT}/project/default`;

const STUDIO_UPSTREAM_PORT = 54323;

const ALLOWED_HOSTS = new Set([
  `127.0.0.1:${STUDIO_EMBED_PORT}`,
  `localhost:${STUDIO_EMBED_PORT}`,
]);

type StudioEmbedGlobal = typeof globalThis & {
  __jarvisStudioEmbedProxy?: Server;
};

function isAllowedHost(hostHeader: string | undefined): boolean {
  if (!hostHeader) {
    return false;
  }
  const host = hostHeader.split(",")[0]?.trim().toLowerCase() ?? "";
  return ALLOWED_HOSTS.has(host);
}

/**
 * Réécrit les headers anti-frame : on n’autorise que l’origine de l’app
 * (localhost:3000 / 127.0.0.1:3000) — pas de suppression totale (DEV-3).
 */
function rewriteFrameHeaders(
  headers: NodeJS.Dict<string | string[] | undefined>,
): Record<string, string | string[] | undefined> {
  const next: Record<string, string | string[] | undefined> = { ...headers };
  delete next["x-frame-options"];
  delete next["content-security-policy-report-only"];
  next["content-security-policy"] =
    "frame-ancestors http://127.0.0.1:3000 http://localhost:3000";
  return next;
}

function createProxyServer(): Server {
  return createServer((req, res) => {
    if (!isAllowedHost(req.headers.host)) {
      res.writeHead(403, { "Content-Type": "text/plain; charset=utf-8" });
      res.end("Forbidden host");
      return;
    }

    const proxyReq = httpRequest(
      {
        hostname: "127.0.0.1",
        port: STUDIO_UPSTREAM_PORT,
        path: req.url,
        method: req.method,
        headers: {
          ...req.headers,
          host: `127.0.0.1:${STUDIO_UPSTREAM_PORT}`,
        },
      },
      (proxyRes) => {
        res.writeHead(
          proxyRes.statusCode ?? 502,
          rewriteFrameHeaders(proxyRes.headers),
        );
        proxyRes.pipe(res);
      },
    );

    proxyReq.on("error", () => {
      if (!res.headersSent) {
        res.writeHead(502, { "Content-Type": "text/plain; charset=utf-8" });
      }
      res.end("Studio upstream unavailable");
    });

    req.pipe(proxyReq);
  });
}

/**
 * Reverse-proxy local : Studio :54323 → iframe :54332.
 * Host allowlist + frame-ancestors bornés (DEV-3).
 * Écoute 127.0.0.1 uniquement — process Next (dev / ALLOW_LOCAL_STUDIO).
 */
export async function ensureStudioEmbedProxy(): Promise<{
  ok: true;
  embedUrl: string;
}> {
  const g = globalThis as StudioEmbedGlobal;
  if (g.__jarvisStudioEmbedProxy) {
    return { ok: true, embedUrl: STUDIO_EMBED_URL };
  }

  const server = createProxyServer();

  await new Promise<void>((resolve, reject) => {
    const onListening = () => {
      cleanup();
      resolve();
    };
    const onError = (error: NodeJS.ErrnoException) => {
      cleanup();
      if (error.code === "EADDRINUSE") {
        resolve();
        return;
      }
      reject(error);
    };
    const cleanup = () => {
      server.off("listening", onListening);
      server.off("error", onError);
    };
    server.once("listening", onListening);
    server.once("error", onError);
    server.listen(STUDIO_EMBED_PORT, "127.0.0.1");
  });

  g.__jarvisStudioEmbedProxy = server;
  return { ok: true, embedUrl: STUDIO_EMBED_URL };
}
