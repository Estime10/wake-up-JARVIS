import gsap from "gsap";

import { blinkCoreTwice } from "@/features/intro/model/blinkCoreTwice";
import type { IntroTimelineTargets } from "@/features/intro/model/introTimelineTargets";
import { padTimelineToDuration } from "@/features/intro/model/padTimelineToDuration";
import { prepareHiddenTargets } from "@/features/intro/model/prepareHiddenTargets";
import { prepareMarkParts } from "@/features/intro/model/prepareMarkParts";
import type { GsapTimeline } from "@/lib/gsap/timelineType";
import { INTRO_DURATION_FULL_MS } from "@/lib/intro/timings";

/**
 * Noyau (centre, 2 clignotements) → cercle → cadran → traînée → tête + textes.
 * Rythme volontairement plus lent.
 */
export function buildFullIntroTimeline(
  targets: IntroTimelineTargets,
  onComplete: () => void,
): GsapTimeline {
  const tl = gsap.timeline({
    defaults: { ease: "power2.out" },
    onComplete,
  });

  prepareHiddenTargets(targets);
  prepareMarkParts(targets);

  // Conteneur visible (sans scale décentré)
  tl.to(targets.mark, { opacity: 1, scale: 1, duration: 0.4 }, 0);

  // Noyau au centre + 2 clignotements
  const afterBlink = blinkCoreTwice(tl, targets.core, 0.35);

  // Premier cercle
  tl.to(
    targets.ringOuter,
    { strokeDashoffset: 0, duration: 1.35, ease: "power2.inOut" },
    afterBlink,
  );

  // Cadran pointillé
  tl.to(targets.ringDial, { opacity: 1, duration: 0.55 }, afterBlink + 0.55);

  // Traînée
  const trailStart = afterBlink + 0.75;
  tl.to(
    targets.trail,
    { strokeDashoffset: 0, duration: 1.55, ease: "power2.inOut" },
    trailStart,
  );

  // Tête + textes ensemble
  const finale = trailStart + 1.45;
  tl.to(
    targets.head,
    { opacity: 1, scale: 1, duration: 0.55, ease: "power2.out" },
    finale,
  );
  tl.to(targets.wordmark, { opacity: 1, y: 0, duration: 0.6 }, finale);
  if (targets.greeting) {
    tl.to(targets.greeting, { opacity: 1, y: 0, duration: 0.6 }, finale);
  }

  // Cible un peu plus longue que 3,5 s vu le rythme ralenti
  padTimelineToDuration(tl, Math.max(INTRO_DURATION_FULL_MS / 1000, 5.2));

  return tl;
}
