import { integer, jsonb, pgTable, primaryKey, text, timestamp } from "drizzle-orm/pg-core";

export const visitorAreasTable = pgTable("visitor_areas", {
  id: text("id").primaryKey(),
  label: text("label").notNull(),
  polygonAsset: text("polygon_asset").notNull(),
  searchConfiguration: jsonb("search_configuration").notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull()
});

export const areaCategoryPlaces = pgTable(
  "area_category_places",
  {
    areaId: text("area_id").notNull(),
    categoryId: text("category_id").notNull(),
    placeId: text("place_id").notNull(),
    firstDiscoveredAt: timestamp("first_discovered_at", { withTimezone: true }).defaultNow().notNull(),
    lastRequestedAt: timestamp("last_requested_at", { withTimezone: true }).defaultNow().notNull()
  },
  (table) => [primaryKey({ columns: [table.areaId, table.categoryId, table.placeId] })]
);

export const discoveryRequests = pgTable("discovery_requests", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  areaId: text("area_id").notNull(),
  categoryId: text("category_id").notNull(),
  resultCount: integer("result_count").notNull(),
  requestedAt: timestamp("requested_at", { withTimezone: true }).defaultNow().notNull()
});
