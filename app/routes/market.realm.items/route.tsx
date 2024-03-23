import dayjs from "dayjs";
import { LayoutGrid, Loader2 } from "lucide-react";
import { useMemo } from "react";

import { useGetRealmItems } from "@/lib/hooks/useGetItems";
import { useSetSearch } from "@/lib/hooks/useSetSearch";

import { renderIndexerPreview } from "@/components/AtomicalPreview";
import { Button } from "@/components/Button";
import EmptyTip from "@/components/EmptyTip";
import GridList from "@/components/GridList";
import Pagination from "@/components/Pagination";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/Select";

import { useRealmFilters } from "../market.realm/hooks/useRealmFilters";

const SKELETON_ARRAY = new Array(20).fill(0).map((_, index) => index);

export default function MarketRealmItems() {
  const {
    data: realmsWithCount,
    isLoading: itemsLoading,
    isValidating: itemsValidating,
  } = useGetRealmItems();
  const { searchParams, updateSearchParams } = useSetSearch();

  const page = useMemo(
    () => parseInt(searchParams.get("page") || "1") || 1,
    [searchParams],
  );
  const total = useMemo(
    () => (realmsWithCount ? Math.ceil(realmsWithCount.count / 30) : 1),
    [realmsWithCount],
  );

  if (!realmsWithCount || itemsLoading) {
    return (
      <div className="w-full space-y-6">
        <Filter isValidating={itemsValidating} />
        <GridList>
          {SKELETON_ARRAY.map((index) => (
            <div
              key={index}
              className="w-full overflow-hidden rounded-md border"
            >
              <div className="aspect-square w-full animate-pulse bg-skeleton"></div>
              <div className="flex items-center justify-between border-t bg-secondary px-3 py-2">
                <div className="my-1 h-4 w-20 animate-pulse rounded-md bg-skeleton"></div>
                <div className="my-1 h-4 w-16 animate-pulse rounded-md bg-skeleton"></div>
              </div>
            </div>
          ))}
        </GridList>
      </div>
    );
  }

  return (
    <div className="w-full space-y-6">
      <Filter isValidating={itemsValidating} />
      {realmsWithCount.realms.length === 0 ? (
        <EmptyTip />
      ) : (
        <GridList>
          {realmsWithCount.realms.map((realm) => (
            <div
              key={realm.atomicalId}
              className="overflow-hidden rounded-md border"
            >
              <div className="relative flex aspect-square w-full items-center justify-center bg-black text-white">
                {renderIndexerPreview({
                  subtype: "realm",
                  atomicalId: realm.atomicalId,
                  payload: {
                    realm: realm.name,
                  },
                })}
                <div className="absolute left-3 top-3 flex rounded-md bg-theme px-1 py-0.5 text-xs">
                  REALM
                </div>
              </div>
              <div className="flex items-center justify-between border-t bg-secondary px-3 py-2">
                <a
                  href={`/atomical/${realm.atomicalId}`}
                  className="transition-colors hover:text-theme"
                >
                  # {realm.atomicalNumber}
                </a>
                <div>
                  {realm.mintTime > 0
                    ? dayjs.unix(realm.mintTime).fromNow(true)
                    : ""}
                </div>
              </div>
            </div>
          ))}
        </GridList>
      )}
      <Pagination
        page={page}
        total={total}
        onPageChange={(value) =>
          updateSearchParams({ page: value }, { action: "push", scroll: false })
        }
      />
    </div>
  );
}

const Filter: React.FC<{
  isValidating: boolean;
}> = ({ isValidating }) => {
  const { searchParams, updateSearchParams } = useSetSearch();
  const { setFilterOpen } = useRealmFilters();

  const sort = searchParams.get("sort") || "number:desc";

  return (
    <div className="flex w-full items-center justify-between">
      <div className="flex h-5 w-5 items-center justify-center">
        {isValidating ? (
          <Loader2 className="h-5 w-5 animate-spin" />
        ) : (
          <div className="h-1.5 w-1.5 animate-ping rounded-full bg-green-400"></div>
        )}
      </div>
      <div className="flex items-center space-x-2">
        <Button onClick={() => setFilterOpen(true)}>
          <LayoutGrid className="h-4 w-4" />
        </Button>
        <Select
          value={sort}
          onValueChange={(value) =>
            updateSearchParams(
              { sort: value },
              { action: "push", scroll: false },
            )
          }
        >
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Sort by" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="number:asc">Number: Low to High</SelectItem>
            <SelectItem value="number:desc">Number: High to Low</SelectItem>
          </SelectContent>
        </Select>
      </div>
    </div>
  );
};
