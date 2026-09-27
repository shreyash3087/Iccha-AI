/**
 * Intelligent culinary and service image resolver for ICCHA AI storefronts.
 * Uses high-resolution authentic culinary imagery mapped to dish and service keywords.
 */

const CURATED_CULINARY_IMAGES: Record<string, string> = {
  // Indian Street Food & Chaat
  "palak patta chaat": "https://images.unsplash.com/photo-1653850280260-aa3b9e00b230?auto=format&fit=crop&w=800&q=85",
  "chaat": "https://images.unsplash.com/photo-1653850280260-aa3b9e00b230?auto=format&fit=crop&w=800&q=85",
  "golgappa": "https://images.unsplash.com/photo-1586357507341-3fbe59f2a5d9?auto=format&fit=crop&w=800&q=85",
  "pani puri": "https://images.unsplash.com/photo-1586357507341-3fbe59f2a5d9?auto=format&fit=crop&w=800&q=85",
  "samosa": "https://images.unsplash.com/photo-1601050690597-df0568f70950?auto=format&fit=crop&w=800&q=85",
  "kachori": "https://images.unsplash.com/photo-1626777552726-4a6b54c97e46?auto=format&fit=crop&w=800&q=85",
  "bhel": "https://images.unsplash.com/photo-1625398407796-82650a8c135f?auto=format&fit=crop&w=800&q=85",

  // Continental & Italian
  "bruschetta": "https://images.unsplash.com/photo-1506280754576-f6fa8a873550?auto=format&fit=crop&w=800&q=85",
  "tomato basil bruschetta": "https://images.unsplash.com/photo-1506280754576-f6fa8a873550?auto=format&fit=crop&w=800&q=85",
  "garlic bread": "https://images.unsplash.com/photo-1573140401552-3fab0b24306f?auto=format&fit=crop&w=800&q=85",
  "cheese bread": "https://images.unsplash.com/photo-1573140401552-3fab0b24306f?auto=format&fit=crop&w=800&q=85",
  "garlic cheese bread": "https://images.unsplash.com/photo-1573140401552-3fab0b24306f?auto=format&fit=crop&w=800&q=85",
  "mushroom bruschetta": "https://images.unsplash.com/photo-1721035993986-2547b311f9df?auto=format&fit=crop&w=800&q=85",
  "pizza": "https://images.unsplash.com/photo-1513104890138-7c749659a591?auto=format&fit=crop&w=800&q=85",
  "pasta": "https://images.unsplash.com/photo-1621996346565-e3d5d62810a9?auto=format&fit=crop&w=800&q=85",

  // Middle Eastern
  "hummus": "https://images.unsplash.com/photo-1637949385162-e416fb15b2ce?auto=format&fit=crop&w=800&q=85",
  "pita": "https://images.unsplash.com/photo-1637949385162-e416fb15b2ce?auto=format&fit=crop&w=800&q=85",
  "hummus pita": "https://images.unsplash.com/photo-1637949385162-e416fb15b2ce?auto=format&fit=crop&w=800&q=85",
  "falafel": "https://images.unsplash.com/photo-1593001872095-7d5b3868fb1d?auto=format&fit=crop&w=800&q=85",

  // Asian & Appetizers
  "spring rolls": "https://images.unsplash.com/photo-1695712641569-05eee7b37b6d?auto=format&fit=crop&w=800&q=85",
  "dragon rolls": "https://images.unsplash.com/photo-1695712641569-05eee7b37b6d?auto=format&fit=crop&w=800&q=85",
  "rolls": "https://images.unsplash.com/photo-1695712641569-05eee7b37b6d?auto=format&fit=crop&w=800&q=85",
  "nachos": "https://images.unsplash.com/photo-1582169296194-e4d644c48063?auto=format&fit=crop&w=800&q=85",
  "dim sum": "https://images.unsplash.com/photo-1541696432-82c6da8ce7bf?auto=format&fit=crop&w=800&q=85",
  "momos": "https://images.unsplash.com/photo-1625246333195-78d9c38ad449?auto=format&fit=crop&w=800&q=85",
  "noodles": "https://images.unsplash.com/photo-1569718212165-3a8278d5f624?auto=format&fit=crop&w=800&q=85",

  // Indian Curries & Mains
  "butter chicken": "https://images.unsplash.com/photo-1603894584373-5ac82b2ae398?auto=format&fit=crop&w=800&q=85",
  "chicken": "https://images.unsplash.com/photo-1589302168068-964664d93dc0?auto=format&fit=crop&w=800&q=85",
  "paneer": "https://images.unsplash.com/photo-1631452180519-c014fe946bc7?auto=format&fit=crop&w=800&q=85",
  "dal": "https://images.unsplash.com/photo-1546833999-b9f581a1996d?auto=format&fit=crop&w=800&q=85",
  "biryani": "https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?auto=format&fit=crop&w=800&q=85",
  "rice": "https://images.unsplash.com/photo-1516684732162-798a0062be99?auto=format&fit=crop&w=800&q=85",
  "thali": "https://images.unsplash.com/photo-1610057099431-d73a1c9d2f2f?auto=format&fit=crop&w=800&q=85",
  "roti": "https://images.unsplash.com/photo-1626777552726-4a6b54c97e46?auto=format&fit=crop&w=800&q=85",
  "naan": "https://images.unsplash.com/photo-1601050690597-df0568f70950?auto=format&fit=crop&w=800&q=85",

  // Beverages & Desserts
  "coffee": "https://images.unsplash.com/photo-1509042239860-f550ce710b93?auto=format&fit=crop&w=800&q=85",
  "shake": "https://images.unsplash.com/photo-1572490122747-3968b75cc699?auto=format&fit=crop&w=800&q=85",
  "tea": "https://images.unsplash.com/photo-1576092768241-dec231879fc3?auto=format&fit=crop&w=800&q=85",
  "dessert": "https://images.unsplash.com/photo-1551024709-8f23befc6f87?auto=format&fit=crop&w=800&q=85",
  "ice cream": "https://images.unsplash.com/photo-1560008511-11c63416e52d?auto=format&fit=crop&w=800&q=85",

  // Default Restaurant Interior / Culinary
  "default": "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&w=800&q=85",
};

/**
 * Returns a high-resolution authentic culinary image for any dish name.
 */
export function getDishImageUrl(dishName: string, existingUrl?: string | null): string {
  if (existingUrl && existingUrl.startsWith("http") && !existingUrl.includes("photo-1546833999-b9f581a1996d")) {
    return existingUrl;
  }

  const query = dishName.toLowerCase().trim();

  // 1. Direct match
  if (CURATED_CULINARY_IMAGES[query]) {
    return CURATED_CULINARY_IMAGES[query];
  }

  // 2. Substring match
  for (const [key, url] of Object.entries(CURATED_CULINARY_IMAGES)) {
    if (key !== "default" && query.includes(key)) {
      return url;
    }
  }

  // 3. Reverse substring match (e.g. key contains words in dish)
  const words = query.split(/\s+/).filter((w) => w.length > 3);
  for (const word of words) {
    for (const [key, url] of Object.entries(CURATED_CULINARY_IMAGES)) {
      if (key !== "default" && key.includes(word)) {
        return url;
      }
    }
  }

  return CURATED_CULINARY_IMAGES.default;
}

/**
 * Returns a high-resolution ambient hero cover photo matching the business category or name.
 */
export function getRestaurantHeroImage(shopName: string, category: string, existingUrl?: string | null): string {
  if (existingUrl && existingUrl.startsWith("http")) return existingUrl;

  const n = shopName.toLowerCase();
  if (n.includes("saucer") || n.includes("cafe") || n.includes("lounge") || n.includes("bar")) {
    return "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&w=1600&q=85";
  }
  if (n.includes("sweet") || n.includes("mithai") || n.includes("bakery")) {
    return "https://images.unsplash.com/photo-1509440159596-0249088772ff?auto=format&fit=crop&w=1600&q=85";
  }
  if (category === "service" || n.includes("salon") || n.includes("spa")) {
    return "https://images.unsplash.com/photo-1560066984-138dadb4c035?auto=format&fit=crop&w=1600&q=85";
  }
  return "https://images.unsplash.com/photo-1555396273-367ea4eb4db5?auto=format&fit=crop&w=1600&q=85";
}
