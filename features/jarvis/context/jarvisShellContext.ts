"use client";

import { createContext, useContext, type RefObject } from "react";

import type { HomeEnterHandoff } from "@/features/jarvis/model/homeEnterHandoff";
import type { MainFocusRequest } from "@/features/jarvis/model/mainFocusRequest";

export type JarvisShellValue = {
  /** Nœud du mark persistant (PersistentMark) — remplace `document.querySelector`. */
  markRef: RefObject<HTMLDivElement | null>;
  /** Handoff splash→home de cette coquille. */
  handoff: HomeEnterHandoff;
  /** Focus `<main>` à l'arrivée sur home après l'intro. */
  mainFocus: MainFocusRequest;
};

export const JarvisShellContext = createContext<JarvisShellValue | null>(null);

export function useJarvisShell(): JarvisShellValue {
  const value = useContext(JarvisShellContext);
  if (!value) {
    throw new Error("useJarvisShell doit être utilisé sous <JarvisShell>.");
  }
  return value;
}
