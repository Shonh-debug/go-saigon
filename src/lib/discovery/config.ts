import type { Feature, FeatureCollection, MultiPolygon, Polygon, Position } from "geojson";
import booleanPointInPolygon from "@turf/boolean-point-in-polygon";
import { point } from "@turf/helpers";
import visitorAreaGeoJson from "../../../public/data/visitor-areas.json";
import type {
  CategoryId,
  Destination,
  DestinationCategory,
  DiscoveryOptionsResponse,
  VisitorArea,
  VisitorAreaId
} from "./types";

type VisitorFeatureProperties = { id: VisitorAreaId; label: string };
type VisitorFeature = Feature<Polygon | MultiPolygon, VisitorFeatureProperties>;

const boundaries = visitorAreaGeoJson as FeatureCollection<Polygon | MultiPolygon, VisitorFeatureProperties>;

export const categories: DestinationCategory[] = [
  { id: "food", label: "Food", placeTypes: ["restaurant", "vietnamese_restaurant", "cafe", "coffee_shop", "bakery", "food_court"] },
  {
    id: "nightlife-recreation",
    label: "Nightlife & Recreation",
    placeTypes: ["night_club", "bar", "karaoke", "amusement_center", "amusement_park", "movie_theater", "park", "zoo"]
  },
  { id: "shopping", label: "Shopping", placeTypes: ["shopping_mall", "market", "department_store", "clothing_store", "gift_shop", "store"] },
  {
    id: "landmarks",
    label: "Landmarks",
    placeTypes: ["tourist_attraction", "museum", "historical_landmark", "cultural_landmark", "monument", "art_gallery"]
  },
  { id: "campus-education", label: "Campus & Education", placeTypes: ["university", "library", "school"] },
  {
    id: "sport-fitness",
    label: "Sport & Fitness",
    placeTypes: ["gym", "fitness_center", "sports_complex", "stadium", "athletic_field", "swimming_pool"]
  },
  { id: "services", label: "Services", placeTypes: ["tour_agency", "tourist_information_center", "travel_agency", "spa"] }
];

function positions(value: Position | Position[] | Position[][] | Position[][][]): Position[] {
  if (typeof value[0] === "number") return [value as Position];
  return (value as Array<Position | Position[] | Position[][]>).flatMap((item) => positions(item));
}

function featureFor(areaId: VisitorAreaId): VisitorFeature {
  const feature = boundaries.features.find((candidate) => candidate.properties.id === areaId);
  if (!feature) throw new Error(`Boundary not found for ${areaId}`);
  return feature;
}

function geometrySearchCircle(feature: VisitorFeature) {
  const points = positions(feature.geometry.coordinates);
  const bounds = points.reduce(
    (result, [lng, lat]) => ({
      minLng: Math.min(result.minLng, lng),
      maxLng: Math.max(result.maxLng, lng),
      minLat: Math.min(result.minLat, lat),
      maxLat: Math.max(result.maxLat, lat)
    }),
    { minLng: Infinity, maxLng: -Infinity, minLat: Infinity, maxLat: -Infinity }
  );
  const center = {
    lat: (bounds.minLat + bounds.maxLat) / 2,
    lng: (bounds.minLng + bounds.maxLng) / 2
  };
  const latitudeMeters = (bounds.maxLat - bounds.minLat) * 111_320;
  const longitudeMeters = (bounds.maxLng - bounds.minLng) * 109_300;
  const radius = Math.min(50_000, Math.max(1_200, Math.ceil(Math.hypot(latitudeMeters, longitudeMeters) / 2 + 500)));
  return { center, radius };
}

export const visitorAreas: VisitorArea[] = boundaries.features.map((feature) => ({
  id: feature.properties.id,
  label: feature.properties.label,
  ...geometrySearchCircle(feature)
}));

export const discoveryOptions: DiscoveryOptionsResponse = {
  areas: visitorAreas.map(({ id, label }) => ({ id, label })),
  categories: categories.map(({ id, label }) => ({ id, label })),
  defaultSelection: { areaId: "district-1", categoryId: "landmarks" }
};

export function getCategory(categoryId: string) {
  return categories.find((category) => category.id === categoryId);
}

export function getVisitorArea(areaId: string) {
  return visitorAreas.find((area) => area.id === areaId);
}

export function isInsideVisitorArea(destination: Pick<Destination, "lat" | "lng">, areaId: VisitorAreaId) {
  return booleanPointInPolygon(point([destination.lng, destination.lat]), featureFor(areaId));
}

export function rankDestinations(destinations: Destination[]) {
  return [...destinations].sort((left, right) => {
    const reviewDelta = (right.userRatingCount ?? 0) - (left.userRatingCount ?? 0);
    if (reviewDelta !== 0) return reviewDelta;
    const ratingDelta = (right.rating ?? 0) - (left.rating ?? 0);
    if (ratingDelta !== 0) return ratingDelta;
    return left.name.localeCompare(right.name);
  });
}

export function dedupeDestinations(destinations: Destination[]) {
  return Array.from(new Map(destinations.map((destination) => [destination.placeId, destination])).values());
}

export function isOperatingDestination(destination: Destination) {
  return destination.businessStatus !== "CLOSED_PERMANENTLY";
}

export function hasLimitedResults(resultCount: number) {
  return resultCount < 15;
}
