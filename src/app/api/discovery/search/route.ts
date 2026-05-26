import { NextRequest, NextResponse } from "next/server";
import { getCategory, getVisitorArea } from "@/lib/discovery/config";
import { checkDiscoveryLimit } from "@/lib/discovery/rateLimit";
import type { CategoryId, VisitorAreaId } from "@/lib/discovery/types";
import { discoverDestinations, PlacesConfigurationError } from "@/lib/googlePlaces";

export const dynamic = "force-dynamic";
const noStoreHeaders = { "Cache-Control": "no-store" };

export async function POST(request: NextRequest) {
  const limit = await checkDiscoveryLimit(request);
  if (!limit.success) {
    return NextResponse.json({ error: "Too many discovery requests. Please try again shortly." }, { status: 429, headers: noStoreHeaders });
  }

  const payload = (await request.json().catch(() => undefined)) as { areaId?: string; categoryId?: string } | undefined;
  if (!payload || !getVisitorArea(payload.areaId ?? "") || !getCategory(payload.categoryId ?? "")) {
    return NextResponse.json({ error: "Select a valid visitor area and category." }, { status: 400, headers: noStoreHeaders });
  }

  try {
    const results = await discoverDestinations(payload.areaId as VisitorAreaId, payload.categoryId as CategoryId);
    return NextResponse.json(results, { headers: noStoreHeaders });
  } catch (error) {
    const status = error instanceof PlacesConfigurationError ? 503 : 502;
    const message = error instanceof PlacesConfigurationError ? error.message : "Destination search is temporarily unavailable.";
    return NextResponse.json({ error: message }, { status, headers: noStoreHeaders });
  }
}
