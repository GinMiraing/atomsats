import { useSearchParams } from "@remix-run/react";

const useSetSearch = () => {
  const [searchParams, setSearchParams] = useSearchParams();

  const updateSearchParams = (
    params: Record<string, any>,
    options?: {
      replace?: boolean;
      scroll?: boolean;
    },
  ) => {
    const newSearchParams =
      options?.replace || false
        ? new URLSearchParams()
        : new URLSearchParams(searchParams);

    Object.entries(params).forEach(([key, value]) => {
      newSearchParams.set(key, value);
    });

    setSearchParams(newSearchParams, {
      replace: true,
      preventScrollReset: options?.scroll || true,
    });
  };

  return {
    updateSearchParams,
  };
};

export default useSetSearch;
