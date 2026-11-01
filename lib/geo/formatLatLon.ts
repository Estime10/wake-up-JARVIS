/** Formate des coords au style HUD : `LAT 50.85 N — LON 4.35 E`. */

export function formatLatLon(
  latitude: number,
  longitude: number,
): {
  lat: string;
  ns: "N" | "S";
  lon: string;
  ew: "E" | "W";
} {
  return {
    lat: Math.abs(latitude).toFixed(2),
    ns: latitude >= 0 ? "N" : "S",
    lon: Math.abs(longitude).toFixed(2),
    ew: longitude >= 0 ? "E" : "W",
  };
}
