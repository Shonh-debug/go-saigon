import { createHmac, timingSafeEqual } from "node:crypto";
import {
  dedupeDestinations,
  getCategory,
  getVisitorArea,
  hasLimitedResults,
  isInsideVisitorArea,
  isOperatingDestination,
  rankDestinations
} from "./discovery/config";
import { loadStoredPlaceIds, recordDiscovery } from "./discovery/database";
import type {
  Attribution,
  AuthorAttribution,
  CategoryId,
  Destination,
  DiscoverySearchResponse,
  VisitorAreaId
} from "./discovery/types";

type GooglePhoto = {
  name: string;
  authorAttributions?: AuthorAttribution[];
};

type GooglePlace = {
  id?: string;
  displayName?: { text?: string };
  formattedAddress?: string;
  types?: string[];
  rating?: number;
  userRatingCount?: number;
  location?: { latitude?: number; longitude?: number };
  businessStatus?: string;
  googleMapsUri?: string;
  attributions?: Attribution[];
  photos?: GooglePhoto[];
};

const SEARCH_FIELD_MASK = [
  "places.id",
  "places.displayName",
  "places.formattedAddress",
  "places.types",
  "places.rating",
  "places.userRatingCount",
  "places.location",
  "places.businessStatus",
  "places.googleMapsUri",
  "places.attributions"
].join(",");

const DETAIL_FIELD_MASK = SEARCH_FIELD_MASK.replaceAll("places.", "");
const PHOTO_FIELD_MASK = "photos";

export class PlacesConfigurationError extends Error {}

function serverApiKey() {
  const key = process.env.GOOGLE_MAPS_API_KEY;
  if (!key) throw new PlacesConfigurationError("Google Places API is not configured.");
  return key;
}

function mapsLink(placeId: string) {
  return `https://www.google.com/maps/search/?api=1&query_place_id=${encodeURIComponent(placeId)}`;
}

function normalizePlace(place: GooglePlace): Destination | undefined {
  const placeId = place.id;
  const name = place.displayName?.text;
  const lat = place.location?.latitude;
  const lng = place.location?.longitude;
  if (!placeId || !name || typeof lat !== "number" || typeof lng !== "number") return undefined;
  return {
    placeId,
    name,
    address: place.formattedAddress,
    types: place.types ?? [],
    rating: place.rating,
    userRatingCount: place.userRatingCount,
    lat,
    lng,
    businessStatus: place.businessStatus,
    googleMapsUri: place.googleMapsUri ?? mapsLink(placeId),
    attributions: place.attributions
  };
}

async function googleRequest(url: string, init?: RequestInit) {
  return fetch(url, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      "X-Goog-Api-Key": serverApiKey(),
      ...(init?.headers ?? {})
    },
    cache: "no-store"
  });
}

async function nearbySearch(placeType: string, areaId: VisitorAreaId) {
  const area = getVisitorArea(areaId);
  if (!area) return [];
  const response = await googleRequest("https://places.googleapis.com/v1/places:searchNearby", {
    method: "POST",
    headers: { "X-Goog-FieldMask": SEARCH_FIELD_MASK },
    body: JSON.stringify({
      includedTypes: [placeType],
      maxResultCount: 20,
      rankPreference: "POPULARITY",
      locationRestriction: {
        circle: {
          center: { latitude: area.center.lat, longitude: area.center.lng },
          radius: area.radius
        }
      },
      languageCode: "en",
      regionCode: "VN"
    })
  });
  if (!response.ok) throw new Error(`Places Nearby Search returned ${response.status}.`);
  const payload = (await response.json()) as { places?: GooglePlace[] };
  return (payload.places ?? []).map(normalizePlace).filter((place): place is Destination => Boolean(place));
}

async function getPlaceDetails(placeId: string) {
  const response = await googleRequest(`https://places.googleapis.com/v1/places/${encodeURIComponent(placeId)}`, {
    headers: { "X-Goog-FieldMask": DETAIL_FIELD_MASK }
  });
  if (!response.ok) return undefined;
  return normalizePlace((await response.json()) as GooglePlace);
}

function photoSignature(photoName: string, expires: number) {
  return createHmac("sha256", serverApiKey()).update(`${photoName}:${expires}`).digest("base64url");
}

async function attachPhoto(destination: Destination): Promise<Destination> {
  const response = await googleRequest(
    `https://places.googleapis.com/v1/places/${encodeURIComponent(destination.placeId)}`,
    { headers: { "X-Goog-FieldMask": PHOTO_FIELD_MASK } }
  );
  if (!response.ok) return destination;
  const place = (await response.json()) as GooglePlace;
  const photo = place.photos?.[0];
  if (!photo?.name) return destination;
  const expires = Date.now() + 15 * 60 * 1000;
  const params = new URLSearchParams({
    ref: Buffer.from(photo.name).toString("base64url"),
    expires: String(expires),
    signature: photoSignature(photo.name, expires)
  });
  return {
    ...destination,
    photo: {
      proxyUrl: `/api/discovery/photo?${params.toString()}`,
      authorAttributions: photo.authorAttributions ?? []
    }
  };
}

export function validatePhotoReference(reference: string, expiresValue: string, signature: string) {
  const expires = Number(expiresValue);
  if (!Number.isFinite(expires) || expires < Date.now()) return undefined;
  let photoName: string;
  try {
    photoName = Buffer.from(reference, "base64url").toString("utf8");
  } catch {
    return undefined;
  }
  if (!photoName.startsWith("places/") || !photoName.includes("/photos/")) return undefined;
  const expected = photoSignature(photoName, expires);
  const suppliedBuffer = Buffer.from(signature);
  const expectedBuffer = Buffer.from(expected);
  if (suppliedBuffer.length !== expectedBuffer.length || !timingSafeEqual(suppliedBuffer, expectedBuffer)) return undefined;
  return photoName;
}

export async function fetchPlacePhoto(photoName: string) {
  return googleRequest(
    `https://places.googleapis.com/v1/${photoName}/media?maxWidthPx=640&maxHeightPx=480&skipHttpRedirect=true`
  );
}

export async function discoverDestinations(areaId: VisitorAreaId, categoryId: CategoryId): Promise<DiscoverySearchResponse> {
  const area = getVisitorArea(areaId);
  const category = getCategory(categoryId);
  if (!area || !category) throw new Error("Unknown visitor area or destination category.");
  serverApiKey();

  const searches = await Promise.allSettled(category.placeTypes.map((placeType) => nearbySearch(placeType, area.id)));
  const discovered = searches.flatMap((result) => (result.status === "fulfilled" ? result.value : []));
  if (!discovered.length && searches.every((result) => result.status === "rejected")) {
    throw new Error("Google Places search is unavailable right now.");
  }

  const knownIds = await loadStoredPlaceIds(area.id, category.id);
  const knownDetails = await Promise.all(knownIds.map((placeId) => getPlaceDetails(placeId)));
  const candidates = dedupeDestinations([...discovered, ...knownDetails.filter((place): place is Destination => Boolean(place))])
    .filter(isOperatingDestination)
    .filter((place) => isInsideVisitorArea(place, area.id));
  const ranked = rankDestinations(candidates).slice(0, 20);
  const destinations = await Promise.all(ranked.map(attachPhoto));

  await recordDiscovery(area, category.id, candidates.map((place) => place.placeId), destinations.length);

  return {
    area: { id: area.id, label: area.label },
    category: { id: category.id, label: category.label },
    destinations,
    generatedAt: new Date().toISOString(),
    ranking: "userRatingCount_desc_rating_desc",
    limitedResults: hasLimitedResults(destinations.length)
  };
}
