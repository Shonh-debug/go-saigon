import { placeSeeds } from "./placeSeeds";
import type { Place, PlaceSeed } from "./types";

export const categoryColors: Record<Place["category"], string> = {
  "Food & Nightlife": "#ff3bbd",
  Shopping: "#16d9ff",
  "Campus & Education": "#82f52c",
  "Sports & Fitness": "#ffb020",
  Recreation: "#9b7cff",
  Navigation: "#8ea5ff"
};

export function slugify(value: string) {
  return value
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export function placeFromSeed(seed: PlaceSeed): Place {
  return {
    id: slugify(seed.name),
    name: seed.name,
    category: seed.category,
    districtArea: seed.districtArea,
    lastSeen: seed.lastSeen,
    source: "maps-recents-seed",
    types: seed.fallback?.types ?? [],
    address: seed.fallback?.address,
    rating: seed.fallback?.rating,
    userRatingCount: seed.fallback?.userRatingCount,
    lat: seed.fallback?.lat,
    lng: seed.fallback?.lng,
    businessStatus: seed.fallback?.businessStatus,
    googleMapsUri: seed.fallback?.googleMapsUri
  };
}

export const seedPlaces: Place[] = placeSeeds.map(placeFromSeed);

export function popularityTier(place: Place) {
  const count = place.userRatingCount ?? 0;
  if (count >= 10000) return "Landmark";
  if (count >= 1000) return "Popular";
  if (count >= 100) return "Known";
  return "Niche";
}

export function compactNumber(value: number) {
  return Intl.NumberFormat("en", { notation: "compact", maximumFractionDigits: 1 }).format(value);
}

export function getAverageRating(places: Place[]) {
  const rated = places.filter((place) => typeof place.rating === "number");
  if (!rated.length) return 0;
  return rated.reduce((sum, place) => sum + (place.rating ?? 0), 0) / rated.length;
}
