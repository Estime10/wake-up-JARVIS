"use client";

import { useSyncExternalStore } from "react";

import {
  isPressureState,
  type SysPressureState,
} from "@/features/intro/model/sysPressureState";

const SAMPLE_INTERVAL_MS = 2_000;

/** Une seule observation CPU par session document (HUD). */
let shared: SysPressureState = "unknown";
let started = false;
const listeners = new Set<() => void>();

function publish(state: SysPressureState): void {
  if (shared === state) {
    return;
  }
  shared = state;
  for (const listener of listeners) {
    listener();
  }
}

function startObserver(): void {
  if (started || typeof window === "undefined") {
    return;
  }
  started = true;

  const Ctor = window.PressureObserver;
  if (typeof Ctor !== "function") {
    publish("unknown");
    return;
  }

  try {
    const observer = new Ctor((records) => {
      const last = records[records.length - 1];
      if (!last || !isPressureState(last.state)) {
        return;
      }
      publish(last.state);
    });

    void observer
      .observe("cpu", { sampleInterval: SAMPLE_INTERVAL_MS })
      .catch(() => {
        publish("unknown");
      });
  } catch {
    publish("unknown");
  }
}

function subscribe(onStoreChange: () => void): () => void {
  listeners.add(onStoreChange);
  startObserver();
  return () => {
    listeners.delete(onStoreChange);
  };
}

function getSnapshot(): SysPressureState {
  return shared;
}

function getServerSnapshot(): SysPressureState {
  return "unknown";
}

/**
 * Pression CPU système via Compute Pressure API (Chrome/Edge).
 * Fallback `unknown` si non supporté (Safari/Firefox) — pas de faux « nominal ».
 */
export function useSysPressure(): SysPressureState {
  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}
