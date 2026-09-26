export interface ProductItem {
  name: string;
  price?: number | null;
  unit?: string | null;
  description?: string | null;
}

export interface BusinessHours {
  days?: string;
  open_time?: string;
  close_time?: string;
  closed_days?: string[];
}

export interface BusinessProfile {
  shop_name: string;
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
  interview_complete?: boolean;
}

export interface BusinessProfileEvent {
  type: "BUSINESS_PROFILE_UPDATE";
  profile: BusinessProfile;
}
