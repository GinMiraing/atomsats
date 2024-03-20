import { useParams } from "@remix-run/react";
import { isAxiosError } from "axios";
import { networks } from "bitcoinjs-lib";
import dayjs from "dayjs";
import { ExternalLink } from "lucide-react";
import { useEffect, useState } from "react";

import { getElectrumClient } from "@/lib/apis/atomical";
import { isCONTAINER, isFT, isREALM } from "@/lib/apis/atomical/type";
import { useToast } from "@/lib/hooks/useToast";
import { formatNumber } from "@/lib/utils";
import { detectScriptToAddressType } from "@/lib/utils/address-helpers";

import { renderIndexerPreview } from "@/components/AtomicalPreview";
import CopyButton from "@/components/CopyButton";

export default function AtomicalId() {
  const params = useParams();
  const { toast } = useToast();

  const [loading, setLoading] = useState(true);
  const [atomical, setAtomical] = useState<{
    atomicalId: string;
    atomicalNumber: number;
    type: "FT" | "NFT";
    subtype: string;
    owner: string;
    mintTime: number;
    revealTxid: string;
    revealValue: number;
    realm?: string;
    ticker?: string;
    container?: string;
    isArcs: boolean;
    txs: string[];
  } | null>(null);

  const electrumClient = getElectrumClient(networks.bitcoin);

  const fetchAtomical = async (id: string) => {
    try {
      setLoading(true);

      const { result } = await electrumClient.atomicalsGetState(id, true);

      const atomicalDataTemp: {
        atomicalId: string;
        atomicalNumber: number;
        type: "FT" | "NFT";
        subtype: string;
        owner: string;
        mintTime: number;
        revealTxid: string;
        revealValue: number;
        txs: string[];
        realm?: string;
        ticker?: string;
        container?: string;
        isArcs: boolean;
      } = {
        isArcs: false,
        atomicalId: result.atomical_id,
        atomicalNumber: result.atomical_number,
        type: result.type,
        subtype: result.subtype || "",
        owner: isFT(result)
          ? ""
          : !result.location_info || result.location_info.length === 0
            ? detectScriptToAddressType(result.mint_info.reveal_location_script)
            : detectScriptToAddressType(result.location_info[0].script),
        mintTime: result.mint_info.args.time || 0,
        revealTxid: result.mint_info.reveal_location_txid || "0",
        revealValue: result.mint_info.reveal_location_value || 0,
        txs: [],
      };

      if (isCONTAINER(result)) {
        atomicalDataTemp.container = result.$request_container;
      } else if (isFT(result)) {
        atomicalDataTemp.ticker = result.$request_ticker;
      } else if (isREALM(result)) {
        atomicalDataTemp.realm = result.$request_realm;
      }

      if ("arcs.txt" in result.mint_data.fields) {
        atomicalDataTemp.isArcs = true;
      }

      if (!isFT(result)) {
        const { result: txResult } =
          await electrumClient.atomicalsGetTxHistory(id);
        atomicalDataTemp.txs =
          txResult.tx?.history?.map((tx) => tx.tx_hash) || [];
      }

      setAtomical(atomicalDataTemp);
    } catch (e) {
      if (isAxiosError(e)) {
        toast({
          variant: "destructive",
          duration: 2000,
          title: "Get Atomical Failed",
          description: e.response?.data.message,
        });
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!params.id) return;
    fetchAtomical(params.id);
  }, [params.id]);

  if (loading) {
    return <LoadingSkeleton />;
  }

  if (!atomical)
    return (
      <div className="flex h-screen items-center justify-center text-xl">
        no atomical data
      </div>
    );

  return (
    <div className="space-y-8">
      <div className="relative mx-auto flex aspect-square w-full max-w-[300px] items-center justify-center overflow-hidden rounded-md border bg-primary text-white">
        {renderIndexerPreview({
          subtype: atomical.subtype,
          atomicalId: atomical.atomicalId,
          payload: {
            realm: atomical.realm,
            ticker: atomical.ticker,
            container: atomical.container,
            arcs: atomical.isArcs,
          },
        })}
        <div className="absolute left-4 top-4 flex rounded-md bg-theme px-2 py-1">
          {atomical.subtype.toUpperCase() || "NFT"}
        </div>
      </div>
      <div className="flex flex-col items-start gap-6 md:flex-row">
        <div className="w-full basis-1/2 overflow-hidden rounded-md border-2">
          <div className="flex h-12 w-full items-center justify-between space-x-1 border-b bg-secondary px-4 text-sm">
            <span className="grid truncate">{atomical.atomicalId}</span>
            <CopyButton text={atomical.atomicalId} />
          </div>
          <div className="divide-y">
            <div className="flex flex-col space-y-1 px-4 py-2">
              <span className="text-lg text-secondary">NUMBER</span>
              <span>{atomical.atomicalNumber}</span>
            </div>
            <div className="flex flex-col space-y-1 px-4 py-2">
              <span className="text-lg text-secondary">TYPE</span>
              <span>{atomical.type}</span>
            </div>
            <div className="flex flex-col space-y-1 px-4 py-2">
              <span className="text-lg text-secondary">SUBTYPE</span>
              <span>{atomical.subtype || "-"}</span>
            </div>
            <div className="flex flex-col space-y-1 px-4 py-2">
              <div className="flex items-center space-x-1">
                <span className="text-lg text-secondary">OWNER</span>
                <CopyButton text={atomical.owner} />
              </div>
              <span className="grid truncate">{atomical.owner || "-"}</span>
            </div>
            <div className="flex flex-col space-y-1 px-4 py-2">
              <span className="text-lg text-secondary">REVEAL TXID</span>
              <a
                href={`https://mempool.space/tx/${atomical.revealTxid}`}
                target="_blank"
                className="grid truncate transition-colors hover:text-theme"
              >
                {atomical.revealTxid}
              </a>
            </div>
            <div className="flex flex-col space-y-1 px-4 py-2">
              <span className="text-lg text-secondary">REVEAL VALUE</span>
              <span>{formatNumber(atomical.revealValue)}</span>
            </div>
            <div className="flex flex-col space-y-1 px-4 py-2">
              <span className="text-lg text-secondary">MINT TIME</span>
              <span>
                {dayjs.unix(atomical.mintTime).format("YYYY-MM-DD HH:mm:ss")}
              </span>
            </div>
          </div>
          <a
            href={`/api/atomical/detail/${atomical.atomicalId}`}
            target="_blank"
            className="flex h-12 w-full items-center justify-end space-x-1 border-t bg-secondary px-4 transition-colors hover:text-theme"
          >
            <span>DETAIL</span>
            <ExternalLink className="h-4 w-4" />
          </a>
        </div>
        <div className="w-full basis-1/2 overflow-hidden rounded-md border-2">
          <div className="flex h-12 w-full items-center border-b bg-secondary px-4 text-base">
            TX History
          </div>
          {atomical.txs.length === 0 ? (
            <div className="flex h-60 w-full items-center justify-center px-4">
              NO TX HISTORY
            </div>
          ) : (
            <div className="divide-y">
              {atomical.txs.map((tx) => (
                <div
                  key={tx}
                  className="flex items-center px-4 py-2"
                >
                  <a
                    href={`https://mempool.space/tx/${tx}`}
                    target="_blank"
                    className="grid truncate  transition-colors hover:text-theme"
                  >
                    {tx}
                  </a>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

const LoadingSkeleton = () => {
  return (
    <div className="space-y-8">
      <div className="mx-auto aspect-square w-full max-w-[300px] animate-pulse overflow-hidden rounded-md border bg-skeleton"></div>
      <div className="flex flex-col items-start gap-6 md:flex-row">
        <div className="w-full basis-1/2 overflow-hidden rounded-md border-2">
          <div className="flex h-12 w-full items-center justify-between space-x-1 border-b bg-secondary px-4 text-sm">
            <div className="h-4 w-full animate-pulse bg-skeleton"></div>
          </div>
          <div className="divide-y">
            <div className="flex flex-col space-y-1 px-4 py-2">
              <div className="text-lg text-secondary">NUMBER</div>
              <div className="h-6 w-full py-1">
                <div className="h-4 w-full animate-pulse bg-skeleton"></div>
              </div>
            </div>
            <div className="flex flex-col space-y-1 px-4 py-2">
              <div className="text-lg text-secondary">TYPE</div>
              <div className="h-6 w-full py-1">
                <div className="h-4 w-full animate-pulse bg-skeleton"></div>
              </div>
            </div>
            <div className="flex flex-col space-y-1 px-4 py-2">
              <div className="text-lg text-secondary">SUBTYPE</div>
              <div className="h-6 w-full py-1">
                <div className="h-4 w-full animate-pulse bg-skeleton"></div>
              </div>
            </div>
            <div className="flex flex-col space-y-1 px-4 py-2">
              <div className="flex items-center space-x-1">
                <div className="text-lg text-secondary">OWNER</div>
                <CopyButton text={""} />
              </div>
              <div className="h-6 w-full py-1">
                <div className="h-4 w-full animate-pulse bg-skeleton"></div>
              </div>
            </div>
            <div className="flex flex-col space-y-1 px-4 py-2">
              <div className="text-lg text-secondary">REVEAL TXID</div>
              <div className="h-6 w-full py-1">
                <div className="h-4 w-full animate-pulse bg-skeleton"></div>
              </div>
            </div>
            <div className="flex flex-col space-y-1 px-4 py-2">
              <div className="text-lg text-secondary">REVEAL VALUE</div>
              <div className="h-6 w-full py-1">
                <div className="h-4 w-full animate-pulse bg-skeleton"></div>
              </div>
            </div>
            <div className="flex flex-col space-y-1 px-4 py-2">
              <div className="text-lg text-secondary">MINT TIME</div>
              <div className="h-6 w-full py-1">
                <div className="h-4 w-full animate-pulse bg-skeleton"></div>
              </div>
            </div>
          </div>
          <div className="flex h-12 w-full items-center justify-end space-x-1 border-t bg-secondary px-4">
            <div>DETAIL</div>
            <ExternalLink className="h-4 w-4" />
          </div>
        </div>
        <div className="w-full basis-1/2 overflow-hidden rounded-md border-2">
          <div className="flex h-12 w-full items-center border-b bg-secondary px-4 text-base">
            TX History
          </div>
          <div className="divide-y">
            <div className="flex items-center px-4 py-2">
              <div className="my-1 h-4 w-full animate-pulse bg-skeleton"></div>
            </div>
            <div className="flex items-center px-4 py-2">
              <div className="my-1 h-4 w-full animate-pulse bg-skeleton"></div>
            </div>
            <div className="flex items-center px-4 py-2">
              <div className="my-1 h-4 w-full animate-pulse bg-skeleton"></div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
