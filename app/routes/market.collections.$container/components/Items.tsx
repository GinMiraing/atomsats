import { useSearchParams } from "@remix-run/react";
import dayjs from "dayjs";
import { useCallback, useMemo } from "react";

import { useSetSearch } from "@/lib/hooks/useSetSearch";

import { renderIndexerPreview } from "@/components/AtomicalPreview";
import Pagination from "@/components/Pagination";
import PunycodeString from "@/components/PunycodeString";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/Select";

import { useCollectionItems } from "../hooks/useCollectionItems";
import { CollectionItemResponse } from "../types";

const ITEMS_PER_PAGE = 20;
const SKELETON_ITEMS = 20;

const Items: React.FC<{
  container: string;
}> = ({ container }) => {
  const { data } = useCollectionItems(container);

  const { updateSearchParams } = useSetSearch();

  const [searchParams, _] = useSearchParams();
  const page = searchParams.get("page") || "1";
  const sorting = searchParams.get("sorting") || "dmitem:asc";

  const setFilters = useCallback(
    (filters: { page: string; sorting: string }) => {
      updateSearchParams({ ...filters, type: "items" });
    },
    [],
  );

  const getSortValue = useCallback(
    (dmitem: CollectionItemResponse, sortKey: string) => {
      const mappings = {
        number: dmitem.atomicalNumber,
        dmitem: dmitem.dmitem,
        mintTime: dmitem.mintTime,
      };

      const validSortKeys: (keyof typeof mappings)[] = [
        "number",
        "dmitem",
        "mintTime",
      ];
      const sortKeyValue = validSortKeys.includes(
        sortKey as keyof typeof mappings,
      )
        ? mappings[sortKey as keyof typeof mappings]
        : 0;

      return sortKeyValue;
    },
    [],
  );

  const sortedCollections = useMemo(() => {
    if (data && data.length > 0) {
      const [sortKey, sortDirection] = sorting.split(":");

      const sorted = data
        .map((item) => ({
          ...item,
          sortValue: getSortValue(item, sortKey),
        }))
        .sort((a, b) => {
          const aValue = isNaN(Number(a.sortValue))
            ? a.sortValue
            : Number(a.sortValue);
          const bValue = isNaN(Number(b.sortValue))
            ? b.sortValue
            : Number(b.sortValue);

          if (typeof aValue === "number" && typeof bValue === "number") {
            return sortDirection === "asc" ? aValue - bValue : bValue - aValue;
          } else if (typeof aValue === "string" && typeof bValue === "string") {
            return sortDirection === "asc"
              ? aValue.localeCompare(bValue)
              : bValue.localeCompare(aValue);
          }

          return typeof aValue === "number" ? -1 : 1;
        });

      return sorted.slice(
        (parseInt(page) - 1) * ITEMS_PER_PAGE,
        parseInt(page) * ITEMS_PER_PAGE,
      );
    } else {
      return [];
    }
  }, [data, page, sorting]);

  const totalPage = useMemo(() => {
    if (data) {
      return Math.ceil(data.length / ITEMS_PER_PAGE);
    }

    return 0;
  }, [data]);

  const skeletonArray = useMemo(() => {
    return Array.from({ length: SKELETON_ITEMS }).map((_, index) => index);
  }, []);

  if (!data) {
    return (
      <div className="space-y-4">
        <div className="flex justify-end">
          <Select disabled>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Sort By" />
            </SelectTrigger>
          </Select>
        </div>
        <div className="grid w-full grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4 lg:gap-5 xl:grid-cols-5 xl:gap-6">
          {skeletonArray.map((item) => (
            <div
              key={item}
              className="w-full overflow-hidden rounded-md border shadow-md"
            >
              <div className="relative aspect-square w-full animate-pulse bg-skeleton"></div>
              <div className="flex w-full flex-col items-center space-y-4 border-t bg-secondary px-3 py-2">
                <div className="flex w-full items-center justify-between">
                  <div className="h-5 w-20 animate-pulse rounded bg-skeleton"></div>
                  <div className="h-5 w-20 animate-pulse rounded bg-skeleton"></div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Select
          value={sorting}
          onValueChange={(value) => setFilters({ sorting: value, page })}
        >
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="sort by" />
          </SelectTrigger>
          <SelectContent align="end">
            <SelectItem value="dmitem:asc">Dmitem Low to High</SelectItem>
            <SelectItem value="dmitem:desc">Dmitem High to Low</SelectItem>
            <SelectItem value="number:asc">
              Atomical Number Low to High
            </SelectItem>
            <SelectItem value="number:desc">
              Atomical Number High to Low
            </SelectItem>
            <SelectItem value="mintTime:asc">Mint Time Old to New</SelectItem>
            <SelectItem value="mintTime:desc">Mint Time New to Old</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <div className="grid w-full grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4 lg:gap-5 xl:grid-cols-5 xl:gap-6">
        {sortedCollections.map((item) => (
          <div
            key={item.atomicalId}
            className="w-full overflow-hidden rounded-md border shadow-md"
          >
            <div className="relative flex aspect-square w-full items-center justify-center bg-primary">
              {renderIndexerPreview({
                subtype: "dmitem",
                atomicalId: item.atomicalId,
                payload: {},
              })}
              <div className="absolute left-2 top-2 rounded bg-theme px-1.5 text-sm text-white">
                <PunycodeString children={item.dmitem} />
              </div>
            </div>
            <div className="flex w-full flex-col items-center space-y-4 border-t bg-secondary px-3 py-2">
              <div className="flex w-full items-center justify-between text-sm">
                <a
                  href={`/atomical/${item.atomicalId}`}
                  target="_blank"
                  className="text-primary transition-colors hover:text-theme"
                >
                  #{item.atomicalNumber}
                </a>
                <div>{dayjs.unix(item.mintTime).fromNow()}</div>
              </div>
            </div>
          </div>
        ))}
      </div>
      <Pagination
        page={parseInt(page)}
        total={totalPage}
        onPageChange={(page) => setFilters({ page: page.toString(), sorting })}
      />
    </div>
  );
};

export default Items;
