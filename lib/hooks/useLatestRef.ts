"use client";

import { useEffect, useRef, type RefObject } from "react";

/** Garde toujours la dernière valeur dans une ref (évite stale closures). */
export function useLatestRef<T>(value: T): RefObject<T> {
  const ref = useRef(value);

  useEffect(() => {
    ref.current = value;
  }, [value]);

  return ref;
}
