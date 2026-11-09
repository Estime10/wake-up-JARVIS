/** Géométrie SVG de l’anneau vocal — mark v2 (viewBox 248). */

export const RING_CX = 124;
export const RING_CY = 124;
/** Origine GSAP (spin cadran / modes). */
export const MARK_SVG_ORIGIN = `${RING_CX} ${RING_CY}`;

/** Anneaux d'état figés (erreur / hors ligne) — rayon traînée idle. */
export const STATUS_RING_RADIUS = 80;
/** Hors ligne : tirets gris (longueur trait / vide, unités viewBox). */
export const OFFLINE_RING_DASH = "3 9";
/** Erreur : triangle d'alerte centré + point d'exclamation. */
export const ERROR_TRIANGLE_D = "M124 90L156 145H92Z";
export const ERROR_EXCLAMATION_D = "M124 110v18M124 138v1";

export const LISTEN_SPOKE_COUNT = 72;
export const THINK_SEGMENT_COUNT = 16;
export const SPEAK_BAR_COUNT = 11;

const LISTEN_INNER = 57;
const LISTEN_LENGTH = 35;
const THINK_RADIUS = 81;
const THINK_ARC_DEG = 12;
const SPEAK_BAR_MAX = 43;

export type ListenSpoke = {
  key: string;
  transform: string;
  x: number;
  y: number;
  width: number;
  height: number;
};

export type ThinkSegment = {
  key: string;
  d: string;
  opacity: number;
};

export type SpeakBar = {
  key: string;
  x: number;
  y: number;
  width: number;
  height: number;
};

/** 72 segments radiaux — base au centre, pointe vers l’extérieur. */
export function buildListenSpokes(): readonly ListenSpoke[] {
  const spokes: ListenSpoke[] = [];
  for (let i = 0; i < LISTEN_SPOKE_COUNT; i += 1) {
    const deg = (i / LISTEN_SPOKE_COUNT) * 360;
    spokes.push({
      key: `ls-${i}`,
      transform: `rotate(${deg} ${RING_CX} ${RING_CY})`,
      x: RING_CX - 0.75,
      y: RING_CY - LISTEN_INNER - LISTEN_LENGTH,
      width: 1.5,
      height: LISTEN_LENGTH,
    });
  }
  return spokes;
}

function polar(
  cx: number,
  cy: number,
  r: number,
  deg: number,
): [number, number] {
  const rad = ((deg - 90) * Math.PI) / 180;
  return [cx + Math.cos(rad) * r, cy + Math.sin(rad) * r];
}

/** 16 arcs discontinus — traînée thinking. */
export function buildThinkSegments(): readonly ThinkSegment[] {
  const step = 360 / THINK_SEGMENT_COUNT;
  const segments: ThinkSegment[] = [];
  for (let i = 0; i < THINK_SEGMENT_COUNT; i += 1) {
    const start = i * step + 4;
    const end = start + THINK_ARC_DEG;
    const [x1, y1] = polar(RING_CX, RING_CY, THINK_RADIUS, start);
    const [x2, y2] = polar(RING_CX, RING_CY, THINK_RADIUS, end);
    const t = (i + 1) / THINK_SEGMENT_COUNT;
    const opacity = 0.18 + Math.pow(t, 1.6) * 0.77;
    segments.push({
      key: `th-${i}`,
      d: `M${x1.toFixed(1)} ${y1.toFixed(1)}A${THINK_RADIUS} ${THINK_RADIUS} 0 0 1 ${x2.toFixed(1)} ${y2.toFixed(1)}`,
      opacity,
    });
  }
  return segments;
}

/** Barres verticales centrales — parole. */
export function buildSpeakBars(): readonly SpeakBar[] {
  const gap = 5;
  const width = 2.5;
  const total = SPEAK_BAR_COUNT * width + (SPEAK_BAR_COUNT - 1) * gap;
  const startX = RING_CX - total / 2;
  const mid = (SPEAK_BAR_COUNT - 1) / 2;
  const bars: SpeakBar[] = [];

  for (let i = 0; i < SPEAK_BAR_COUNT; i += 1) {
    const dist = Math.abs(i - mid) / mid;
    const height = SPEAK_BAR_MAX * (0.35 + (1 - dist) * 0.65);
    bars.push({
      key: `sb-${i}`,
      x: startX + i * (width + gap),
      y: RING_CY - height / 2,
      width,
      height,
    });
  }
  return bars;
}

export const LISTEN_SPOKES = buildListenSpokes();
export const THINK_SEGMENTS = buildThinkSegments();
export const SPEAK_BARS = buildSpeakBars();
