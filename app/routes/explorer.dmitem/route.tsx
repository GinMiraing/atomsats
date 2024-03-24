import dayjs from "dayjs";
import { useEffect, useMemo } from "react";
import useSWR from "swr";

import AxiosInstance from "@/lib/axios";
import { useSetSearch } from "@/lib/hooks/useSetSearch";
import { useToast } from "@/lib/hooks/useToast";
import { cn } from "@/lib/utils";
import { formatError } from "@/lib/utils/error-helpers";

import { renderIndexerPreview } from "@/components/AtomicalPreview";
import { Button } from "@/components/Button";
import EmptyTip from "@/components/EmptyTip";
import GridList from "@/components/GridList";

import { useExplorerStatus } from "../explorer/hooks/useExplorerStatus";

const skeletons = new Array(20).fill(0);
const buttons = new Array(5).fill(0);

export default function ExplorerRealm() {
  const { toast } = useToast();
  const { searchParams, updateSearchParams } = useSetSearch();
  const { setIsValidating } = useExplorerStatus();

  const page = useMemo(
    () => parseInt(searchParams.get("page") || "1") || 1,
    [searchParams],
  );

  const { data, isLoading, isValidating } = useSWR(
    "explorer-dmitem",
    async () => {
      try {
        const { data: realms } = await AxiosInstance.post<{
          data: {
            atomicalId: string;
            atomicalNumber: number;
            mintTime: number;
            container: string;
          }[];
          error: boolean;
          code: number;
        }>("/api/explorer/dmitem");

        if (realms.error) {
          throw new Error(realms.code.toString());
        }

        return realms.data.map((atomical) => ({
          atomicalId: atomical.atomicalId,
          atomicalNumber: atomical.atomicalNumber,
          type: "NFT",
          subtype: "dmitem",
          container: atomical.container,
          mintTime: atomical.mintTime,
        }));
      } catch (e) {
        toast({
          variant: "destructive",
          duration: 2000,
          title: "Get realm failed",
          description: formatError(e),
        });
      }
    },
    {
      refreshInterval: 1000 * 60,
    },
  );

  useEffect(() => {
    setIsValidating(isValidating);
  }, [isValidating]);

  if (!data || isLoading) {
    return (
      <div className="space-y-6">
        <GridList>
          <LoadingSkeleton />
        </GridList>
        <div className="flex items-center justify-center space-x-2">
          {buttons.map((_, i) => (
            <Button
              key={i}
              className={cn("hover:bg-theme hover:text-white", {
                "bg-theme text-white": page === i + 1,
                "bg-secondary text-primary": page !== i + 1,
              })}
              disabled
            >
              {i + 1}
            </Button>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <GridList>
        {data ? (
          data.slice((page - 1) * 20, page * 20).map((atomical) => (
            <div
              key={atomical.atomicalId}
              className="overflow-hidden rounded-md border"
            >
              <div className="relative flex aspect-square w-full items-center justify-center bg-primary text-white">
                {renderIndexerPreview({
                  subtype: "dmitem",
                  atomicalId: atomical.atomicalId,
                  payload: {
                    parentContainer: atomical.container,
                  },
                })}
                <div className="absolute left-3 top-3 flex rounded-md bg-theme px-1 py-0.5 text-xs">
                  DMITEM
                </div>
              </div>
              <div className="flex items-center justify-between border-t bg-secondary px-3 py-2">
                <a
                  href={`/atomical/${atomical.atomicalId}`}
                  className="transition-colors hover:text-theme"
                >
                  # {atomical.atomicalNumber}
                </a>
                <div>
                  {atomical.mintTime > 0
                    ? dayjs.unix(atomical.mintTime).fromNow(true)
                    : ""}
                </div>
              </div>
            </div>
          ))
        ) : (
          <EmptyTip />
        )}
      </GridList>
      <div className="flex items-center justify-center space-x-2">
        {buttons.map((_, i) => (
          <Button
            key={i}
            onClick={() =>
              updateSearchParams({
                page: i + 1,
              })
            }
            className={cn(
              "transition-colors hover:bg-theme hover:text-white hover:opacity-100",
              {
                "bg-theme text-white": page === i + 1,
                "bg-secondary text-primary": page !== i + 1,
              },
            )}
            disabled={isLoading || isValidating || page === i + 1}
          >
            {i + 1}
          </Button>
        ))}
      </div>
    </div>
  );
}

const LoadingSkeleton: React.FC = () => {
  return (
    <>
      {skeletons.map((_, i) => (
        <div
          key={i}
          className="w-full overflow-hidden rounded-md border"
        >
          <div className="aspect-square w-full animate-pulse bg-skeleton"></div>
          <div className="flex items-center justify-between border-t bg-secondary px-3 py-2">
            <div className="my-1 h-4 w-20 animate-pulse rounded-md bg-skeleton"></div>
            <div className="my-1 h-4 w-16 animate-pulse rounded-md bg-skeleton"></div>
          </div>
        </div>
      ))}
    </>
  );
};
