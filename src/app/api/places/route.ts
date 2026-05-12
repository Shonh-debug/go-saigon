import { NextResponse } from "next/server";
import { seedPlaces } from "@/lib/places";

export async function GET() {
  return NextResponse.json({ places: seedPlaces });
}
