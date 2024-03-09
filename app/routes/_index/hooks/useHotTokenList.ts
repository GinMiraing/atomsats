import useSWR from "swr";

import AxiosInstance from "@/lib/axios";
import { useToast } from "@/lib/hooks/useToast";
import { formatError } from "@/lib/utils/error-helpers";

import { TokenResponse } from "../types";

export const useHotTokenList = () => {
  const { toast } = useToast();

  const { data, isLoading, isValidating, mutate } = useSWR(
    "market-tokens",
    async () => {
      try {
        const resp = await AxiosInstance.post<{
          data: {
            tokens: TokenResponse[];
          };
          error: boolean;
          code: number;
        }>("/api/tokens/market");

        if (resp.data.error) {
          throw new Error(resp.data.code.toString());
        }

        return resp.data.data.tokens;
      } catch (e) {
        toast({
          duration: 2000,
          variant: "destructive",
          title: "Failed to fetch tokens",
          description: formatError(e),
        });
      }
    },
    {
      refreshInterval: 1000 * 60,
    },
  );

  return {
    data,
    isLoading,
    isValidating,
    mutate,
  };
};
