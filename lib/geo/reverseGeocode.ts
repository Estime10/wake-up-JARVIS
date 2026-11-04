import { z } from "zod";

/**
 * Reverse geocode navigateur (BigDataCloud client endpoint).
 * Échec réseau / réponse invalide → `null`.
 */

const bigDataCloudSchema = z.object({
  city: z.string().optional(),
  locality: z.string().optional(),
});

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

  try {
    const response = await fetch(url.toString(), {
      method: "GET",
      headers: { Accept: "application/json" },
    });

    if (!response.ok) {
      return null;
    }

    const parsed = bigDataCloudSchema.safeParse(await response.json());
    if (!parsed.success) {
      return null;
    }

    const place = parsed.data.city?.trim() || parsed.data.locality?.trim();
    return place || null;
  } catch {
    return null;
  }
}
