"use client";

import { useEffect, useRef, useState, type RefObject } from "react";

type SplashV1SceneProps = {
  /** Conteneur scope GSAP (ref parent). */
  hostRef: RefObject<HTMLDivElement | null>;
  onSvgReady: () => void;
};

const ASSEMBLED_SRC = "/motion/splash/elements/splash-assembled.svg";

/** Cache module — évite refetch + flash au remount Strict Mode. */
let svgCache: string | null = null;

function prepareSvgMarkup(text: string): string {
  const start = text.indexOf("<svg");
  const end = text.lastIndexOf("</svg>");
  if (start < 0 || end < 0) {
    throw new Error("splash_svg_shape");
  }
  let svg = text.slice(start, end + "</svg>".length);
  if (!svg.includes("preserveAspectRatio")) {
    svg = svg.replace("<svg ", '<svg preserveAspectRatio="xMidYMid slice" ');
  }
  return svg;
}

/**
 * Scène splash v1 — SVG assemblé.
 * Invisible jusqu’au prime GSAP (`data-splash-primed`) : l’assemblé est figé
 * à t=4,9 s ; sans ça on voit un flash (souvent « deux fois le masque »).
 */
export function SplashV1Scene({ hostRef, onSvgReady }: SplashV1SceneProps) {
  const [markup, setMarkup] = useState<string | null>(() => svgCache);
  const readyOnce = useRef(false);

  useEffect(() => {
    if (svgCache) {
      return undefined;
    }
    let cancelled = false;
    void fetch(ASSEMBLED_SRC)
      .then((response) => {
        if (!response.ok) {
          throw new Error(`splash_svg_${response.status}`);
        }
        return response.text();
      })
      .then((text) => {
        if (cancelled) {
          return;
        }
        const svg = prepareSvgMarkup(text);
        svgCache = svg;
        setMarkup(svg);
      })
      .catch(() => {
        if (!cancelled) {
          setMarkup(null);
        }
      });
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!markup || readyOnce.current) {
      return;
    }
    readyOnce.current = true;
    let inner = 0;
    const outer = window.requestAnimationFrame(() => {
      inner = window.requestAnimationFrame(() => {
        onSvgReady();
      });
    });
    return () => {
      window.cancelAnimationFrame(outer);
      window.cancelAnimationFrame(inner);
      // Strict Mode : autoriser un nouveau ready sur le remount.
      readyOnce.current = false;
    };
  }, [markup, onSvgReady]);

  return (
    <div
      ref={hostRef}
      className="fixed inset-0 z-50 overflow-hidden bg-bg text-accent"
      role="presentation"
    >
      {markup ? (
        <div
          data-splash-scene
          className="absolute inset-0 flex items-center justify-center opacity-0 [&_svg]:h-full [&_svg]:w-full [&_svg]:max-w-none data-[splash-primed=1]:opacity-100"
          // Asset local contrôlé (SKETCH) — pas de HTML utilisateur.
          // eslint-disable-next-line react/no-danger -- SVG splash assemblé versionné, pas d’entrée user.
          dangerouslySetInnerHTML={{ __html: markup }}
        />
      ) : (
        <div className="absolute inset-0 bg-bg" aria-hidden />
      )}
      <p className="sr-only" aria-live="polite">
        JARVIS : démarrage des systèmes.
      </p>
    </div>
  );
}
