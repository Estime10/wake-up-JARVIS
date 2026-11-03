/**
 * Reverse geocode serveur (BigDataCloud, sans clé) → libellé lieu.
 * Appelé uniquement depuis `/api/geo/reverse` (CSP : pas de connect tiers navigateur).
 * Échec réseau / quota → `null`.
 */

type BigDataCloudResponse = {
  city?: string;
  locality?: string;
};

export async function reverseGeocodePlace(
  latitude: number,
  longitude: number,
): Promise<string | null> {
  const url = new URL(
    "https://api.bigdatacloud.net/data/reverse-geocode-client",
  );
  url.searchParams.set("latitude", String(latitude));
  url.searchParams.set("longitude", String(longitude));
  url.searchParams.set("localityLanguage", "fr");

  const response = await fetch(url.toString(), {
    method: "GET",
    headers: { Accept: "application/json" },
  });

  if (!response.ok) {
    return null;
  }

  const data = (await response.json()) as BigDataCloudResponse;
  // Ville / localité seule — pas de région ni pays (HUD + TTS).
  const place = data.city?.trim() || data.locality?.trim();
  return place || null;
}
