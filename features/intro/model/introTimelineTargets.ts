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
  /** Axe horizontal CAL / ligne / AZ — descend après la séquence. */
  axis: HTMLElement;
  wordmark: HTMLElement;
  greeting: HTMLElement | null;
};

export type IntroTimelineOptions = {
  mode: "full" | "short";
  reducedMotion: boolean;
  onComplete: () => void;
};
