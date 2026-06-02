import { NextRequest, NextResponse } from "next/server";
import { checkPhotoLimit, RATE_LIMIT_NOT_CONFIGURED } from "@/lib/discovery/rateLimit";
import { fetchPlacePhoto, PlacesConfigurationError, validatePhotoReference } from "@/lib/googlePlaces";

export const dynamic = "force-dynamic";
const noStoreHeaders = { "Cache-Control": "no-store" };

export async function GET(request: NextRequest) {
  const reference = request.nextUrl.searchParams.get("ref") ?? "";
  const expires = request.nextUrl.searchParams.get("expires") ?? "";
  const signature = request.nextUrl.searchParams.get("signature") ?? "";

  try {
    const photoName = validatePhotoReference(reference, expires, signature);
    if (!photoName) return new NextResponse(null, { status: 400, headers: noStoreHeaders });

    const limit = await checkPhotoLimit(request);
    if (!limit.success) {
      const isMissingLimiter = "reason" in limit && limit.reason === RATE_LIMIT_NOT_CONFIGURED;
      return new NextResponse(null, { status: isMissingLimiter ? 503 : 429, headers: noStoreHeaders });
    }

    const response = await fetchPlacePhoto(photoName);
    if (!response.ok) return new NextResponse(null, { status: response.status, headers: noStoreHeaders });
    const payload = (await response.json()) as { photoUri?: string };
    if (!payload.photoUri) return new NextResponse(null, { status: 404, headers: noStoreHeaders });
    const photoResponse = await fetch(payload.photoUri, { cache: "no-store" });
    if (!photoResponse.ok) return new NextResponse(null, { status: photoResponse.status, headers: noStoreHeaders });
    return new NextResponse(photoResponse.body, {
      headers: {
        "Content-Type": photoResponse.headers.get("Content-Type") ?? "image/jpeg",
        ...noStoreHeaders
      }
    });
  } catch (error) {
    const status = error instanceof PlacesConfigurationError ? 503 : 502;
    return new NextResponse(null, { status, headers: noStoreHeaders });
  }
}
