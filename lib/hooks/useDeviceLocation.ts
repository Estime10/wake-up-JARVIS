"use client";

import { useEffect, useState } from "react";

import { formatLatLon } from "@/lib/geo/formatLatLon";
import { reverseGeocodePlace } from "@/lib/geo/reverseGeocode";
import { t } from "@/lib/i18n";

export type DeviceLocationLabels = {
  coords: string;
  place: string;
};

const PENDING: DeviceLocationLabels = {
  coords: t("intro.latLonPending"),
  place: t("intro.locationPending"),
};

const UNAVAILABLE: DeviceLocationLabels = {
  coords: t("intro.latLonUnavailable"),
  place: t("intro.locationUnavailable"),
};

/**
 * Position appareil (Geolocation API) + reverse geocode pour le libellé lieu.
 * Permission refusée / indispo → placeholders HUD.
 */
export function useDeviceLocation(): DeviceLocationLabels {
  const [labels, setLabels] = useState<DeviceLocationLabels>(PENDING);

  useEffect(() => {
    let cancelled = false;

    if (typeof navigator === "undefined" || !navigator.geolocation) {
      const id = window.setTimeout(() => {
        if (!cancelled) {
          setLabels(UNAVAILABLE);
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
        const parts = formatLatLon(latitude, longitude);
        const coords = t("intro.latLon", {
          lat: parts.lat,
          ns: parts.ns,
          lon: parts.lon,
          ew: parts.ew,
        });

        setLabels({
          coords,
          place: t("intro.locationPending"),
        });

        void reverseGeocodePlace(latitude, longitude)
          .then((place) => {
            if (cancelled) {
              return;
            }
            setLabels({
              coords,
              place: place
                ? t("intro.location", { place })
                : t("intro.locationUnavailable"),
            });
          })
          .catch(() => {
            if (!cancelled) {
              setLabels({
                coords,
                place: t("intro.locationUnavailable"),
              });
            }
          });
      },
      () => {
        if (!cancelled) {
          setLabels(UNAVAILABLE);
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

  return labels;
}
