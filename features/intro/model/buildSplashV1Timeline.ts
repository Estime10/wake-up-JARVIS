import gsap from "gsap";

import type { GsapTimeline } from "@/lib/gsap/timelineType";
import {
  INTRO_DURATION_FULL_BASE_MS,
  INTRO_DURATION_FULL_MS,
} from "@/lib/intro/timings";

const OUT_SOFT = "cubic-bezier(0.22,1,0.36,1)";
const IN_OUT_SOFT = "cubic-bezier(0.65,0,0.35,1)";
const SVG_ORIGIN = "124 124";

function q<T extends Element>(root: ParentNode, sel: string): T | null {
  return root.querySelector<T>(sel);
}

function qa<T extends Element>(root: ParentNode, sel: string): T[] {
  return [...root.querySelectorAll<T>(sel)];
}

function setHidden(targets: gsap.TweenTarget, extra?: gsap.TweenVars): void {
  gsap.set(targets, { opacity: 0, ...extra });
}

/**
 * Timeline splash v1 — UI = storyboard / vidéo (SVG assemblé).
 * Muet : aucun TTS. Durée 5,6 s.
 */
export function buildSplashV1Timeline(
  root: HTMLElement,
  onComplete: () => void,
): GsapTimeline {
  const tl = gsap.timeline({
    defaults: { ease: OUT_SOFT },
    onComplete,
  });

  // #layer-rig : animé ici (scan/sweep/anneaux). PersistentMark reprend à la fin.
  const core = q(root, "#splash-core");
  const coreHalo = q(root, "#splash-core-halo");
  const sweep = q(root, "#splash-sweep") ?? q(root, "#layer-sweep");
  const scan = q(root, "#splash-scan") ?? q(root, "#layer-scan");
  const title = q(root, "#splash-title");
  const sheenBand = q(root, "#splash-sheen-band");
  const status = q(root, "#splash-status");
  const trail = q(root, "#splash-trail");
  const trailHead = q(root, "#splash-trail-head");
  const ticks = q(root, "#splash-ticks");
  const ringOuter = q(root, "#splash-ring-outer");
  const arcs = q(root, "#splash-arcs-r114");
  const ringR80 = q(root, "#splash-ring-r80");
  const ringR70 = q(root, "#splash-ring-r70-dashed");
  const ringR60 = q(root, "#splash-ring-r60");
  const boot138 = q(root, "#splash-boot-ring-r138");
  const boot150 =
    q(root, "#layer-boot-ring-r150") ?? q(root, "#splash-boot-ring-r150");
  const boot160 =
    q(root, "#layer-boot-graduations-r160") ??
    q(root, "#splash-boot-graduations-r160");
  const crosshair = q(root, "#splash-crosshair");
  const reticles = q(root, "#splash-reticles");
  const corners = q(root, "#splash-corners");
  const degrees = q(root, "#splash-degrees");
  const geo = q(root, "#splash-telemetry-geo");
  const clock = q(root, "#splash-telemetry-clock");
  const modules = q(root, "#splash-telemetry-modules");
  const sequence = q(root, "#splash-telemetry-sequence");
  const initGauge = q(root, "#splash-init-gauge");
  const initBar = q(root, "#splash-init-bar");
  const initPct = q(root, "#splash-init-pct");
  const skip = q(root, "#splash-skip");

  // Les calques layer-sweep / layer-scan sont figés opacity=0 dans l’assemblé (t=4,9 s).
  for (const layerId of ["#layer-sweep", "#layer-scan", "#layer-title-sheen"]) {
    const layer = q(root, layerId);
    if (layer) {
      gsap.set(layer, { opacity: 1 });
    }
  }

  // Passer + télémétrie mock : jamais visibles (sauf INIT).
  setHidden([skip, geo, clock, modules, sequence].filter(Boolean) as Element[]);

  // État initial — pièces mark cachées (scène encore opacity-0 CSS)
  setHidden(
    [
      core,
      sweep,
      scan,
      title,
      status,
      trail,
      trailHead,
      ticks,
      ringOuter,
      arcs,
      ringR80,
      ringR70,
      ringR60,
      boot138,
      boot150,
      boot160,
      crosshair,
      reticles,
      corners,
      degrees,
      initGauge,
    ].filter(Boolean) as Element[],
  );

  if (sheenBand) {
    gsap.set(sheenBand, { x: 0, opacity: 0 });
  }
  if (coreHalo) {
    gsap.set(coreHalo, { scale: 0.6, svgOrigin: SVG_ORIGIN });
  }
  if (initBar) {
    gsap.set(initBar, { scaleX: 0, transformOrigin: "0% 50%" });
  }
  if (initPct) {
    initPct.textContent = "000";
  }

  const trailSegs = trail ? qa<SVGPathElement>(trail, "path[data-i]") : [];
  if (trailSegs.length > 0) {
    gsap.set(trailSegs, { opacity: 0 });
  }
  const tickPaths = ticks ? qa<SVGPathElement>(ticks, "path[data-i]") : [];
  if (tickPaths.length > 0) {
    gsap.set(tickPaths, { opacity: 0 });
  }
  const letters = title
    ? qa<SVGTextElement>(title, "text[id^='splash-letter-']")
    : [];
  if (letters.length > 0) {
    gsap.set(letters, { opacity: 0, y: 14 });
  }
  const cornerParts = corners
    ? qa<SVGGElement>(corners, "g[id^='splash-corner-']")
    : [];
  for (const part of cornerParts) {
    const dx = Number(part.getAttribute("data-dx") ?? "0");
    const dy = Number(part.getAttribute("data-dy") ?? "0");
    gsap.set(part, { opacity: 0, x: dx, y: dy });
  }
  const reticleParts = reticles
    ? qa<SVGGElement>(reticles, "g[id^='splash-reticle-']")
    : [];
  if (reticleParts.length > 0) {
    gsap.set(reticleParts, { scale: 1.25, svgOrigin: SVG_ORIGIN, opacity: 1 });
  }
  const degParts = degrees
    ? qa<SVGGElement>(degrees, "g[id^='splash-deg-']")
    : [];
  if (degParts.length > 0) {
    gsap.set(degParts, { opacity: 0 });
  }
  // Révèle la scène seulement après les gsap.set (évite flash assemblé / double masque).
  const sceneEl = root.querySelector<HTMLElement>("[data-splash-scene]");
  if (sceneEl) {
    sceneEl.setAttribute("data-splash-primed", "1");
  }

  // —— Acte 1 · Noyau ——
  if (core) {
    tl.to(core, { opacity: 0.12, duration: 0.2, ease: "none" }, 0.15);
    if (coreHalo) {
      tl.to(
        coreHalo,
        { scale: 1, duration: 1, ease: OUT_SOFT, svgOrigin: SVG_ORIGIN },
        0.15,
      );
    }
    tl.to(core, { opacity: 1, duration: 0.07, ease: "none" }, 0.4);
    tl.to(core, { opacity: 0.12, duration: 0.07, ease: "none" }, 0.47);
    tl.to(core, { opacity: 1, duration: 0.07, ease: "none" }, 0.74);
    tl.to(core, { opacity: 0.12, duration: 0.07, ease: "none" }, 0.81);
    tl.to(core, { opacity: 1, duration: 0.14, ease: "power1.out" }, 1.08);
  }

  // —— Acte 2 · Anneaux ——
  if (ringR60) {
    gsap.set(ringR60, { rotation: 120, scale: 0.8, svgOrigin: SVG_ORIGIN });
    tl.to(
      ringR60,
      {
        opacity: 1,
        rotation: 0,
        scale: 1,
        duration: 0.9,
        ease: OUT_SOFT,
        svgOrigin: SVG_ORIGIN,
      },
      1.0,
    );
  }
  if (ringR70) {
    gsap.set(ringR70, { rotation: -150, scale: 0.85, svgOrigin: SVG_ORIGIN });
    tl.to(
      ringR70,
      {
        opacity: 1,
        rotation: 0,
        scale: 1,
        duration: 0.95,
        ease: OUT_SOFT,
        svgOrigin: SVG_ORIGIN,
      },
      1.08,
    );
  }
  if (ringR80) {
    gsap.set(ringR80, { rotation: 90, scale: 0.9, svgOrigin: SVG_ORIGIN });
    tl.to(
      ringR80,
      {
        opacity: 1,
        rotation: 0,
        scale: 1,
        duration: 1,
        ease: OUT_SOFT,
        svgOrigin: SVG_ORIGIN,
      },
      1.16,
    );
  }
  if (boot138) {
    gsap.set(boot138, { rotation: 60, svgOrigin: SVG_ORIGIN });
    tl.to(
      boot138,
      {
        opacity: 1,
        rotation: 0,
        duration: 1.1,
        ease: OUT_SOFT,
        svgOrigin: SVG_ORIGIN,
      },
      1.2,
    );
  }
  if (boot150) {
    gsap.set(boot150, { rotation: -140, svgOrigin: SVG_ORIGIN });
    tl.to(
      boot150,
      {
        opacity: 1,
        rotation: 0,
        duration: 1.2,
        ease: OUT_SOFT,
        svgOrigin: SVG_ORIGIN,
      },
      1.3,
    );
    tl.to(
      boot150,
      { rotation: 14, duration: 3.1, ease: "none", svgOrigin: SVG_ORIGIN },
      2.5,
    );
  }
  if (boot160) {
    gsap.set(boot160, { rotation: 45, svgOrigin: SVG_ORIGIN });
    tl.to(
      boot160,
      {
        opacity: 1,
        rotation: 0,
        duration: 1.1,
        ease: OUT_SOFT,
        svgOrigin: SVG_ORIGIN,
      },
      1.4,
    );
    tl.to(
      boot160,
      { rotation: -8, duration: 3.1, ease: "none", svgOrigin: SVG_ORIGIN },
      2.5,
    );
  }
  if (ringOuter) {
    gsap.set(ringOuter, { scale: 0.92, svgOrigin: SVG_ORIGIN });
    tl.to(
      ringOuter,
      {
        opacity: 1,
        scale: 1,
        duration: 0.9,
        ease: OUT_SOFT,
        svgOrigin: SVG_ORIGIN,
      },
      1.3,
    );
  }
  if (arcs) {
    gsap.set(arcs, { rotation: -90, svgOrigin: SVG_ORIGIN });
    tl.to(
      arcs,
      {
        opacity: 1,
        rotation: 0,
        duration: 1,
        ease: OUT_SOFT,
        svgOrigin: SVG_ORIGIN,
      },
      1.35,
    );
  }
  if (tickPaths.length > 0) {
    tl.to(
      tickPaths,
      {
        opacity: 1,
        duration: 0.05,
        stagger: { amount: 0.72, ease: IN_OUT_SOFT },
        ease: "none",
      },
      1.45,
    );
    if (ticks) {
      tl.set(ticks, { opacity: 1 }, 1.45);
    }
  } else if (ticks) {
    tl.to(ticks, { opacity: 1, duration: 0.6 }, 1.45);
  }
  if (trailSegs.length > 0) {
    tl.set(trail, { opacity: 1 }, 1.65);
    tl.to(
      trailSegs,
      {
        opacity: 1,
        duration: 0.08,
        stagger: { amount: 0.75, ease: IN_OUT_SOFT },
        ease: "none",
      },
      1.65,
    );
  } else if (trail) {
    tl.to(trail, { opacity: 1, duration: 0.8, ease: IN_OUT_SOFT }, 1.65);
  }
  if (trailHead) {
    gsap.set(trailHead, { rotation: -195, svgOrigin: SVG_ORIGIN });
    tl.to(
      trailHead,
      {
        opacity: 1,
        rotation: 0,
        duration: 0.83,
        ease: IN_OUT_SOFT,
        svgOrigin: SVG_ORIGIN,
      },
      1.65,
    );
  }

  // —— Acte 3 · Scan (lent : descente puis remontée) & verrou ——
  if (scan) {
    gsap.set(scan, { y: -64, opacity: 1 });
    tl.to(scan, { y: 900, duration: 1.45, ease: IN_OUT_SOFT }, 2.15);
    tl.to(scan, { y: -64, duration: 1.45, ease: IN_OUT_SOFT }, 3.6);
    tl.to(scan, { opacity: 0, duration: 0.25, ease: "power1.out" }, 5.05);
  }
  if (sweep) {
    gsap.set(sweep, { rotation: 0, svgOrigin: SVG_ORIGIN });
    tl.to(sweep, { opacity: 1, duration: 0.2, ease: "none" }, 2.3);
    tl.to(
      sweep,
      {
        rotation: 360,
        duration: 0.9,
        ease: IN_OUT_SOFT,
        svgOrigin: SVG_ORIGIN,
      },
      2.3,
    );
    tl.to(sweep, { opacity: 0, duration: 0.2, ease: "none" }, 3.0);
  }
  if (cornerParts.length > 0) {
    tl.to(
      cornerParts,
      { opacity: 1, x: 0, y: 0, duration: 0.6, ease: OUT_SOFT },
      2.4,
    );
    if (corners) {
      tl.set(corners, { opacity: 1 }, 2.4);
    }
  }
  if (crosshair) {
    gsap.set(crosshair, { scale: 0.9, svgOrigin: SVG_ORIGIN });
    tl.to(
      crosshair,
      {
        opacity: 1,
        scale: 1,
        duration: 0.45,
        ease: OUT_SOFT,
        svgOrigin: SVG_ORIGIN,
      },
      2.5,
    );
  }
  if (reticleParts.length > 0) {
    tl.set(reticles, { opacity: 1 }, 2.55);
    tl.to(
      reticleParts,
      {
        scale: 1,
        duration: 0.5,
        ease: OUT_SOFT,
        svgOrigin: SVG_ORIGIN,
      },
      2.55,
    );
    tl.to(reticles, { opacity: 0.45, duration: 0.07, ease: "none" }, 3.05);
    tl.to(reticles, { opacity: 1, duration: 0.07, ease: "none" }, 3.12);
  }
  if (degParts.length > 0) {
    tl.to(
      degParts,
      { opacity: 1, duration: 0.25, stagger: 0.05, ease: OUT_SOFT },
      2.7,
    );
    if (degrees) {
      tl.set(degrees, { opacity: 1 }, 2.7);
    }
  }

  // —— Acte 4 · INIT uniquement (pas de télémétrie mock) ——
  if (initGauge) {
    tl.to(initGauge, { opacity: 1, x: 0, duration: 0.35, ease: OUT_SOFT }, 2.6);
  }
  if (initBar) {
    tl.to(initBar, { scaleX: 1, duration: 1.5, ease: IN_OUT_SOFT }, 2.6);
  }
  if (initPct) {
    const counter = { v: 0 };
    tl.to(
      counter,
      {
        v: 100,
        duration: 1.5,
        ease: IN_OUT_SOFT,
        onUpdate: () => {
          initPct.textContent = String(Math.round(counter.v)).padStart(3, "0");
        },
      },
      2.6,
    );
  }

  // —— Acte 5 · Titre ——
  letters.forEach((letter, index) => {
    tl.to(
      letter,
      { opacity: 0.82, y: 0, duration: 0.5, ease: OUT_SOFT },
      3.7 + index * 0.08,
    );
    tl.to(
      letter,
      { opacity: 1, duration: 0.25, ease: "power1.out" },
      4.45 + index * 0.05,
    );
  });
  if (title) {
    tl.set(title, { opacity: 1 }, 3.7);
  }
  if (sheenBand) {
    tl.set(sheenBand, { opacity: 1 }, 4.15);
    tl.to(sheenBand, { x: 203.467, duration: 0.7, ease: IN_OUT_SOFT }, 4.15);
  }

  // —— Acte 6 · Status (+ handoff sauf atelier hold) ——
  if (status) {
    gsap.set(status, { y: 6 });
    tl.to(status, { opacity: 1, y: 0, duration: 0.35, ease: OUT_SOFT }, 4.6);
  }

  // Ancre storyboard 5,6 s, puis ralentissement global (+2,5 s → 8,1 s).

  const base = INTRO_DURATION_FULL_BASE_MS / 1000;
  const target = INTRO_DURATION_FULL_MS / 1000;
  if (tl.duration() < base) {
    tl.to({}, { duration: base - tl.duration() }, tl.duration());
  }
  tl.timeScale(base / target);

  return tl;
}

/** Reduced motion : assemblé final en fondu 300 ms. */
export function buildSplashV1ReducedTimeline(
  root: HTMLElement,
  onComplete: () => void,
): GsapTimeline {
  const tl = gsap.timeline({ onComplete });
  const scene = root.querySelector<HTMLElement>("[data-splash-scene]");
  // Cache télémétrie / Passer même en reduced.
  for (const id of [
    "#splash-skip",
    "#splash-telemetry-geo",
    "#splash-telemetry-clock",
    "#splash-telemetry-modules",
    "#splash-telemetry-sequence",
  ]) {
    const node = root.querySelector(id);
    if (node) {
      gsap.set(node, { opacity: 0 });
    }
  }
  if (scene) {
    scene.setAttribute("data-splash-primed", "1");
  }
  gsap.set(scene ?? root, { opacity: 0 });
  tl.to(scene ?? root, { opacity: 1, duration: 0.3, ease: "power1.out" });
  return tl;
}
