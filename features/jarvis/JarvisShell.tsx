"use client";

import { createRef, useState, type ReactNode } from "react";

import { PersistentMark } from "@/features/jarvis/components/PersistentMark";
import {
  JarvisShellContext,
  type JarvisShellValue,
} from "@/features/jarvis/context";
import { createHomeEnterHandoff } from "@/features/jarvis/model/homeEnterHandoff";
import { createMainFocusRequest } from "@/features/jarvis/model/mainFocusRequest";

/**
 * Coquille app — mark AVANT les routes pour que useLayoutEffect
 * pose le mark sur le slot avant la timeline intro (GSAP).
 * Porte la ref du mark et le handoff splash→home (contexte, pas de singleton).
 */
export function JarvisShell({ children }: { children: ReactNode }) {
  const [shell] = useState<JarvisShellValue>(() => ({
    markRef: createRef<HTMLDivElement>(),
    handoff: createHomeEnterHandoff(),
    mainFocus: createMainFocusRequest(),
  }));

  return (
    <JarvisShellContext value={shell}>
      <PersistentMark />
      {children}
    </JarvisShellContext>
  );
}
