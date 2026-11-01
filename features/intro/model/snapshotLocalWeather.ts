import { LOCAL_WEATHER_AT_OPEN } from "@/fixtures/localWeather";

export type LocalWeatherSnapshot = {
  city: string;
  celsius: number;
};

/**
 * Snapshot météo à l'ouverture (domaine pur).
 * Aujourd'hui : fixture mock ; demain : port météo.
 */
export function snapshotLocalWeather(): LocalWeatherSnapshot {
  return {
    city: LOCAL_WEATHER_AT_OPEN.city,
    celsius: LOCAL_WEATHER_AT_OPEN.celsius,
  };
}
