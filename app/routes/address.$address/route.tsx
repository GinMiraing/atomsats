import { LoaderFunction, json } from "@remix-run/node";
import { useLoaderData } from "@remix-run/react";
import { useEffect, useMemo, useState } from "react";

import { useBTCPrice } from "@/lib/hooks/useBTCPrice";
import { useToast } from "@/lib/hooks/useToast";
import { formatAddress, formatNumber, satsToBTC } from "@/lib/utils";
import { detectAddressType } from "@/lib/utils/address-helpers";
import { formatError } from "@/lib/utils/error-helpers";

import AtomicalNFTTransferModal from "@/components/AtomicalNFTTransferModal";
import { renderAddressPreview } from "@/components/AtomicalPreview";
import { Button } from "@/components/Button";
import CopyButton from "@/components/CopyButton";
import EmptyTip from "@/components/EmptyTip";
import GridList from "@/components/GridList";
import PunycodeString from "@/components/PunycodeString";
import { Tabs, TabsList, TabsTrigger } from "@/components/Tabs";
import { useWallet } from "@/components/Wallet/hooks";

import ListForm from "./components/ListForm";
import { useListAtomical } from "./hooks/useList";
import { usePortfolio } from "./hooks/usePortfolio";
import { AccountAtomical } from "./types";

const TabItems = [
  {
    key: "all",
    label: "All",
  },
  {
    key: "token",
    label: "Token",
  },
  {
    key: "realm",
    label: "Realm",
  },
  {
    key: "dmitem",
    label: "Dmitem",
  },
];

const SkeletonArray = new Array(20).fill(0).map((_, i) => i);

const renderName = (atomical: AccountAtomical) => {
  if (atomical.type === "FT") {
    return atomical.requestTicker || "";
  } else if (["dmitem", "request_dmitem"].includes(atomical.subtype)) {
    return atomical.parentContainerName || "";
  } else {
    return "";
  }
};

export const loader: LoaderFunction = async ({ params }) => {
  const address = params.address as string;

  if (!detectAddressType(address)) {
    throw new Error("invalid address");
  }

  return json({ address });
};

export default function Address() {
  const { address } = useLoaderData<{
    address: string;
  }>();

  const { toast } = useToast();
  const { BTCPrice } = useBTCPrice();
  const { account } = useWallet();
  const { portfolio, refreshPortfolio } = usePortfolio(address);
  const { unlistAtomical } = useListAtomical();

  const [atomicalType, setAtomicalType] = useState("all");
  const [listData, setListData] = useState<{
    atomical?: AccountAtomical;
    utxo?: {
      txid: string;
      value: number;
      vout: number;
    };
  }>({});
  const [transferNFTData, setTransferNFTData] = useState<{
    atomical?: AccountAtomical;
    utxo?: {
      txid: string;
      value: number;
      vout: number;
    };
  }>({});
  const [loading, setLoading] = useState(false);

  const sortedAtomicals = useMemo(() => {
    if (!portfolio) return [];

    return portfolio.atomicals.filter((atomical) => {
      if (atomicalType === "token") {
        return atomical.atomical.type === "FT";
      } else if (atomicalType === "realm") {
        return [
          "realm",
          "request_realm",
          "subrealm",
          "request_subrealm",
        ].includes(atomical.atomical.subtype);
      } else if (atomicalType === "dmitem") {
        return ["dmitem", "request_dmitem"].includes(atomical.atomical.subtype);
      } else if (atomicalType === "listings") {
        return atomical.atomical.listed;
      } else if (atomicalType === "all") {
        return true;
      }
    });
  }, [portfolio, atomicalType]);

  const arc20TokenBalance = useMemo(() => {
    if (!portfolio || atomicalType !== "token") return {};

    return portfolio.atomicals.reduce<{
      [token: string]: {
        balance: number;
      };
    }>((acc, cur) => {
      if (!cur.atomical.requestTicker) return acc;

      if (!acc[cur.atomical.requestTicker]) {
        acc[cur.atomical.requestTicker] = {
          balance: cur.utxo.value,
        };
      } else {
        acc[cur.atomical.requestTicker].balance += cur.utxo.value;
      }

      return acc;
    }, {});
  }, [portfolio, atomicalType]);

  const unlist = async (
    atomical: AccountAtomical,
    utxo: { txid: string; vout: number },
  ) => {
    try {
      setLoading(true);
      await unlistAtomical({
        atomicalId: atomical.atomicalId,
        type: atomical.subtype || "",
        utxo,
      });
      refreshPortfolio();
    } catch (e) {
      console.log(e);
      toast({
        duration: 2000,
        variant: "destructive",
        title: "Unlist failed",
        description: formatError(e),
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!account || account.address !== address) {
      if (atomicalType === "listings") {
        setAtomicalType("all");
      }
    }
  }, [account]);

  if (!portfolio) {
    return (
      <div className="min-h-screen w-full space-y-6">
        <AddressMessage address={address} />
        <div className="flex flex-wrap gap-4">
          <div className="flex grow flex-col space-y-1 rounded-md bg-secondary px-4 py-2 text-primary">
            <div>BTC Balance</div>
            <div className="flex items-center space-x-1">
              <img
                src="/icons/btc.svg"
                alt="btc"
              />
              <div className="flex h-6 w-28 items-center">
                <div className="h-4 w-full animate-pulse rounded bg-skeleton"></div>
              </div>
            </div>
            <div className="text-sm text-secondary">$-</div>
          </div>
          <div className="flex grow flex-col space-y-1 rounded-md bg-secondary px-4 py-2 text-primary">
            <div>ARC20 Balance</div>
            <div className="flex items-center space-x-1">
              <img
                src="/icons/btc.svg"
                alt="btc"
              />
              <div className="flex h-6 w-28 items-center">
                <div className="h-4 w-full animate-pulse rounded bg-skeleton"></div>
              </div>
            </div>
            <div className="text-sm text-secondary">$-</div>
          </div>
          <div className="flex grow flex-col space-y-1 rounded-md bg-secondary px-4 py-2 text-primary">
            <div>NFTs</div>
            <div className="flex h-6 w-16 items-center">
              <div className="h-4 w-full animate-pulse rounded bg-skeleton"></div>
            </div>
          </div>
        </div>
        <Tabs
          className="border-b"
          value={atomicalType}
          onValueChange={setAtomicalType}
        >
          <TabsList className="flex w-full justify-start">
            {TabItems.map((tab) => (
              <TabsTrigger
                disabled
                key={tab.key}
                className="h-10 bg-transparent text-primary hover:text-theme-hover data-[state=active]:border-b-2 data-[state=active]:border-b-theme data-[state=active]:bg-transparent data-[state=active]:text-theme"
                value={tab.key}
              >
                {tab.label}
              </TabsTrigger>
            ))}
          </TabsList>
        </Tabs>
        <div className="w-full space-y-4">
          <GridList>
            {SkeletonArray.map((value) => (
              <ItemsSkeleton key={value} />
            ))}
          </GridList>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="min-h-screen w-full space-y-6">
        <AddressMessage address={address} />
        <div className="flex flex-wrap gap-4">
          <div className="flex grow flex-col space-y-1 rounded-md bg-secondary px-4 py-2 text-primary">
            <div>BTC Balance</div>
            <div className="flex items-center space-x-1">
              <img
                src="/icons/btc.svg"
                alt="btc"
              />
              <div className="font-medium">
                {satsToBTC(portfolio.balance.availableBalance, {
                  keepTrailingZeros: true,
                })}
              </div>
            </div>
            {BTCPrice > 0 ? (
              <div className="text-sm text-secondary">
                {`$${formatNumber(parseFloat(satsToBTC(portfolio.balance.availableBalance)) * BTCPrice)}`}
              </div>
            ) : (
              <div className="text-sm text-secondary">$-</div>
            )}
          </div>
          <div className="flex grow flex-col space-y-1 rounded-md bg-secondary px-4 py-2 text-primary">
            <div>ARC20 Balance</div>
            <div className="flex items-center space-x-1">
              <img
                src="/icons/btc.svg"
                alt="btc"
              />
              <div className="font-medium">
                {satsToBTC(portfolio.balance.arc20Balance, {
                  keepTrailingZeros: true,
                })}
              </div>
            </div>
            {BTCPrice > 0 ? (
              <div className="text-sm text-secondary">
                {`$${formatNumber(parseFloat(satsToBTC(portfolio.balance.arc20Balance)) * BTCPrice)}`}
              </div>
            ) : (
              <div className="text-sm text-secondary">$-</div>
            )}
          </div>
          <div className="flex grow flex-col space-y-1 rounded-md bg-secondary px-4 py-2 text-primary">
            <div>NFTs</div>
            <div>{formatNumber(portfolio.nftCount)}</div>
          </div>
        </div>
        <Tabs
          className="border-b"
          value={atomicalType}
          onValueChange={setAtomicalType}
        >
          <TabsList className="flex w-full justify-start">
            {TabItems.map((tab) => (
              <TabsTrigger
                key={tab.key}
                className="h-10 bg-transparent text-primary hover:text-theme-hover data-[state=active]:border-b-2 data-[state=active]:border-b-theme data-[state=active]:bg-transparent data-[state=active]:text-theme"
                value={tab.key}
              >
                {tab.label}
              </TabsTrigger>
            ))}
            {account && account.address === address && (
              <TabsTrigger
                className="h-10 bg-transparent text-primary hover:text-theme-hover data-[state=active]:border-b-2 data-[state=active]:border-b-theme data-[state=active]:bg-transparent data-[state=active]:text-theme"
                value="listings"
              >
                Listings
              </TabsTrigger>
            )}
          </TabsList>
        </Tabs>
        <div className="w-full space-y-4">
          {atomicalType === "token" && (
            <div className="grid grid-cols-2 gap-4">
              {Object.entries(arc20TokenBalance).map(([token, balance]) => (
                <div
                  key={token}
                  className="flex w-full flex-col justify-center space-y-2 rounded-md border bg-secondary px-4 py-2"
                >
                  <div className="flex items-center space-x-2">
                    <div className="text-sm text-secondary">Token</div>
                    <div>{token}</div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <div className="text-sm text-secondary">Balance</div>
                    <div>{`${formatNumber(balance.balance)} SATS`}</div>
                  </div>
                </div>
              ))}
            </div>
          )}
          {sortedAtomicals.length > 0 ? (
            <GridList>
              {sortedAtomicals.map((atomical) => (
                <div
                  key={`${atomical.utxo.txid}:${atomical.utxo.vout}:${atomical.atomical.atomicalId}`}
                  className="overflow-hidden rounded-md border shadow-md"
                >
                  <div className="relative flex aspect-square w-full items-center justify-center bg-primary text-white">
                    {renderAddressPreview({
                      atomicalId: atomical.atomical.atomicalId,
                      subtype: atomical.atomical.subtype,
                      payload: {
                        realm:
                          atomical.atomical.requestFullRealmName ||
                          atomical.atomical.requestRealm,
                        ticker: atomical.atomical.requestTicker,
                        amount: atomical.utxo.value,
                        arcs: atomical.atomical.isArcs,
                        container: atomical.atomical.requestContainer,
                      },
                    })}
                    <div className="absolute left-2 top-2 rounded bg-theme px-1.5 text-sm text-white">
                      {atomical.atomical.type === "FT"
                        ? "FT"
                        : atomical.atomical.subtype?.toUpperCase() || "NFT"}
                    </div>
                    {atomical.atomical.listed &&
                      address === account?.address && (
                        <div className="absolute bottom-0 left-0 right-0 flex h-8 items-center justify-between bg-black/40 px-1.5 text-sm text-white">
                          <div className="flex items-center space-x-1">
                            <img
                              src="/icons/btc.svg"
                              alt="btc"
                              className="h-5 w-5"
                            />
                            <div>
                              {satsToBTC(atomical.atomical.listed.price, {
                                keepTrailingZeros: true,
                                digits: 8,
                              })}
                            </div>
                          </div>
                          <div className="text-secondary">
                            {BTCPrice ? (
                              <div>
                                {`$${formatNumber(
                                  parseFloat(
                                    satsToBTC(atomical.atomical.listed.price),
                                  ) * BTCPrice,
                                )}`}
                              </div>
                            ) : (
                              <div>$-</div>
                            )}
                          </div>
                        </div>
                      )}
                  </div>
                  <div className="flex w-full flex-col items-center space-y-4 border-t bg-secondary px-3 py-2">
                    <div className="flex w-full items-center justify-between text-sm">
                      <a
                        className="transition-colors hover:text-theme"
                        href={`/atomical/${atomical.atomical.atomicalId}`}
                        target="_blank"
                      >
                        #{atomical.atomical.atomicalNumber}
                      </a>
                      <div>
                        <PunycodeString
                          children={renderName(atomical.atomical)}
                        />
                      </div>
                    </div>
                    {account && account.address === address && (
                      <div className="flex w-full space-x-2">
                        {atomical.atomical.listed ? (
                          <>
                            <Button
                              disabled={loading}
                              onClick={() =>
                                unlist(atomical.atomical, atomical.utxo)
                              }
                              className="w-full border bg-primary text-primary transition-colors hover:border-theme hover:text-theme"
                            >
                              Unlist
                            </Button>
                            <Button
                              className="w-full"
                              onClick={() => setListData({ ...atomical })}
                            >
                              Edit
                            </Button>
                          </>
                        ) : (
                          <>
                            <Button
                              disabled={atomical.atomical.type === "FT"}
                              className="w-full border bg-primary text-primary transition-colors hover:border-theme hover:text-theme"
                              onClick={() => {
                                if (atomical.atomical.type === "NFT") {
                                  setTransferNFTData({ ...atomical });
                                }
                              }}
                            >
                              Transfer
                            </Button>
                            <Button
                              className="w-full"
                              disabled={
                                !["realm", "dmitem"].includes(
                                  atomical.atomical.subtype,
                                )
                              }
                              onClick={() => setListData({ ...atomical })}
                            >
                              List
                            </Button>
                          </>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </GridList>
          ) : (
            <EmptyTip />
          )}
        </div>
      </div>
      <ListForm
        atomical={listData.atomical}
        utxo={listData.utxo}
        onClose={() => setListData({})}
        onSuccess={() => refreshPortfolio()}
      />
      <AtomicalNFTTransferModal
        atomical={transferNFTData.atomical}
        utxo={transferNFTData.utxo}
        onClose={() => setTransferNFTData({})}
        onSuccess={() => {
          setTransferNFTData({});
          refreshPortfolio();
        }}
      />
    </>
  );
}

const AddressMessage: React.FC<{
  address: string;
}> = ({ address }) => {
  return (
    <div className="flex items-center space-x-2">
      <div className="text-2xl text-primary">{formatAddress(address, 6)}</div>
      <CopyButton text={address} />
      <a
        href={`https://mempool.space/address/${address}`}
        target="_blank"
        rel="noreferrer"
        className="flex h-5 w-5 overflow-hidden rounded-md"
      >
        <img
          src="/icons/mempool.svg"
          alt="Mempool"
          className="h-full w-full"
        />
      </a>
    </div>
  );
};

const ItemsSkeleton: React.FC = () => {
  return (
    <div className="overflow-hidden rounded-md border shadow-md">
      <div className="relative flex aspect-square w-full animate-pulse bg-skeleton"></div>
    </div>
  );
};
