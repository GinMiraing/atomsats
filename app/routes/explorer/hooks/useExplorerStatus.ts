import { create } from "zustand";

interface ExplorerStatus {
  isValidating: boolean;
  setIsValidating: (isValidating: boolean) => void;
}

export const useExplorerStatus = create<ExplorerStatus>((set) => ({
  isValidating: false,
  setIsValidating: (isValidating: boolean) => set({ isValidating }),
}));
