import type { IntroTimelineTargets } from "@/features/intro/model/introTimelineTargets";

/** Résout les cibles DOM splash — mark + wake. */
export function queryIntroTimelineTargets(
  root: HTMLElement,
  /** Mark persistant (hors scope splash) — fourni par ref. */
  mark: HTMLElement | null,
): IntroTimelineTargets | null {
  const wakeIcon = root.querySelector<SVGSVGElement>(
    "[data-intro='wake-icon']",
  );

  if (!mark || !wakeIcon) {
    return null;
  }

  const ringOuter = mark.querySelector<SVGGeometryElement>(
    "[data-jarvis='ring-outer']",
  );
  const ringDial = mark.querySelector<SVGGeometryElement>(
    "[data-jarvis='ring-dial']",
  );
  const ringAccents = [
    ...mark.querySelectorAll<SVGGeometryElement>(
      "[data-jarvis='ring-accent'], [data-jarvis='ring-accent-inner']",
    ),
  ];
  const trail = mark.querySelector<SVGGeometryElement>("[data-jarvis='trail']");
  const head = mark.querySelector<SVGGElement>("[data-jarvis='head']");
  const core = mark.querySelector<SVGGElement>("[data-jarvis='core']");
  const wakeBars = [
    ...wakeIcon.querySelectorAll<SVGRectElement>("[data-intro='wake-bar']"),
  ];
  const wakeChars = [
    ...root.querySelectorAll<HTMLElement>("[data-intro='wake-char']"),
  ];

  if (!ringOuter || !ringDial || !trail || !head || !core) {
    return null;
  }

  return {
    mark,
    ringOuter,
    ringDial,
    ringAccents,
    trail,
    head,
    core,
    wordmark: null,
    wakeIcon,
    wakeBars,
    wakeChars,
  };
}
