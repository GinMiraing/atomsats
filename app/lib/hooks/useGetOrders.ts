import { useSearchParams } from "@remix-run/react";
import crypto from "crypto-js";
import useSWR from "swr";

import AxiosInstance from "../axios";
import { OrderSummary } from "../types/market";
import { formatError } from "../utils/error-helpers";
import { useToast } from "./useToast";

const { SHA256 } = crypto;

const PAGE_SIZE = 50;

export const useGetMarketOrders = (payload?: {
  market?: string;
  container?: string;
}) => {
  const [searchParams] = useSearchParams();
  const { toast } = useToast();

  const page = parseInt(searchParams.get("page") || "1") || 1;
  const encode = SHA256(JSON.stringify(payload || {})).toString();

  const key = `order-${payload?.market}-${page}-${encode}`;

  const { data, isLoading, isValidating, mutate } = useSWR(
    key,
    async () => {
      try {
        const { data } = await AxiosInstance.post<{
          data: {
            offers: OrderSummary[];
            count: number;
          };
          error: boolean;
          code: number;
        }>("/api/offer/market", {
          market: payload?.market,
          limit: PAGE_SIZE,
          offset: (page - 1) * PAGE_SIZE,
          container: payload?.container,
        });

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
    data,
    isLoading,
    isValidating,
    mutate,
  };
};
