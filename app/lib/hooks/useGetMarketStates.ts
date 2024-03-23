import useSWR from "swr";

import AxiosInstance from "../axios";
import { CollectionMarketStates, RealmMarketStates } from "../types/market";
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
          title: "Get realm states failed",
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

export const useCollectionsMarketStates = () => {
  const { toast } = useToast();

  const { data, isLoading, isValidating } = useSWR(
    "states-market-collections",
    async () => {
      try {
        const resp = await AxiosInstance.post<{
          data: CollectionMarketStates[];
          error: boolean;
          code: number;
        }>("/api/state/market/collections");

        if (resp.data.error) {
          throw new Error(resp.data.code.toString());
        }

        return resp.data.data;
      } catch (e) {
        toast({
          duration: 2000,
          variant: "destructive",
          title: "Get collections states failed",
          description: formatError(e),
        });
      }
    },
    {
      refreshInterval: 1000 * 60,
    },
  );

  return {
    collections: data,
    collectionsLoading: isLoading,
    collectionsValidating: isValidating,
  };
};

export const useContainerMarketStates = (container: string) => {
  const { toast } = useToast();

  const { data, isLoading, isValidating } = useSWR(
    `states-market-collections-${container}`,
    async () => {
      try {
        const resp = await AxiosInstance.post<{
          data: Omit<CollectionMarketStates, "container" | "rank">;
          error: boolean;
          code: number;
        }>(`/api/state/market/collections/${container}`);

        if (resp.data.error) {
          throw new Error(resp.data.code.toString());
        }

        return resp.data.data;
      } catch (e) {
        toast({
          duration: 2000,
          variant: "destructive",
          title: "Get container states failed",
          description: formatError(e),
        });
      }
    },
    {
      refreshInterval: 1000 * 60,
    },
  );

  return {
    containerData: data,
    containerLoading: isLoading,
    containerValidating: isValidating,
  };
};
