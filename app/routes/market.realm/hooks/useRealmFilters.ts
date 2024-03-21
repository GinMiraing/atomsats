import { create } from "zustand";

interface RealmFilters {
  filterOpen: boolean;
  setFilterOpen: (open: boolean) => void;
  filters: {
    name: string;
    minLength: string;
    maxLength: string;
    minPrice: string;
    maxPrice: string;
    punycode: boolean;
  };
  setFilters: (filters: Partial<RealmFilters["filters"]>) => void;
}

export const useRealmFilters = create<RealmFilters>((set) => ({
  filterOpen: false,
  setFilterOpen: (open) => set({ filterOpen: open }),
  filters: {
    name: "",
    minLength: "",
    maxLength: "",
    minPrice: "",
    maxPrice: "",
    punycode: false,
  },
  setFilters: (filters) =>
    set((state) => ({ filters: { ...state.filters, ...filters } })),
}));
