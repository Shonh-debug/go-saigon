export type PlaceSource = "maps-recents-seed" | "places-api";

export type PlaceCategory =
  | "Food & Nightlife"
  | "Shopping"
  | "Campus & Education"
  | "Sports & Fitness"
  | "Recreation"
  | "Services"
  | "Navigation";

export type DistrictArea =
  | "District 1 Core"
  | "District 7 / Tan Hung"
  | "Binh Hung"
  | "Citywide / Other";

export type Place = {
  id: string;
  name: string;
  category: PlaceCategory;
  types: string[];
  address?: string;
  districtArea?: DistrictArea;
  rating?: number;
  userRatingCount?: number;
  lat?: number;
  lng?: number;
  businessStatus?: string;
  googleMapsUri?: string;
  lastSeen?: string;
  source: PlaceSource;
};

export type PlaceSeed = {
  name: string;
  category: PlaceCategory;
  districtArea: DistrictArea;
  query: string;
  lastSeen: string;
  fallback?: Partial<Place>;
};
