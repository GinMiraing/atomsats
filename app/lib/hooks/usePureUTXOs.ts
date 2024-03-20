import { networks } from "bitcoinjs-lib";
import useSWR from "swr";

import { useWallet } from "@/components/Wallet/hooks";

import { getElectrumClient } from "../apis/atomical";
import { UTXO } from "../types";
import { detectAddressTypeToScripthash } from "../utils/address-helpers";

export const usePureUTXOs = () => {
  const { account } = useWallet();

  const electrum = getElectrumClient(networks.bitcoin);

  const { data } = useSWR(
    account ? `pure-utxos-${account.address}` : "pure-utxos",
    async () => {
      if (!account) return [];

      const { utxos } = await electrum.atomicalsByAddress(account.address);

      const { output } = detectAddressTypeToScripthash(account.address);

      return utxos.reduce<UTXO[]>((acc, cur) => {
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
    },
    {
      refreshInterval: 1000 * 60,
    },
  );

  return {
    data,
  };
};
