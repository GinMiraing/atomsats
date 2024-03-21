import { useSearchParams } from "@remix-run/react";
import crypto from "crypto-js";
import useSWR from "swr";

import AxiosInstance from "../axios";
import { OfferSummary } from "../types/market";
import { formatError } from "../utils/error-helpers";
import { useToast } from "./useToast";

const { SHA256 } = crypto;

const PAGE_SIZE = 30;

export const useGetRealmOffers = (payload?: {
  isPunycode?: boolean;
  length?: number;
}) => {
  const [searchParams] = useSearchParams();
  const { toast } = useToast();

  const page = parseInt(searchParams.get("page") || "1") || 1;
  const sort = searchParams.get("sort") || "price:asc";
  const encode = SHA256(JSON.stringify(payload || {})).toString();

  const key = `offer-realm-${page}-${sort}-${encode}`;

  const { data, isLoading, isValidating, mutate } = useSWR(
    key,
    async () => {
      try {
        const { data } = await AxiosInstance.post<{
          data: {
            offers: OfferSummary[];
            count: number;
          };
          error: boolean;
          code: number;
        }>("/api/offer/market", {
          market: "realm",
          limit: PAGE_SIZE,
          offset: (page - 1) * PAGE_SIZE,
          sort,
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
      refreshInterval: 1000 * 10,
    },
  );

  return {
    data,
    isLoading,
    isValidating,
    mutate,
  };
};

export const useGetAllOffers = () => {
  const { toast } = useToast();

  const key = `offer-all`;

  const { data, isLoading, isValidating, mutate } = useSWR(
    key,
    async () => {
      try {
        const { data } = await AxiosInstance.post<{
          data: {
            offers: OfferSummary[];
            count: number;
          };
          error: boolean;
          code: number;
        }>("/api/offer/market", {
          market: "all",
          limit: 30,
          offset: 0,
          sort: "id:desc",
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
      refreshInterval: 1000 * 10,
    },
  );

  return {
    data,
    isLoading,
    isValidating,
    mutate,
  };
};
