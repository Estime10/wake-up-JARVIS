"use client";

import type { ReactNode } from "react";

import { PersistentMark } from "@/features/jarvis/components/PersistentMark";

/**
 * Coquille app — mark AVANT les routes pour que useLayoutEffect
 * pose le mark sur le slot avant la timeline intro (GSAP).
 */
export function JarvisShell({ children }: { children: ReactNode }) {
  return (
    <>
      <PersistentMark />
      {children}
    </>
  );
}
