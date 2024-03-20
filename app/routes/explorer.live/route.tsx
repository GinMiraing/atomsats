import { LoaderFunction, json } from "@remix-run/node";
import { useLoaderData } from "@remix-run/react";
import { isAxiosError } from "axios";
import { networks } from "bitcoinjs-lib";
import dayjs from "dayjs";
import { useEffect } from "react";
import useSWR from "swr";

import { getElectrumClient } from "@/lib/apis/atomical";
import {
  isCONTAINER,
  isFT,
  isREALM,
  isSubrealm,
} from "@/lib/apis/atomical/type";
import { useExplorerStatus } from "@/lib/hooks/useExplorerStatus";
import { useSetSearch } from "@/lib/hooks/useSetSearch";
import { useToast } from "@/lib/hooks/useToast";
import { cn } from "@/lib/utils";

import { renderIndexerPreview } from "@/components/AtomicalPreview";
import { Button } from "@/components/Button";

const skeletons = new Array(20).fill(0);
const buttons = new Array(5).fill(0);

export const loader: LoaderFunction = async ({ request }) => {
  const url = new URL(request.url);

  const page = url.searchParams.get("page") || "1";

  return json({
    page: parseInt(page) || 1,
  });
};

export default function ExplorerLive() {
  const { page } = useLoaderData<{
    page: number;
  }>();
  const { toast } = useToast();
  const { updateSearchParams } = useSetSearch();
  const { setIsValidating } = useExplorerStatus();

  const electrumClient = getElectrumClient(networks.bitcoin);

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

  if (isLoading || isValidating) {
    return (
      <div className="space-y-4">
        <div className="grid w-full grid-cols-2 gap-4 md:grid-cols-4 md:gap-5 xl:grid-cols-5 xl:gap-8">
          <LoadingSkeleton />
        </div>
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

  if (!data || data.length === 0) {
    return (
      <div className="space-y-4">
        <div className="flex h-screen w-full items-center justify-center text-xl">
          Something went wrong, please try again later.
        </div>
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
                "hover:bg-theme hover:text-white hover:opacity-100",
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

  return (
    <div className="space-y-4">
      <div className="grid w-full grid-cols-2 gap-4 md:grid-cols-4 md:gap-5 xl:grid-cols-5 xl:gap-8">
        {data &&
          data.map((atomical) => (
            <div
              key={atomical.atomicalId}
              className="overflow-hidden rounded-md border"
            >
              <div className="relative flex aspect-square w-full items-center justify-center bg-black text-white">
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
          ))}
      </div>
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