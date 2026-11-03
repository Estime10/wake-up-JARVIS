"use client";

import { useState } from "react";

/**
 * Conserve le dernier aperçu pendant l’outro (DOM monté, preview null).
 * Sync d’état pendant le render — pas de ref lue au render.
 */
export function usePreviewSnapshot<T>(
  preview: T | null,
  mounted: boolean,
): T | null {
  const [snapshot, setSnapshot] = useState<T | null>(preview);

  if (preview !== null && preview !== snapshot) {
    setSnapshot(preview);
  }

  if (!mounted) {
    return null;
  }

  return preview ?? snapshot;
}
