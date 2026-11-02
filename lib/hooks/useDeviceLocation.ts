"use client";

import { useEffect, useState } from "react";

import { t } from "@/lib/i18n";

type ReverseResponse = {
  place: string | null;
};

/**
 * Lieu appareil (Geolocation + reverse geocode via `/api/geo/reverse`).
 * Permission refusée / indispo → placeholder.
 */
export function useDeviceLocation(): string {
  const [place, setPlace] = useState(t("intro.locationPending"));

  useEffect(() => {
    let cancelled = false;

    if (typeof navigator === "undefined" || !navigator.geolocation) {
      const id = window.setTimeout(() => {
        if (!cancelled) {
          setPlace(t("intro.locationUnavailable"));
        }
      }, 0);
      return () => {
        cancelled = true;
        window.clearTimeout(id);
      };
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        if (cancelled) {
          return;
        }
        const { latitude, longitude } = position.coords;
        const url = new URL("/api/geo/reverse", window.location.origin);
        url.searchParams.set("latitude", String(latitude));
        url.searchParams.set("longitude", String(longitude));

        void fetch(url.toString())
          .then(async (response) => {
            if (!response.ok) {
              return null;
            }
            const data = (await response.json()) as ReverseResponse;
            return data.place;
          })
          .then((resolved) => {
            if (cancelled) {
              return;
            }
            setPlace(
              resolved
                ? t("intro.location", { place: resolved })
                : t("intro.locationUnavailable"),
            );
          })
          .catch(() => {
            if (!cancelled) {
              setPlace(t("intro.locationUnavailable"));
            }
          });
      },
      () => {
        if (!cancelled) {
          setPlace(t("intro.locationUnavailable"));
        }
      },
      {
        enableHighAccuracy: false,
        timeout: 12_000,
        maximumAge: 5 * 60_000,
      },
    );

    return () => {
      cancelled = true;
    };
  }, []);

  return place;
}
