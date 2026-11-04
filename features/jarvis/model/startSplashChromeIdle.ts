import gsap from "gsap";

import { MARK_SVG_ORIGIN } from "@/components/ui/JarvisMark/voiceRingGeometry";

/** État final splash (dérive acte 2) — point de départ home. */
const BOOT_150_START_DEG = 10.84;
const BOOT_160_START_DEG = -6.19;

/** Tours complets — rythme proche du cadran (lisible, pas nerveux). */
const BOOT_150_SPIN_SECONDS = 42;
const BOOT_160_SPIN_SECONDS = 48;

/**
 * Dérive continue des anneaux boot (sens opposés), comme la fin du splash.
 * Croix / réticules restent fixes.
 * Idempotent — ne reset pas si déjà en spin (idle ↔ speaking).
 */
export function startSplashChromeIdle(root: ParentNode): void {
  const boot150 = root.querySelector<SVGElement>("[data-jarvis='boot-r150']");
  const boot160 = root.querySelector<SVGElement>("[data-jarvis='boot-r160']");

  if (boot150 && !gsap.isTweening(boot150)) {
    gsap.set(boot150, {
      rotation: BOOT_150_START_DEG,
      svgOrigin: MARK_SVG_ORIGIN,
      transformOrigin: "50% 50%",
    });
    gsap.to(boot150, {
      rotation: `+=360`,
      duration: BOOT_150_SPIN_SECONDS,
      ease: "none",
      repeat: -1,
    });
  }

  if (boot160 && !gsap.isTweening(boot160)) {
    gsap.set(boot160, {
      rotation: BOOT_160_START_DEG,
      svgOrigin: MARK_SVG_ORIGIN,
      transformOrigin: "50% 50%",
    });
    gsap.to(boot160, {
      rotation: `-=360`,
      duration: BOOT_160_SPIN_SECONDS,
      ease: "none",
      repeat: -1,
    });
  }
}

export function stopSplashChromeIdle(root: ParentNode): void {
  for (const sel of [
    "[data-jarvis='boot-r150']",
    "[data-jarvis='boot-r160']",
  ]) {
    const el = root.querySelector<SVGElement>(sel);
    if (el) {
      gsap.killTweensOf(el);
    }
  }
}
