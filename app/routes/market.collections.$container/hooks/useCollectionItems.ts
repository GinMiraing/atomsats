import useSWR from "swr";

import AxiosInstance from "@/lib/axios";
import { useToast } from "@/lib/hooks/useToast";
import { formatError } from "@/lib/utils/error-helpers";

import { CollectionItemResponse } from "../types";

export const useCollectionItems = (container: string) => {
  const { toast } = useToast();

  const { data, isLoading, isValidating, mutate } = useSWR(
    `${container}-items`,
    async () => {
      try {
        const resp = await AxiosInstance.post<{
          data: CollectionItemResponse[];
          error: boolean;
          code: number;
        }>(`/api/collections/${container}/items`);

        if (resp.data.error) {
          throw new Error(resp.data.code.toString());
        }

        return resp.data.data;
      } catch (e) {
        toast({
          duration: 2000,
          variant: "destructive",
          title: "Failed to fetch container items",
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
  };
};
