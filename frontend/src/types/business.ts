export interface GooglePlaceCandidate {
  place_id: string;
  name: string;
  address: string;
  rating?: number | null;
  user_ratings_total?: number | null;
}

export interface ProductItem {
  name: string;
  price?: number | null;
  unit?: string | null;
  item_type?: "product" | "service";
  description?: string | null;
  category?: string | null;
}

export type OfferingItem = ProductItem;

export interface BusinessHours {
  days?: string;
  open_time?: string;
  close_time?: string;
  closed_days?: string[];
}

export interface BusinessProfile {
  shop_name: string;
  business_type?: "retail" | "service" | "restaurant_cafe" | "general";
  owner_name?: string | null;
  category?: string;
  tagline?: string | null;
  locality?: string | null;
  city?: string | null;
  address?: string | null;
  phone?: string | null;
  whatsapp?: string | null;
  hours?: BusinessHours;
  products?: ProductItem[];
  offers?: string[];
  rating?: number | null;
  total_reviews?: number | null;
  places_id?: string | null;
  verified_via_places?: boolean;
  google_candidates?: GooglePlaceCandidate[];
  wants_google_review_help?: boolean | null;
  temp_slug?: string | null;
  temp_url?: string | null;
  interview_complete?: boolean;
}

export interface BusinessProfileEvent {
  type: "BUSINESS_PROFILE_UPDATE";
  profile: BusinessProfile;
}

export interface ImageUploadEvent {
  type: "IMAGE_UPLOAD_STARTED";
  filename?: string;
}

export interface ImageItemsExtractedEvent {
  type: "IMAGE_ITEMS_EXTRACTED";
  items: ProductItem[];
}
