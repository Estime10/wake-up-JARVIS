"use client";

import { useEffect, useState } from "react";

import { reverseGeocodePlace } from "@/lib/geo/reverseGeocode";
import { t } from "@/lib/i18n";

/**
 * Lieu appareil (Geolocation + reverse geocode) — libellé HUD seul.
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

        void reverseGeocodePlace(latitude, longitude)
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
