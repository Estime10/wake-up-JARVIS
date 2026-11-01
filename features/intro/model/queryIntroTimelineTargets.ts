import type { IntroTimelineTargets } from "@/features/intro/model/introTimelineTargets";

/** Résout les cibles DOM de la timeline (mark `data-jarvis` + textes `data-intro`). */
export function queryIntroTimelineTargets(
  root: HTMLElement,
): IntroTimelineTargets | null {
  const mark = root.querySelector<HTMLElement>("[data-intro='mark']");
  const wordmark = root.querySelector<HTMLElement>("[data-intro='wordmark']");
  const greeting = root.querySelector<HTMLElement>("[data-intro='greeting']");

  if (!mark || !wordmark) {
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
  const axis = mark.querySelector<HTMLElement>("[data-intro='axis']");

  if (!ringOuter || !ringDial || !trail || !head || !core || !axis) {
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
    axis,
    wordmark,
    greeting,
  };
}
