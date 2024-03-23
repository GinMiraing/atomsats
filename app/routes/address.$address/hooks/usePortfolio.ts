import { networks } from "bitcoinjs-lib";
import useSWR from "swr";

import { getElectrumClient } from "@/lib/apis/atomical";
import { getAddressBalance, getUTXOsInMempool } from "@/lib/apis/mempool";
import AxiosInstance from "@/lib/axios";
import { useToast } from "@/lib/hooks/useToast";
import { formatError } from "@/lib/utils/error-helpers";

import { AccountAtomical } from "../types";

export const usePortfolio = (address: string) => {
  const electrumClient = getElectrumClient(networks.bitcoin);
  const { toast } = useToast();

  const { data, mutate } = useSWR(
    `portfolio-${address}`,
    async () => {
      try {
        const [balance, inMempoolUTXOs, offerResp] = await Promise.all([
          getAddressBalance(address, networks.bitcoin),
          getUTXOsInMempool(address, networks.bitcoin),
          AxiosInstance.post<{
            data: {
              atomicalId: string;
              price: number;
              receiver: string;
            }[];
            error: boolean;
            code: number;
          }>(`/api/offer/${address}`),
        ]);

        const offers = offerResp.data;

        if (offers.error) {
          throw new Error(offers.code.toString());
        }

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
            atomical: AccountAtomical;
            utxo: {
              txid: string;
              value: number;
              vout: number;
            };
          }[]
        >((acc, cur) => {
          if (cur.atomicals.length === 0) return acc;

          const atomicalData = cur.atomicals.map((id) => {
            const matchedAtomical = atomicals[id];

            if (!matchedAtomical) return;

            const atomicalPayload: AccountAtomical = {
              atomicalId: matchedAtomical.atomical_id,
              atomicalNumber: matchedAtomical.atomical_number,
              type: matchedAtomical.type,
              subtype: matchedAtomical.subtype,
              isArcs: false,
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
            } else if (
              ["container", "request_container"].includes(
                matchedAtomical.subtype,
              )
            ) {
              atomicalPayload.requestContainer =
                matchedAtomical.data.$request_container;
            } else if ("arcs.txt" in matchedAtomical.data.mint_data.fields) {
              atomicalPayload.isArcs = true;
            }

            return atomicalPayload;
          });

          for (const atomical of atomicalData) {
            if (!atomical) continue;

            const matchedOffer = offers.data.find(
              (offer) => offer.atomicalId === atomical.atomicalId,
            );

            if (matchedOffer) {
              atomical.listed = {
                price: matchedOffer.price,
                receiver: matchedOffer.receiver,
              };
            }

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
      refreshInterval: 1000 * 15,
    },
  );

  return {
    portfolio: data,
    refreshPortfolio: mutate,
  };
};
