import { create } from 'zustand';
import { Filters, Restaurant, UserRestaurant } from '../types/restaurant';

export interface Store {
    // Podatki
    filters: Filters;
    restaurants: Restaurant[];
    selected: Restaurant | null;
    isLoading: boolean;
    error: string | null;
    saved: UserRestaurant[];

    // Akcije
    setFilters: (filters: Filters) => void;
    setSelected: (restaurant: Restaurant | null) => void;
    setLoading: (loading: boolean) => void;
    setError: (error: string | null) => void;
    setRestaurants: (restaurants: Restaurant[]) => void;
    saveRestaurant: (restaurant: UserRestaurant) => void;
}

export const useAppStore = create<Store>((set) => ({
    // Začetne vrednosti
    filters: {
        cuisines: [],
        radius: 1500,
        openNow: false,
    },
    restaurants: [],
    selected: null,
    isLoading: false,
    error: null,
    saved: [],

    // Implementacija akcij
    setFilters:     (filters)     => set({ filters }),
    setSelected:    (restaurant)  => set({ selected: restaurant }),
    setLoading:     (loading)     => set({ isLoading: loading }),
    setError:       (error)       => set({ error }),
    setRestaurants: (restaurants) => set({ restaurants }),
    saveRestaurant: (restaurant)  => set((state) => ({
        saved: [...state.saved, restaurant],
    })),
}));