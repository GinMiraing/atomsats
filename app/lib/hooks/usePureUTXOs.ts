import { networks } from "bitcoinjs-lib";
import useSWR from "swr";

import { useWallet } from "@/components/Wallet/hooks";

import { getElectrumClient } from "../apis/atomical";
import { getUTXOsInMempool } from "../apis/mempool";
import { UTXO } from "../types";
import { detectAddressTypeToScripthash } from "../utils/address-helpers";

export const usePureUTXOs = () => {
  const { account } = useWallet();

  const electrum = getElectrumClient(networks.bitcoin);

  const { data } = useSWR(
    account ? `pure-utxos-${account.address}` : "pure-utxos",
    async () => {
      if (!account) return [];

      const safeUTXOs = window.localStorage.getItem(
        `safeUTXOs-${account.address}`,
      );

      let safeUTXOsParsed: {
        [tx: string]: number;
      } = {};

      try {
        safeUTXOsParsed = JSON.parse(safeUTXOs || "{}");
      } catch (e) {}

      const inMempoolUTXOs = await getUTXOsInMempool(
        account.address,
        networks.bitcoin,
      );

      const unavailableUTXOs = [
        ...inMempoolUTXOs.receive,
        ...inMempoolUTXOs.spent,
      ];

      const { utxos } = await electrum.atomicalsByAddress(account.address);

      const availableUTXOs = utxos.filter((utxo) => {
        const matchedIndex = unavailableUTXOs.findIndex((unavailableUTXO) => {
          return (
            unavailableUTXO.txid === utxo.txid &&
            unavailableUTXO.vout === utxo.index
          );
        });

        return matchedIndex === -1;
      });

      const { output } = detectAddressTypeToScripthash(account.address);

      const UTXOs = availableUTXOs.reduce<UTXO[]>((acc, cur) => {
        if (cur.atomicals.length !== 0) {
          return acc;
        }

        acc.push({
          txid: cur.txid,
          vout: cur.vout,
          value: cur.value,
          script_pubkey: output,
        });

        return acc;
      }, []);

      UTXOs.push(
        ...inMempoolUTXOs.receive.filter(
          (utxo) =>
            safeUTXOsParsed[utxo.txid] &&
            utxo.vout === safeUTXOsParsed[utxo.txid],
        ),
      );

      return UTXOs;
    },
    {
      refreshInterval: 1000 * 60,
    },
  );

  return {
    data,
  };
};
