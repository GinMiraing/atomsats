import useSWR from "swr";

import AxiosInstance from "../axios";
import { RealmMarketStates } from "../types/market";
import { formatError } from "../utils/error-helpers";
import { useToast } from "./useToast";

export const useGetRealmMarketStates = () => {
  const { toast } = useToast();

  const key = `states-market-realm`;

  const { data, isLoading, isValidating } = useSWR(
    key,
    async () => {
      try {
        const { data } = await AxiosInstance.post<{
          data: RealmMarketStates;
          error: boolean;
          code: number;
        }>("/api/state/market/realm");

        if (data.error) {
          throw new Error(data.code.toString());
        }

        return data.data;
      } catch (e) {
        console.log(e);
        toast({
          variant: "destructive",
          duration: 2000,
          title: "Get offers failed",
          description: formatError(e),
        });
      }
    },
    {
      refreshInterval: 1000 * 60 * 5,
    },
  );

  return {
    realmMarketStates: data,
    realmMarketStatesLoading: isLoading,
    realmMarketStatesValidating: isValidating,
  };
};
