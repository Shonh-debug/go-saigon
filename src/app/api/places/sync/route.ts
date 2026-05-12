import { NextResponse } from "next/server";
import { syncPlaces } from "@/lib/googlePlaces";

export async function POST() {
  const places = await syncPlaces();
  return NextResponse.json({
    places,
    syncedAt: new Date().toISOString()
  });
}
