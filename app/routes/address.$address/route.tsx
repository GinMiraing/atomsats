import { LoaderFunction, json } from "@remix-run/node";
import { useLoaderData } from "@remix-run/react";
import { networks } from "bitcoinjs-lib";
import { useMemo, useState } from "react";
import useSWR from "swr";

import { getElectrumClient } from "@/lib/apis/atomical";
import { getAddressBalance, getUTXOsInMempool } from "@/lib/apis/mempool";
import { useBTCPrice } from "@/lib/hooks/useBTCPrice";
import { useToast } from "@/lib/hooks/useToast";
import { formatAddress, formatNumber, satsToBTC } from "@/lib/utils";
import { detectAddressType } from "@/lib/utils/address-helpers";
import { formatError } from "@/lib/utils/error-helpers";

import { renderPreview } from "@/components/AtomicalPreview";
import CopyButton from "@/components/CopyButton";
import { Tabs, TabsList, TabsTrigger } from "@/components/Tabs";

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

  const electrumClient = getElectrumClient(networks.bitcoin);
  const { toast } = useToast();
  const { BTCPrice } = useBTCPrice();

  const [atomicalType, setAtomicalType] = useState("all");

  const { data } = useSWR(
    `portfolio`,
    async () => {
      try {
        const [balance, inMempoolUTXOs] = await Promise.all([
          getAddressBalance(address, networks.bitcoin),
          getUTXOsInMempool(address, networks.bitcoin),
        ]);

        const { atomicals, utxos } =
          await electrumClient.atomicalsByAddress(address);

        const unavailableUTXOs = [
          ...inMempoolUTXOs.receive,
          ...inMempoolUTXOs.spent,
        ];

        const availableUTXOs = utxos.filter((utxo) => {
          const matchedIndex = unavailableUTXOs.findIndex((unavailableUTXO) => {
            return (
              unavailableUTXO.txid === utxo.txid &&
              unavailableUTXO.vout === utxo.index
            );
          });

          return matchedIndex === -1;
        });

        const atomicalWithUTXO = availableUTXOs.reduce<
          {
            atomical: {
              atomicalId: string;
              atomicalNumber: number;
              type: string;
              subtype: string;
              parentRealm?: string | undefined;
              requestFullRealmName?: string | undefined;
              requestSubrealm?: string | undefined;
              parentContainer?: string | undefined;
              parentContainerName?: string | undefined;
              requestDmitem?: string | undefined;
              requestRealm?: string | undefined;
              requestTicker?: string | undefined;
            };
            utxo: {
              txid: string;
              value: number;
              vout: number;
            };
          }[]
        >((acc, cur) => {
          if (cur.atomicals.length === 0) return acc;

          const atomicalData = cur.atomicals.map((id) => {
            const matchedAtomical = atomicals[id].data.confirmed
              ? atomicals[id]
              : undefined;

            if (!matchedAtomical) return;

            const atomicalPayload: {
              atomicalId: string;
              atomicalNumber: number;
              type: string;
              subtype: string;

              parentRealm?: string;
              requestFullRealmName?: string;
              requestSubrealm?: string;

              parentContainer?: string;
              parentContainerName?: string;
              requestDmitem?: string;

              requestRealm?: string;

              requestTicker?: string;
            } = {
              atomicalId: matchedAtomical.atomical_id,
              atomicalNumber: matchedAtomical.atomical_number,
              type: matchedAtomical.type,
              subtype: matchedAtomical.subtype,
            };

            if (
              ["subrealm", "request_subrealm"].includes(matchedAtomical.subtype)
            ) {
              atomicalPayload.parentRealm = matchedAtomical.data.$parent_realm;
              atomicalPayload.requestFullRealmName =
                matchedAtomical.data.$request_full_realm_name;
              atomicalPayload.requestSubrealm =
                matchedAtomical.data.$request_subrealm;
            } else if (
              ["dmitem", "request_dmitem"].includes(matchedAtomical.subtype)
            ) {
              atomicalPayload.parentContainer =
                matchedAtomical.data.$parent_container;
              atomicalPayload.parentContainerName =
                matchedAtomical.data.$parent_container_name;
              atomicalPayload.requestDmitem =
                matchedAtomical.data.$request_dmitem;
            } else if (
              ["realm", "request_realm"].includes(matchedAtomical.subtype)
            ) {
              atomicalPayload.requestRealm =
                matchedAtomical.data.$request_realm;
            } else if (["decentralized"].includes(matchedAtomical.subtype)) {
              atomicalPayload.requestTicker =
                matchedAtomical.data.$request_ticker;
            }

            return atomicalPayload;
          });

          for (const atomical of atomicalData) {
            if (!atomical) continue;

            acc.push({
              atomical,
              utxo: {
                txid: cur.txid,
                value: cur.value,
                vout: cur.vout,
              },
            });
          }

          return acc;
        }, []);

        const arc20Balance = availableUTXOs.reduce<number>((acc, cur) => {
          if (cur.atomicals.length === 0) return acc;

          return acc + cur.value;
        }, 0);

        const nftCount = atomicalWithUTXO.filter(
          (atomical) => atomical.atomical.type === "NFT",
        ).length;

        return {
          balance: {
            availableBalance: balance.availableBalance,
            arc20Balance,
          },
          atomicals: atomicalWithUTXO,
          nftCount,
        };
      } catch (e) {
        toast({
          duration: 2000,
          variant: "destructive",
          title: "Failed to fetch address data",
          description: formatError(e),
        });
      }
    },
    {
      refreshInterval: 1000 * 60,
    },
  );

  const sortedAtomicals = useMemo(() => {
    if (!data) return [];

    console.log(atomicalType);

    return data.atomicals.filter((atomical) => {
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
      } else if (atomicalType === "all") {
        return true;
      }
    });
  }, [data, atomicalType]);

  const arc20TokenBalance = useMemo(() => {
    if (!data || atomicalType !== "token") return {};

    return data.atomicals.reduce<{
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
  }, [data, atomicalType]);

  if (!data) {
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
          <div className="grid w-full grid-cols-2 gap-4 md:grid-cols-3 md:gap-5 lg:grid-cols-4 xl:grid-cols-5 xl:gap-6">
            {SkeletonArray.map((value) => (
              <ItemsSkeleton key={value} />
            ))}
          </div>
        </div>
      </div>
    );
  }

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
            <div className="font-medium">
              {satsToBTC(data.balance.availableBalance, {
                keepTrailingZeros: true,
              })}
            </div>
          </div>
          {BTCPrice > 0 ? (
            <div className="text-sm text-secondary">
              {`$${formatNumber(parseFloat(satsToBTC(data.balance.availableBalance)) * BTCPrice)}`}
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
              {satsToBTC(data.balance.arc20Balance, {
                keepTrailingZeros: true,
              })}
            </div>
          </div>
          {BTCPrice > 0 ? (
            <div className="text-sm text-secondary">
              {`$${formatNumber(parseFloat(satsToBTC(data.balance.arc20Balance)) * BTCPrice)}`}
            </div>
          ) : (
            <div className="text-sm text-secondary">$-</div>
          )}
        </div>
        <div className="flex grow flex-col space-y-1 rounded-md bg-secondary px-4 py-2 text-primary">
          <div>NFTs</div>
          <div>{formatNumber(data.nftCount)}</div>
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
          <div className="grid w-full grid-cols-2 gap-4 md:grid-cols-3 md:gap-5 lg:grid-cols-4 xl:grid-cols-5 xl:gap-6">
            {sortedAtomicals.map((atomical) => (
              <div
                key={`${atomical.utxo.txid}:${atomical.utxo.vout}:${atomical.atomical.atomicalId}`}
                className="overflow-hidden rounded-md border"
              >
                <div className="relative flex aspect-square w-full items-center justify-center bg-black text-white">
                  {renderPreview({
                    atomicalId: atomical.atomical.atomicalId,
                    subtype: atomical.atomical.subtype,
                    payload: {
                      realm:
                        atomical.atomical.requestFullRealmName ||
                        atomical.atomical.requestRealm,
                      ticker: atomical.atomical.requestTicker,
                      amount: atomical.utxo.value,
                    },
                  })}
                  <div className="absolute left-3 top-3 rounded bg-theme px-2 py-0.5 text-xs">
                    {atomical.atomical.type === "FT"
                      ? "FT"
                      : atomical.atomical.subtype.toUpperCase() || "NFT"}
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="flex h-80 w-full items-center justify-center text-xl">
            No Item Found
          </div>
        )}
      </div>
    </div>
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
    <div className="overflow-hidden rounded-md border">
      <div className="relative flex aspect-square w-full animate-pulse bg-skeleton"></div>
    </div>
  );
};
