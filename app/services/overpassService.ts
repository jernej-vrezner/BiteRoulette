import { Restaurant, Filters } from '../types/restaurant';

const OVERPASS_URL = 'https://overpass-api.de/api/interpreter';

// Podprte kuhinje — razširljivo
export const CUISINE_OPTIONS = [
  { label: '🍕 Pizza', value: 'pizza' },
  { label: '🍔 Burger', value: 'burger' },
  { label: '🍣 Sushi', value: 'sushi' },
  { label: '🌮 Mehiška', value: 'mexican' },
  { label: '🍜 Azijska', value: 'asian' },
  { label: '🫒 Mediteranska', value: 'mediterranean' },
  { label: '🥩 Žar', value: 'grill' },
  { label: '🌱 Vegetarijansko', value: 'vegetarian' },
  { label: '🍗 Perutnina', value: 'chicken' },
  { label: '🍝 Italijanska', value: 'italian' },
  { label: '🍲 Slovenska', value: 'regional' },
];

function buildQuery(lat: number, lon: number, filters: Filters): string {
  const { radius, cuisines } = filters;

  const cuisineFilter =
    cuisines.length > 0
      ? `["cuisine"~"${cuisines.join('|')}",i]`
      : '';

  return `
    [out:json][timeout:25];
    (
      node["amenity"="restaurant"]${cuisineFilter}(around:${radius},${lat},${lon});
      way["amenity"="restaurant"]${cuisineFilter}(around:${radius},${lat},${lon});
      node["amenity"="cafe"]${cuisineFilter}(around:${radius},${lat},${lon});
    );
    out center;
  `;
}

function parseElement(el: any): Restaurant | null {
  const tags = el.tags || {};
  const name = tags.name;
  if (!name) return null;

  const lat = el.lat ?? el.center?.lat;
  const lon = el.lon ?? el.center?.lon;
  if (!lat || !lon) return null;

  const cuisineRaw: string = tags.cuisine ?? '';
  const cuisines = cuisineRaw
    .split(/[;,|]/)
    .map((c: string) => c.trim())
    .filter(Boolean);

  const street = tags['addr:street'] ?? '';
  const houseNumber = tags['addr:housenumber'] ?? '';
  const city = tags['addr:city'] ?? '';
  const address = [street, houseNumber, city].filter(Boolean).join(' ') || undefined;

  return {
    id: String(el.id),
    name,
    lat,
    lon,
    address,
    cuisine: cuisines.length > 0 ? cuisines : undefined,
    openingHours: tags['opening_hours'],
    phone: tags['phone'] ?? tags['contact:phone'],
    website: tags['website'] ?? tags['contact:website'],
  };
}

export async function fetchRestaurants(
  lat: number,
  lon: number,
  filters: Filters
): Promise<Restaurant[]> {
  const query = buildQuery(lat, lon, filters);

  const response = await fetch(OVERPASS_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: `data=${encodeURIComponent(query)}`,
  });

  if (!response.ok) {
    throw new Error(`Overpass API napaka: ${response.status}`);
  }

  const json = await response.json();
  const elements: any[] = json.elements ?? [];

  const restaurants = elements
    .map(parseElement)
    .filter((r): r is Restaurant => r !== null);

  return restaurants;
}

export function pickRandom<T>(arr: T[]): T | null {
  if (arr.length === 0) return null;
  return arr[Math.floor(Math.random() * arr.length)];
}

export function calculateDistance(
    lat1: number, lon1: number,
    lat2: number, lon2: number
): number {
    const R = 6371000; // polmer Zemlje v metrih
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a =
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(lat1 * Math.PI / 180) *
        Math.cos(lat2 * Math.PI / 180) *
        Math.sin(dLon / 2) * Math.sin(dLon / 2);
    return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}