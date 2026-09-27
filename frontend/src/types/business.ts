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
  image_url?: string | null;
}

export type OfferingItem = ProductItem;

export interface ReviewItem {
  id: string;
  author_name: string;
  rating: number; // 1 to 5
  text: string;
  relative_time?: string;
  verified?: boolean;
}

export interface GalleryItem {
  id: string;
  url: string;
  alt: string;
  caption?: string;
  tag?: string;
}

export interface HighlightItem {
  id: string;
  title: string;
  description: string;
  icon?: string; // "star" | "shield" | "truck" | "leaf" | "sparkles" | "clock" | "award"
}

export interface FAQItem {
  id: string;
  question: string;
  answer: string;
}

export interface StorySectionData {
  heading?: string;
  content?: string;
  established_year?: string;
  image_url?: string;
  stats?: Array<{ label: string; value: string }>;
}

export interface BannerItem {
  id: string;
  badge?: string;
  title: string;
  subtitle?: string;
  cta_text?: string;
  cta_link?: string;
}

export type SectionType =
  | "hero"
  | "highlights"
  | "catalog"
  | "reviews"
  | "gallery"
  | "story"
  | "offers"
  | "faq"
  | "contact"
  | "custom";

export interface SiteSection {
  id: string;
  type: SectionType;
  title?: string;
  subtitle?: string;
  enabled: boolean;
  layout_variant?: string;
  data?: {
    reviews?: ReviewItem[];
    gallery?: GalleryItem[];
    highlights?: HighlightItem[];
    faqs?: FAQItem[];
    story?: StorySectionData;
    banner?: BannerItem;
    custom_html?: string;
    image_url?: string;
  };
}

export interface DesignTokens {
  font_family?: string;
  radius?: "none" | "sm" | "md" | "lg" | "full";
  shadow?: "none" | "subtle" | "elevated" | "glow";
  hero_layout?: "split" | "centered" | "banner" | "minimal";
  header_image?: string;
}

export interface BusinessHours {
  days?: string;
  open_time?: string;
  close_time?: string;
  closed_days?: string[];
}

// Top-level category — drives which template group is shown
export type BusinessCategory = "product" | "service" | "other";

// Template IDs — agents choose from these
export type ProductTemplateId =
  | "product-classic"
  | "product-bold"
  | "product-minimal"
  | "product-warm"
  | "product-fresh";

export type ServiceTemplateId =
  | "service-elegant"
  | "service-modern"
  | "service-warm"
  | "service-bold"
  | "service-clean";

export type OtherTemplateId =
  | "other-simple"
  | "other-grid"
  | "other-card"
  | "other-minimal"
  | "other-flex";

export type TemplateId = ProductTemplateId | ServiceTemplateId | OtherTemplateId;

export interface BusinessProfile {
  shop_name: string;
  owner_name?: string | null;
  category?: BusinessCategory;
  template_id?: TemplateId | null;
  primary_color?: string | null;
  accent_color?: string | null;
  header_image?: string | null;
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
  sections?: SiteSection[];
  design_tokens?: DesignTokens;
  user_id?: string | null;
  user_email?: string | null;
  approved?: boolean;
  approved_at?: string | null;
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
