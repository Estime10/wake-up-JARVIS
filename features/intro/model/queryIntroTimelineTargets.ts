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
  const trail = mark.querySelector<SVGGeometryElement>("[data-jarvis='trail']");
  const head = mark.querySelector<SVGGElement>("[data-jarvis='head']");
  const core = mark.querySelector<SVGGElement>("[data-jarvis='core']");

  if (!ringOuter || !ringDial || !trail || !head || !core) {
    return null;
  }

  return {
    mark,
    ringOuter,
    ringDial,
    trail,
    head,
    core,
    wordmark,
    greeting,
  };
}
