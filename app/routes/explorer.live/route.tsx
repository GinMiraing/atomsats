import { isAxiosError } from "axios";
import { networks } from "bitcoinjs-lib";
import dayjs from "dayjs";
import { useEffect, useMemo } from "react";
import useSWR from "swr";

import { getElectrumClient } from "@/lib/apis/atomical";
import {
  isCONTAINER,
  isFT,
  isREALM,
  isSubrealm,
} from "@/lib/apis/atomical/type";
import { useSetSearch } from "@/lib/hooks/useSetSearch";
import { useToast } from "@/lib/hooks/useToast";
import { cn } from "@/lib/utils";

import { renderIndexerPreview } from "@/components/AtomicalPreview";
import { Button } from "@/components/Button";
import EmptyTip from "@/components/EmptyTip";
import GridList from "@/components/GridList";

import { useExplorerStatus } from "../explorer/hooks/useExplorerStatus";

const skeletons = new Array(20).fill(0);
const buttons = new Array(5).fill(0);

export default function ExplorerLive() {
  const { toast } = useToast();
  const { searchParams, updateSearchParams } = useSetSearch();
  const { setIsValidating } = useExplorerStatus();

  const electrumClient = getElectrumClient(networks.bitcoin);

  const page = useMemo(
    () => parseInt(searchParams.get("page") || "1") || 1,
    [searchParams],
  );

  const { data, isLoading, isValidating, mutate } = useSWR(
    "explorer-live",
    async () => {
      try {
        const { global } = await electrumClient.atomicalsGet(0);
        const { result } = await electrumClient.atomicalsList(
          20,
          global.atomical_count - 1 - 20 * (page - 1),
          false,
        );

        return result.map((atomical) => {
          const atomicalDataTemp: {
            atomicalId: string;
            atomicalNumber: number;
            type: "FT" | "NFT";
            subtype: string;
            mintTime: number;
            isArcs: boolean;
            realm?: string;
            ticker?: string;
            container?: string;
            subrealm?: string;
          } = {
            isArcs: false,
            atomicalId: atomical.atomical_id,
            atomicalNumber: atomical.atomical_number,
            type: atomical.type,
            subtype: atomical.subtype,
            mintTime: atomical.mint_info.args.time || 0,
          };

          if (isCONTAINER(atomical)) {
            atomicalDataTemp.container = atomical.$request_container;
          } else if (isFT(atomical)) {
            atomicalDataTemp.ticker = atomical.$request_ticker;
          } else if (isREALM(atomical)) {
            atomicalDataTemp.realm = atomical.$request_realm;
          } else if (isSubrealm(atomical)) {
            atomicalDataTemp.subrealm = atomical.$request_subrealm;
          }

          if ("arcs.txt" in atomical.mint_data.fields) {
            atomicalDataTemp.isArcs = true;
          }

          return atomicalDataTemp;
        });
      } catch (e) {
        if (isAxiosError(e)) {
          toast({
            variant: "destructive",
            duration: 2000,
            title: "Get List Failed",
            description: e.response?.data.message,
          });
        }
      }
    },
    {
      refreshInterval: 1000 * 60,
    },
  );

  useEffect(() => {
    mutate();
  }, [page]);

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
          data.map((atomical) => (
            <div
              key={atomical.atomicalId}
              className="overflow-hidden rounded-md border"
            >
              <div className="relative flex aspect-square w-full items-center justify-center bg-primary text-white">
                {renderIndexerPreview({
                  subtype: atomical.subtype,
                  atomicalId: atomical.atomicalId,
                  payload: {
                    realm: atomical.realm || atomical.subrealm,
                    ticker: atomical.ticker,
                    container: atomical.container,
                    arcs: atomical.isArcs,
                  },
                })}
                <div className="absolute left-3 top-3 flex rounded-md bg-theme px-1 py-0.5 text-xs">
                  {atomical.subtype?.toUpperCase() || "NFT"}
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
