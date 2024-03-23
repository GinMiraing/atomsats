import { useSearchParams } from "@remix-run/react";
import { useDebounce } from "@uidotdev/usehooks";
import crypto from "crypto-js";
import useSWR from "swr";

import { useRealmFilters } from "@/routes/market.realm/hooks/useRealmFilters";

import AxiosInstance from "../axios";
import { OfferSummary } from "../types/market";
import { formatError } from "../utils/error-helpers";
import { useToast } from "./useToast";

const { SHA256 } = crypto;

const PAGE_SIZE = 30;

export const useGetRealmOffers = () => {
  const [searchParams] = useSearchParams();
  const { toast } = useToast();
  const { filters } = useRealmFilters();

  const debounceFilters = useDebounce(filters, 500);

  const page = parseInt(searchParams.get("page") || "1") || 1;
  const sort = searchParams.get("sort") || "price:asc";
  const encode = SHA256(JSON.stringify(debounceFilters || {})).toString();

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
          realmFilters: {
            name: filters.name,
            maxLength: filters.maxLength
              ? parseInt(filters.maxLength)
              : undefined,
            minLength: filters.minLength
              ? parseInt(filters.minLength)
              : undefined,
            maxPrice: filters.maxPrice ? parseInt(filters.maxPrice) : undefined,
            minPrice: filters.minPrice ? parseInt(filters.minPrice) : undefined,
            punycode: filters.punycode,
          },
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
    realmOffers: data,
    realmOffersLoading: isLoading,
    realmOffersValidating: isValidating,
    refreshRealmOffers: mutate,
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
    offers: data,
    offersLoading: isLoading,
    offersValidating: isValidating,
    refreshOffers: mutate,
  };
};
