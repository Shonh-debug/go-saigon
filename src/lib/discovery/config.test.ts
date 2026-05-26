import { describe, expect, it } from "vitest";
import {
  categories,
  dedupeDestinations,
  hasLimitedResults,
  isInsideVisitorArea,
  isOperatingDestination,
  rankDestinations
} from "./config";
import type { Destination } from "./types";

function destination(overrides: Partial<Destination>): Destination {
  return {
    placeId: "base",
    name: "Base",
    types: ["tourist_attraction"],
    lat: 10.775,
    lng: 106.699,
    googleMapsUri: "https://maps.google.com/",
    ...overrides
  };
}

describe("tourist discovery configuration", () => {
  it("maps public categories to Places types", () => {
    expect(categories.map((category) => category.label)).toEqual([
      "Food",
      "Nightlife & Recreation",
      "Shopping",
      "Landmarks",
      "Campus & Education",
      "Sport & Fitness",
      "Services"
    ]);
    expect(categories.find((category) => category.id === "services")?.placeTypes).toContain("tour_agency");
  });

  it("sorts destinations by review count, rating, and then name", () => {
    const sorted = rankDestinations([
      destination({ placeId: "c", name: "C", userRatingCount: 10_000, rating: 4.8 }),
      destination({ placeId: "a", name: "A", userRatingCount: 10_000, rating: 4.9 }),
      destination({ placeId: "b", name: "B", userRatingCount: 12_000, rating: 4.1 })
    ]);
    expect(sorted.map((place) => place.placeId)).toEqual(["b", "a", "c"]);
  });

  it("deduplicates Google place IDs and excludes closed destinations", () => {
    const places = [
      destination({ placeId: "same" }),
      destination({ placeId: "same", name: "Duplicate" }),
      destination({ placeId: "closed", businessStatus: "CLOSED_PERMANENTLY" })
    ];
    expect(dedupeDestinations(places)).toHaveLength(2);
    expect(places.filter(isOperatingDestination).map((place) => place.placeId)).toEqual(["same", "same"]);
  });

  it("filters points to the selected visitor-area polygon", () => {
    expect(isInsideVisitorArea(destination({ lat: 10.775, lng: 106.699 }), "district-1")).toBe(true);
    expect(isInsideVisitorArea(destination({ lat: 10.735, lng: 106.73 }), "district-1")).toBe(false);
  });

  it("flags searches with fewer than fifteen qualifying results", () => {
    expect(hasLimitedResults(14)).toBe(true);
    expect(hasLimitedResults(15)).toBe(false);
  });
});
