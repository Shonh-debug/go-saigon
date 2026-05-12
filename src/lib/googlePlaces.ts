import { placeSeeds } from "./placeSeeds";
import { dedupePlaces, slugify } from "./places";
import type { Place, PlaceSeed } from "./types";

type GooglePlace = {
  displayName?: { text?: string; languageCode?: string };
  formattedAddress?: string;
  types?: string[];
  rating?: number;
  userRatingCount?: number;
  location?: { latitude?: number; longitude?: number };
  businessStatus?: string;
  googleMapsUri?: string;
};

const FIELD_MASK = [
  "places.displayName",
  "places.formattedAddress",
  "places.rating",
  "places.userRatingCount",
  "places.types",
  "places.location",
  "places.businessStatus",
  "places.googleMapsUri"
].join(",");

function normalizeGooglePlace(seed: PlaceSeed, googlePlace?: GooglePlace): Place {
  const fallback = seed.fallback ?? {};
  const name = googlePlace?.displayName?.text ?? seed.name;

  return {
    id: slugify(seed.name),
    name,
    category: seed.category,
    districtArea: seed.districtArea,
    source: googlePlace ? "places-api" : "maps-recents-seed",
    lastSeen: seed.lastSeen,
    types: googlePlace?.types ?? fallback.types ?? [],
    address: googlePlace?.formattedAddress ?? fallback.address,
    rating: googlePlace?.rating ?? fallback.rating,
    userRatingCount: googlePlace?.userRatingCount ?? fallback.userRatingCount,
    lat: googlePlace?.location?.latitude ?? fallback.lat,
    lng: googlePlace?.location?.longitude ?? fallback.lng,
    businessStatus: googlePlace?.businessStatus ?? fallback.businessStatus,
    googleMapsUri: googlePlace?.googleMapsUri ?? fallback.googleMapsUri
  };
}

export async function searchPlace(seed: PlaceSeed): Promise<Place> {
  const apiKey = process.env.GOOGLE_MAPS_API_KEY;
  if (!apiKey) {
    return normalizeGooglePlace(seed);
  }

  const response = await fetch("https://places.googleapis.com/v1/places:searchText", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Goog-Api-Key": apiKey,
      "X-Goog-FieldMask": FIELD_MASK
    },
    body: JSON.stringify({
      textQuery: seed.query,
      maxResultCount: 1
    }),
    next: { revalidate: 3600 }
  });

  if (!response.ok) {
    return normalizeGooglePlace(seed);
  }

  const payload = (await response.json()) as { places?: GooglePlace[] };
  return normalizeGooglePlace(seed, payload.places?.[0]);
}

export async function syncPlaces() {
  const places: Place[] = [];

  for (const seed of placeSeeds) {
    places.push(await searchPlace(seed));
  }

  return dedupePlaces(places);
}
