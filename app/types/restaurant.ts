export interface Restaurant {
  id: string;
  name: string;
  lat: number;
  lon: number;
  address?: string;
  cuisine?: string[];
  openingHours?: string;
  phone?: string;
  website?: string;
  rating?: number;      // 1.0 - 5.0
  priceLevel?: string;  // €, €€, €€€, €€€€
}

export interface UserRestaurant extends Restaurant {
  personalRating?: number; // 1-5
  visited?: boolean;
  notes?: string;
  savedAt?: string;
}

export interface Filters {
  cuisines: string[];   // prazno = vse
  radius: number;       // v metrih
  openNow: boolean;
}
