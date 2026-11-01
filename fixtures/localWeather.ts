/**
 * Météo locale à l'ouverture (mock UI) — alignée sur LAT/LON HUD (Bruxelles).
 * Remplacé plus tard par un port météo / API réelle.
 */
export const LOCAL_WEATHER_AT_OPEN = {
  city: "Bruxelles",
  celsius: 8,
  /** Humidité relative — utile à côté de la ville sur l'axe. */
  humidityPercent: 62,
} as const;
