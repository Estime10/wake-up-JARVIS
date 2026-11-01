"use client";

import { useState } from "react";

import type { RepoFilePreviewModel } from "@/features/home/components/repo/RepoFilePreview";

/**
 * Conserve le dernier aperçu pendant l’outro (DOM monté, preview null).
 * Sync d’état pendant le render — pas de ref lue au render.
 */
export function usePreviewSnapshot(
  preview: RepoFilePreviewModel | null,
  mounted: boolean,
): RepoFilePreviewModel | null {
  const [snapshot, setSnapshot] = useState<RepoFilePreviewModel | null>(
    preview,
  );

  if (preview !== null && preview !== snapshot) {
    setSnapshot(preview);
  }

  if (!mounted) {
    return null;
  }

  return preview ?? snapshot;
}
