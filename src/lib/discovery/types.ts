export type CategoryId =
  | "food"
  | "nightlife-recreation"
  | "shopping"
  | "landmarks"
  | "campus-education"
  | "sport-fitness"
  | "services";

export type VisitorAreaId =
  | "district-1"
  | "district-2"
  | "district-3"
  | "district-4"
  | "district-5"
  | "district-6"
  | "district-7"
  | "district-9"
  | "district-10"
  | "district-11"
  | "binh-thanh"
  | "phu-nhuan"
  | "tan-binh"
  | "tan-phu"
  | "go-vap";

export type DestinationCategory = {
  id: CategoryId;
  label: string;
  placeTypes: string[];
};

export type VisitorArea = {
  id: VisitorAreaId;
  label: string;
  center: { lat: number; lng: number };
  radius: number;
};

export type Attribution = {
  provider?: string;
  providerUri?: string;
};

export type AuthorAttribution = {
  displayName: string;
  uri?: string;
  photoUri?: string;
};

export type Destination = {
  placeId: string;
  name: string;
  address?: string;
  types: string[];
  rating?: number;
  userRatingCount?: number;
  lat: number;
  lng: number;
  businessStatus?: string;
  googleMapsUri: string;
  attributions?: Attribution[];
  photo?: {
    proxyUrl: string;
    authorAttributions: AuthorAttribution[];
  };
};

export type DiscoveryOptionsResponse = {
  areas: Array<{ id: VisitorAreaId; label: string }>;
  categories: Array<{ id: CategoryId; label: string }>;
  defaultSelection: {
    areaId: "district-1";
    categoryId: "landmarks";
  };
};

export type DiscoverySearchRequest = {
  areaId: VisitorAreaId;
  categoryId: CategoryId;
};

export type DiscoverySearchResponse = {
  area: { id: VisitorAreaId; label: string };
  category: { id: CategoryId; label: string };
  destinations: Destination[];
  generatedAt: string;
  ranking: "userRatingCount_desc_rating_desc";
  limitedResults: boolean;
};
