"use client";

import { useEffect, useState } from "react";

import { reverseGeocodePlace } from "@/lib/geo/reverseGeocode";
import { t } from "@/lib/i18n";

export type DeviceLocationStatus = "pending" | "ready" | "unavailable";

export type DeviceLocationState = {
  /** Libellé HUD (`GEOLOC · …`). */
  label: string;
  /** Lieu seul pour TTS — null si pending / indispo. */
  place: string | null;
  status: DeviceLocationStatus;
};

const PENDING: DeviceLocationState = {
  label: t("intro.locationPending"),
  place: null,
  status: "pending",
};

const UNAVAILABLE: DeviceLocationState = {
  label: t("intro.locationUnavailable"),
  place: null,
  status: "unavailable",
};

/** Une seule résolution géoloc par session document (HUD + TTS). */
let shared: DeviceLocationState = PENDING;
let sharedPromise: Promise<DeviceLocationState> | null = null;
const listeners = new Set<(state: DeviceLocationState) => void>();

function publish(next: DeviceLocationState): DeviceLocationState {
  shared = next;
  for (const listener of listeners) {
    listener(next);
  }
  return next;
}

function resolveDeviceLocation(): Promise<DeviceLocationState> {
  if (shared.status !== "pending") {
    return Promise.resolve(shared);
  }
  if (sharedPromise) {
    return sharedPromise;
  }

  sharedPromise = new Promise((resolve) => {
    if (typeof navigator === "undefined" || !navigator.geolocation) {
      resolve(publish(UNAVAILABLE));
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        void reverseGeocodePlace(latitude, longitude).then((resolved) => {
          const place = resolved?.trim();
          if (place) {
            resolve(
              publish({
                label: t("intro.location", { place }),
                place,
                status: "ready",
              }),
            );
            return;
          }
          resolve(publish(UNAVAILABLE));
        });
      },
      () => {
        resolve(publish(UNAVAILABLE));
      },
      {
        enableHighAccuracy: false,
        timeout: 12_000,
        maximumAge: 5 * 60_000,
      },
    );
  });

  return sharedPromise;
}

/**
 * Lieu appareil (Geolocation + reverse BigDataCloud côté navigateur).
 * Partagé entre HUD et TTS — un seul `getCurrentPosition` / reverse.
 * Permission refusée / indispo → placeholder.
 */
export function useDeviceLocation(): DeviceLocationState {
  const [state, setState] = useState<DeviceLocationState>(shared);

  useEffect(() => {
    listeners.add(setState);
    void resolveDeviceLocation().then(setState);
    return () => {
      listeners.delete(setState);
    };
  }, []);

  return state;
}
