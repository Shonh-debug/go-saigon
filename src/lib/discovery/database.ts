import { neon } from "@neondatabase/serverless";
import { and, eq } from "drizzle-orm";
import { drizzle } from "drizzle-orm/neon-http";
import type { CategoryId, VisitorArea, VisitorAreaId } from "./types";
import { areaCategoryPlaces, discoveryRequests, visitorAreasTable } from "./schema";

let database: ReturnType<typeof drizzle> | undefined;

function getDatabase() {
  if (!process.env.DATABASE_URL) return undefined;
  if (!database) database = drizzle(neon(process.env.DATABASE_URL));
  return database;
}

export async function loadStoredPlaceIds(areaId: VisitorAreaId, categoryId: CategoryId) {
  const db = getDatabase();
  if (!db) return [];
  try {
    const records = await db
      .select({ placeId: areaCategoryPlaces.placeId })
      .from(areaCategoryPlaces)
      .where(and(eq(areaCategoryPlaces.areaId, areaId), eq(areaCategoryPlaces.categoryId, categoryId)));
    return records.map((record) => record.placeId);
  } catch {
    return [];
  }
}

export async function recordDiscovery(area: VisitorArea, categoryId: CategoryId, placeIds: string[], resultCount: number) {
  const db = getDatabase();
  if (!db) return;
  try {
    await db
      .insert(visitorAreasTable)
      .values({
        id: area.id,
        label: area.label,
        polygonAsset: "/data/visitor-areas.json",
        searchConfiguration: { center: area.center, radius: area.radius }
      })
      .onConflictDoUpdate({
        target: visitorAreasTable.id,
        set: {
          label: area.label,
          polygonAsset: "/data/visitor-areas.json",
          searchConfiguration: { center: area.center, radius: area.radius },
          updatedAt: new Date()
        }
      });
    if (placeIds.length) {
      await db
        .insert(areaCategoryPlaces)
        .values(placeIds.map((placeId) => ({ areaId: area.id, categoryId, placeId })))
        .onConflictDoUpdate({
          target: [areaCategoryPlaces.areaId, areaCategoryPlaces.categoryId, areaCategoryPlaces.placeId],
          set: { lastRequestedAt: new Date() }
        });
    }
    await db.insert(discoveryRequests).values({ areaId: area.id, categoryId, resultCount });
  } catch {
    // Discovery remains useful without persistence when the optional database is unavailable.
  }
}
