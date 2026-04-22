import { Restaurant, Filters } from '../types/restaurant';

const API_KEY = process.env.EXPO_PUBLIC_GOOGLE_PLACES_KEY ?? '';
const BASE_URL = 'https://places.googleapis.com/v1/places:searchNearby';

// Hierarhične kategorije kuhinj
export const CUISINE_CATEGORIES = [
  {
    label: '🌍 Evropska',
    value: 'european',
    options: [
      { label: 'Italijanska',   value: 'italian_restaurant' },
      { label: 'Mediteranska',  value: 'mediterranean_restaurant' },
      { label: 'Grška',         value: 'greek_restaurant' },
      { label: 'Španska',       value: 'spanish_restaurant' },
      { label: 'Francoska',     value: 'french_restaurant' },
    ],
  },
  {
    label: '🌏 Azijska',
    value: 'asian',
    options: [
      { label: 'Japonska',   value: 'japanese_restaurant' },
      { label: 'Sushi',      value: 'sushi_restaurant' },
      { label: 'Ramen',      value: 'ramen_restaurant' },
      { label: 'Kitajska',   value: 'chinese_restaurant' },
      { label: 'Tajska',     value: 'thai_restaurant' },
      { label: 'Indijska',   value: 'indian_restaurant' },
      { label: 'Korejska',   value: 'korean_restaurant' },
      { label: 'Vietnamska', value: 'vietnamese_restaurant' },
    ],
  },
  {
    label: '🌎 Ameriška',
    value: 'american',
    options: [
      { label: 'Burger',    value: 'hamburger_restaurant' },
      { label: 'BBQ',       value: 'barbecue_restaurant' },
      { label: 'Mehiška',   value: 'mexican_restaurant' },
      { label: 'Brazilska', value: 'brazilian_restaurant' },
    ],
  },
  {
    label: '🥩 Meso',
    value: 'meat',
    options: [
      { label: 'Steak', value: 'steak_house' },
    ],
  },
  {
    label: '🥗 Posebne',
    value: 'special',
    options: [
      { label: 'Vegetarijansko', value: 'vegetarian_restaurant' },
      { label: 'Vegansko',       value: 'vegan_restaurant' },
      { label: 'Morska hrana',   value: 'seafood_restaurant' },
      { label: 'Zajtrk/Brunch',  value: 'breakfast_restaurant' },
      { label: 'Pizza',          value: 'pizza_restaurant' },
      { label: 'Hitra hrana',    value: 'fast_food_restaurant' },
    ],
  },
];

// Pretvori Google Places odgovor v naš Restaurant tip
function parsePlace(place: any): Restaurant | null {
  const name = place.displayName?.text;
  const lat = place.location?.latitude;
  const lon = place.location?.longitude;

  if (!name || !lat || !lon) return null;

  // Cenovna raven: PRICE_LEVEL_INEXPENSIVE, MODERATE, EXPENSIVE, VERY_EXPENSIVE
  const priceLevelMap: Record<string, string> = {
    PRICE_LEVEL_FREE: '€',
    PRICE_LEVEL_INEXPENSIVE: '€',
    PRICE_LEVEL_MODERATE: '€€',
    PRICE_LEVEL_EXPENSIVE: '€€€',
    PRICE_LEVEL_VERY_EXPENSIVE: '€€€€',
  };

  const priceLevel = priceLevelMap[place.priceLevel] ?? undefined;

  // Delovni čas — vzamemo opis če obstaja
  const openingHours = place.regularOpeningHours?.weekdayDescriptions?.join(' | ') ?? undefined;

  return {
    id: place.id,
    name,
    lat,
    lon,
    address: place.formattedAddress,
    cuisine: place.types?.filter((t: string) => t.includes('restaurant') || t.includes('food')).slice(0, 2),
    openingHours,
    phone: place.nationalPhoneNumber,
    website: place.websiteUri,
    rating: place.rating,
    priceLevel,
  };
}

export async function fetchRestaurants(
  lat: number,
  lon: number,
  filters: Filters
): Promise<Restaurant[]> {

  // Določi katere tipe iščemo
  const includedTypes = filters.cuisines.length > 0
    ? filters.cuisines
    : ['restaurant'];

  const body = {
    includedTypes,
    maxResultCount: 20,
    locationRestriction: {
      circle: {
        center: { latitude: lat, longitude: lon },
        radius: filters.radius,
      },
    },
    ...(filters.openNow && { openNow: true }),
  };

  const response = await fetch(BASE_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Goog-Api-Key': API_KEY,
      'X-Goog-FieldMask': [
        'places.id',
        'places.displayName',
        'places.formattedAddress',
        'places.location',
        'places.types',
        'places.rating',
        'places.priceLevel',
        'places.regularOpeningHours',
        'places.nationalPhoneNumber',
        'places.websiteUri',
        'places.currentOpeningHours',
      ].join(','),
    },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    throw new Error(`Google Places API napaka: ${response.status}`);
  }

  const json = await response.json();
  const places: any[] = json.places ?? [];

  return places
    .map(parsePlace)
    .filter((r): r is Restaurant => r !== null);
}

export function pickRandom<T>(arr: T[]): T | null {
  if (arr.length === 0) return null;
  return arr[Math.floor(Math.random() * arr.length)];
}

export function calculateDistance(
  lat1: number, lon1: number,
  lat2: number, lon2: number
): number {
  const R = 6371000;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) *
    Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}
