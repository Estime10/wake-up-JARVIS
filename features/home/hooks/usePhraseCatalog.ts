"use client";

import { useCallback, useState } from "react";

type UsePhraseCatalogResult = {
  open: boolean;
  seed: string;
  openCatalog: (phrase?: string) => void;
  closeCatalog: () => void;
};

/** Modal catalogue de phrases — état local home. */
export function usePhraseCatalog(): UsePhraseCatalogResult {
  const [open, setOpen] = useState(false);
  const [seed, setSeed] = useState("");

  const openCatalog = useCallback((phrase = "") => {
    setSeed(phrase);
    setOpen(true);
  }, []);

  const closeCatalog = useCallback(() => {
    setOpen(false);
  }, []);

  return { open, seed, openCatalog, closeCatalog };
}
