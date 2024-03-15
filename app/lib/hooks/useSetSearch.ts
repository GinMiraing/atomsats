import { useSearchParams } from "@remix-run/react";

export const useSetSearch = () => {
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

    if (!("page" in params)) {
      newSearchParams.delete("page");
    }

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
