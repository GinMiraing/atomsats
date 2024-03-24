import { LoaderFunction, json } from "@remix-run/node";
import { useLoaderData } from "@remix-run/react";
import dayjs from "dayjs";
import { Loader2 } from "lucide-react";
import { useMemo } from "react";

import { useGetContainerItems } from "@/lib/hooks/useGetItems";
import { useSetSearch } from "@/lib/hooks/useSetSearch";

import { renderIndexerPreview } from "@/components/AtomicalPreview";
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

export const loader: LoaderFunction = async ({ params }) => {
  const { container } = params as { container: string };

  return json({
    container,
  });
};

const SKELETON_ARRAY = new Array(20).fill(0).map((_, index) => index);

export default function MarketContainerItems() {
  const { container } = useLoaderData<{
    container: string;
  }>();

  const { containerItems, containerItemsLoading, containerItemsValidating } =
    useGetContainerItems(container);
  const { searchParams, updateSearchParams } = useSetSearch();

  const page = useMemo(
    () => parseInt(searchParams.get("page") || "1") || 1,
    [searchParams],
  );
  const total = useMemo(
    () => (containerItems ? Math.ceil(containerItems.count / 30) : 1),
    [containerItems],
  );

  if (!containerItems || containerItemsLoading) {
    return (
      <div className="w-full space-y-6">
        <Filter isValidating={containerItemsValidating} />
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
      <Filter isValidating={containerItemsValidating} />
      {containerItems.dmitems.length === 0 ? (
        <EmptyTip />
      ) : (
        <GridList>
          {containerItems.dmitems.map((dmitem) => (
            <div
              key={dmitem.atomicalId}
              className="overflow-hidden rounded-md border"
            >
              <div className="relative flex aspect-square w-full items-center justify-center bg-primary text-white">
                {renderIndexerPreview({
                  subtype: "dmitem",
                  atomicalId: dmitem.atomicalId,
                  payload: {
                    parentContainer: container,
                  },
                })}
                <div className="absolute left-3 top-3 flex rounded-md bg-theme px-1 py-0.5 text-xs">
                  {dmitem.dmitem?.toUpperCase() || "DMITEM"}
                </div>
              </div>
              <div className="flex items-center justify-between border-t bg-secondary px-3 py-2">
                <a
                  href={`/atomical/${dmitem.atomicalId}`}
                  className="transition-colors hover:text-theme"
                >
                  # {dmitem.atomicalNumber}
                </a>
                <div>
                  {dmitem.mintTime > 0
                    ? dayjs.unix(dmitem.mintTime).fromNow(true)
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
            <SelectItem value="dmitem:asc">Name: Low to High</SelectItem>
            <SelectItem value="dmitem:desc">Name: High to Low</SelectItem>
          </SelectContent>
        </Select>
      </div>
    </div>
  );
};
