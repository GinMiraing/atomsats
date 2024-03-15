import useSWR from "swr";

import AxiosInstance from "@/lib/axios";
import { useToast } from "@/lib/hooks/useToast";
import { formatError } from "@/lib/utils/error-helpers";

import { CollectionResponse } from "../types";

export const useCollections = () => {
  const { toast } = useToast();

  const { data, isLoading, isValidating } = useSWR(
    "collections",
    async () => {
      try {
        const resp = await AxiosInstance.post<{
          data: CollectionResponse[];
          error: boolean;
          code: number;
        }>("/api/collections");

        if (resp.data.error) {
          throw new Error(resp.data.code.toString());
        }

        return resp.data.data;
      } catch (e) {
        toast({
          duration: 2000,
          variant: "destructive",
          title: "Failed to fetch collections",
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
