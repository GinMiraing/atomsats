import { useSearchParams } from "@remix-run/react";
import { useCallback } from "react";

import useSetSearch from "@/lib/hooks/useSetSearch";

export const useFilters = () => {
  const { updateSearchParams } = useSetSearch();

  const [searchParams, _] = useSearchParams();
  const market: "bitatom" | "atomicalmarket" =
    searchParams.get("market") === "bitatom" ? "bitatom" : "atomicalmarket";
  const volumeRange = searchParams.get("volumeRange") || "1d";

  const setMarket = useCallback((market: "bitatom" | "atomicalmarket") => {
    updateSearchParams({ market });
  }, []);

  const setVolumeRange = useCallback((volumeRange: string) => {
    updateSearchParams({ volumeRange });
  }, []);

  return { market, volumeRange, setMarket, setVolumeRange };
};
