import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";

import { reverseGeocodePlace } from "@/lib/geo/reverseGeocode";

export const runtime = "nodejs";

const querySchema = z.object({
  latitude: z.coerce.number().min(-90).max(90),
  longitude: z.coerce.number().min(-180).max(180),
});

/**
 * Reverse geocode serveur — le navigateur ne parle qu’à `'self'` (CSP).
 */
export async function GET(request: NextRequest) {
  const parsed = querySchema.safeParse({
    latitude: request.nextUrl.searchParams.get("latitude"),
    longitude: request.nextUrl.searchParams.get("longitude"),
  });

  if (!parsed.success) {
    return NextResponse.json({ place: null }, { status: 400 });
  }

  const place = await reverseGeocodePlace(
    parsed.data.latitude,
    parsed.data.longitude,
  );

  return NextResponse.json({ place });
}
