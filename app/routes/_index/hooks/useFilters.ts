import { useSearchParams } from "@remix-run/react";
import { useCallback } from "react";

import { useSetSearch } from "@/lib/hooks/useSetSearch";

export const useFilters = () => {
  const { updateSearchParams } = useSetSearch();

  const [searchParams, _] = useSearchParams();
  const page = searchParams.get("page") || "1";

  const setFilters = useCallback((filters: { page: string }) => {
    updateSearchParams(filters);
  }, []);

  return { page, setFilters };
};
