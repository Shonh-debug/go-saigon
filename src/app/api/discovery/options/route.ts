import { NextResponse } from "next/server";
import { discoveryOptions } from "@/lib/discovery/config";

export const dynamic = "force-dynamic";

export async function GET() {
  return NextResponse.json(discoveryOptions, {
    headers: { "Cache-Control": "no-store" }
  });
}
