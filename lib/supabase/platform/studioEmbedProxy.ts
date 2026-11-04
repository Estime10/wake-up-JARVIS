import "server-only";

import { createServer, request as httpRequest, type Server } from "node:http";

/** Port du reverse-proxy CSP-strip → Studio (:54323). */
const STUDIO_EMBED_PORT = 54332;
const STUDIO_EMBED_URL = `http://127.0.0.1:${STUDIO_EMBED_PORT}/project/default`;

const STUDIO_UPSTREAM_PORT = 54323;

type StudioEmbedGlobal = typeof globalThis & {
  __jarvisStudioEmbedProxy?: Server;
};

function stripFrameHeaders(
  headers: NodeJS.Dict<string | string[] | undefined>,
): Record<string, string | string[] | undefined> {
  const next: Record<string, string | string[] | undefined> = { ...headers };
  delete next["content-security-policy"];
  delete next["content-security-policy-report-only"];
  delete next["x-frame-options"];
  return next;
}

function createProxyServer(): Server {
  return createServer((req, res) => {
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
          stripFrameHeaders(proxyRes.headers),
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
 * Reverse-proxy local : Studio reste sur :54323, l’iframe charge :54332
 * sans `frame-ancestors` / `X-Frame-Options`.
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
      // Port déjà pris (HMR / autre worker) → on suppose le proxy OK.
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
