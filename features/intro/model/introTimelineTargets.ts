export type IntroTimelineTargets = {
  mark: HTMLElement;
  /** Cercle extérieur du logo — se dessine comme un stroke. */
  ringOuter: SVGGeometryElement;
  /** Cadran pointillé (fondu). */
  ringDial: SVGGeometryElement;
  /** Arcs segmentés externes (fondu avec le cadran). */
  ringAccents: SVGGeometryElement[];
  /** Traînée — se dessine jusqu'au point de tête. */
  trail: SVGGeometryElement;
  /** Point de tête (+ halo) — apparaît à l'arrivée de la traînée. */
  head: SVGGElement;
  /** Noyau central. */
  core: SVGGElement;
  /** Réservé — wordmark révélé sur /home uniquement. */
  wordmark: HTMLElement | null;
  /** Icône son (réveil). */
  wakeIcon: SVGSVGElement;
  /** Barres de l'icône son. */
  wakeBars: SVGRectElement[];
  /** Lettres du texte « Réveil détecté… ». */
  wakeChars: HTMLElement[];
};

export type IntroTimelineOptions = {
  mode: "full" | "short";
  reducedMotion: boolean;
  onComplete: () => void;
};
