import { useSearchParams } from "@remix-run/react";
import { useDebounce } from "@uidotdev/usehooks";
import crypto from "crypto-js";
import useSWR from "swr";

import { useRealmFilters } from "@/routes/market.realm/hooks/useRealmFilters";

import AxiosInstance from "../axios";
import { ContainerItemSummary, RealmItemSummary } from "../types/market";
import { formatError } from "../utils/error-helpers";
import { useToast } from "./useToast";

const { SHA256 } = crypto;

const PAGE_SIZE = 30;

export const useGetRealmItems = () => {
  const [searchParams] = useSearchParams();
  const { toast } = useToast();
  const { filters } = useRealmFilters();

  const debounceFilters = useDebounce(filters, 500);

  const page = parseInt(searchParams.get("page") || "1") || 1;
  const sort = searchParams.get("sort") || "number:desc";
  const encode = SHA256(JSON.stringify(debounceFilters || {})).toString();

  const key = `items-realm-${page}-${sort}-${encode}`;

  const { data, isLoading, isValidating, mutate } = useSWR(
    key,
    async () => {
      try {
        const { data } = await AxiosInstance.post<{
          data: {
            realms: RealmItemSummary[];
            count: number;
          };
          error: boolean;
          code: number;
        }>("/api/items/realm", {
          limit: PAGE_SIZE,
          offset: (page - 1) * PAGE_SIZE,
          sort,
          realmFilters: {
            name: debounceFilters.name,
            maxLength: debounceFilters.maxLength
              ? parseInt(debounceFilters.maxLength)
              : undefined,
            minLength: debounceFilters.minLength
              ? parseInt(debounceFilters.minLength)
              : undefined,
            punycode: debounceFilters.punycode,
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
          title: "Get items failed",
          description: formatError(e),
        });
      }
    },
    {
      refreshInterval: 1000 * 60,
    },
  );

  return {
    realmItems: data,
    realmItemsLoading: isLoading,
    realmItemsValidating: isValidating,
    refreshRealmItems: mutate,
  };
};

export const useGetContainerItems = (container: string) => {
  const [searchParams] = useSearchParams();
  const { toast } = useToast();

  const page = parseInt(searchParams.get("page") || "1") || 1;
  const sort = searchParams.get("sort") || "number:desc";

  const key = `items-collections-${page}-${sort}-${container}`;

  const { data, isLoading, isValidating, mutate } = useSWR(
    key,
    async () => {
      try {
        const { data } = await AxiosInstance.post<{
          data: {
            dmitems: ContainerItemSummary[];
            count: number;
          };
          error: boolean;
          code: number;
        }>("/api/items/dmitem", {
          limit: PAGE_SIZE,
          offset: (page - 1) * PAGE_SIZE,
          sort,
          container,
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
          title: "Get items failed",
          description: formatError(e),
        });
      }
    },
    {
      refreshInterval: 1000 * 60,
    },
  );

  return {
    containerItems: data,
    containerItemsLoading: isLoading,
    containerItemsValidating: isValidating,
    refreshContainerItems: mutate,
  };
};
