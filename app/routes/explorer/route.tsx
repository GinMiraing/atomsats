import { isAxiosError } from "axios";
import { networks } from "bitcoinjs-lib";
import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime.js";
import { useEffect, useState } from "react";

import { getElectrumClient } from "@/lib/apis/atomical";
import { useToast } from "@/lib/hooks/useToast";
import { cn, getAtomicalContent } from "@/lib/utils";

import AtomicalRender from "@/components/AtomicalRender/route";
import { Button } from "@/components/Button";

dayjs.extend(relativeTime);

const skeletons = new Array(20).fill(0);
const buttons = new Array(5).fill(0);

export default function Explorer() {
  const { toast } = useToast();

  const [atomicals, setAtomicals] = useState<
    {
      atomicalId: string;
      atomicalNumber: number;
      type: "FT" | "NFT";
      subtype: string;
      mintTime: number;
      contentType: string;
      content: string;
    }[]
  >([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);

  const electrumClient = getElectrumClient(networks.bitcoin);

  const fetchAtomicals = async (page: number) => {
    try {
      setLoading(true);
      setCurrentPage(page);

      const { global } = await electrumClient.atomicalsGet(0);
      const { result } = await electrumClient.atomicalsList(
        20,
        global.atomical_count - 1 - 20 * (page - 1),
        false,
      );

      setAtomicals(
        result.map((atomical) => ({
          ...getAtomicalContent(atomical),
          atomicalId: atomical.atomical_id,
          atomicalNumber: atomical.atomical_number,
          type: atomical.type,
          subtype: atomical.subtype || "",
          mintTime: atomical.mint_info.args.time || 0,
        })),
      );
    } catch (e) {
      if (isAxiosError(e)) {
        toast({
          variant: "destructive",
          duration: 2000,
          title: "Get List Failed",
          description: e.response?.data.message,
        });
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAtomicals(1);
  }, []);

  if (loading) {
    return (
      <div className="mx-auto w-full max-w-screen-xl space-y-4 px-4 py-8">
        <div className="grid w-full grid-cols-2 gap-4 md:grid-cols-4 md:gap-5 xl:grid-cols-5 xl:gap-8">
          <LoadingSkeleton />
        </div>
        <div className="flex items-center justify-center space-x-2">
          {buttons.map((_, i) => (
            <Button
              key={i}
              className={cn("hover:bg-theme hover:text-white", {
                "bg-theme text-white": currentPage === i + 1,
                "bg-secondary text-primary": currentPage !== i + 1,
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

  if (atomicals.length === 0) {
    return (
      <div className="mx-auto w-full max-w-screen-xl space-y-4 px-4 py-8">
        <div className="flex h-screen w-full items-center justify-center text-xl">
          Something went wrong, please try again later.
        </div>
        <div className="flex items-center justify-center space-x-2">
          {buttons.map((_, i) => (
            <Button
              key={i}
              onClick={() => fetchAtomicals(i + 1)}
              className={cn(
                "hover:bg-theme hover:text-white hover:opacity-100",
                {
                  "bg-theme text-white": currentPage === i + 1,
                  "bg-secondary text-primary": currentPage !== i + 1,
                },
              )}
              disabled={loading || currentPage === i + 1}
            >
              {i + 1}
            </Button>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto w-full max-w-screen-xl space-y-4 px-4 py-8">
      <div className="grid w-full grid-cols-2 gap-4 md:grid-cols-4 md:gap-5 xl:grid-cols-5 xl:gap-8">
        {atomicals.map((atomical) => (
          <div
            key={atomical.atomicalId}
            className="overflow-hidden rounded-md border"
          >
            <div className="relative flex aspect-square w-full items-center justify-center bg-black text-white">
              <AtomicalRender atomical={atomical} />
              <div className="absolute left-3 top-3 flex rounded-md bg-theme px-1 py-0.5 text-xs">
                {atomical.subtype.toUpperCase() || "NFT"}
              </div>
            </div>
            <div className="flex items-center justify-between border-t bg-secondary px-3 py-2">
              <a
                href={`/atomical/${atomical.atomicalId}`}
                className="transition-colors hover:text-theme"
              >
                # {atomical.atomicalNumber}
              </a>
              <div>{dayjs.unix(atomical.mintTime).fromNow(true)}</div>
            </div>
          </div>
        ))}
      </div>
      <div className="flex items-center justify-center space-x-2">
        {buttons.map((_, i) => (
          <Button
            key={i}
            onClick={() => fetchAtomicals(i + 1)}
            className={cn(
              "transition-colors hover:bg-theme hover:text-white hover:opacity-100",
              {
                "bg-theme text-white": currentPage === i + 1,
                "bg-secondary text-primary": currentPage !== i + 1,
              },
            )}
            disabled={loading || currentPage === i + 1}
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
          <div className="aspect-square w-full animate-pulse bg-gray-300"></div>
          <div className="flex items-center justify-between border-t bg-secondary px-3 py-2">
            <div className="my-1 h-4 w-20 animate-pulse bg-gray-300"></div>
            <div className="my-1 h-4 w-16 animate-pulse bg-gray-300"></div>
          </div>
        </div>
      ))}
    </>
  );
};
