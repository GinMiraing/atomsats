import { Psbt, networks } from "bitcoinjs-lib";

import { getElectrumClient } from "@/lib/apis/atomical";
import { isDMINT, isREALM } from "@/lib/apis/atomical/type";
import { AccountInfo } from "@/lib/types";
import { getInputExtra } from "@/lib/utils/address-helpers";

export const useListAtomical = () => {
  const buildPsbt = async (data: {
    atomicalId: string;
    price: number;
    receiver: string;
    account: AccountInfo;
    utxo: {
      txid: string;
      value: number;
      vout: number;
    };
  }) => {
    if (!data.account) {
      throw new Error("Account not found");
    }

    if (data.price < 546) {
      throw new Error("price is less than 546 sats - (dust value)");
    }

    const atomical = await getElectrumClient(
      networks.bitcoin,
    ).atomicalsGetState(data.atomicalId, true);

    if (!atomical) {
      throw new Error("Atomical not found");
    }

    if (
      (!isREALM(atomical.result) && !isDMINT(atomical.result)) ||
      atomical.result.subtype.includes("request")
    ) {
      throw new Error("Unsupported atomical subtype");
    }

    if (
      !atomical.result.location_info ||
      atomical.result.location_info.length === 0 ||
      (atomical.result.location_info[0].txid !== data.utxo.txid &&
        atomical.result.location_info[0].index !== data.utxo.vout)
    ) {
      throw new Error("Atomical UTXO not matching");
    }

    const psbt = new Psbt({ network: networks.bitcoin });

    psbt.addInput({
      hash: data.utxo.txid,
      index: data.utxo.vout,
      witnessUtxo: {
        script: data.account.script,
        value: data.utxo.value,
      },
      ...getInputExtra(data.account),
    });

    psbt.addOutput({
      address: data.receiver,
      value: data.price,
    });

    return psbt.toHex();
  };

  return { buildPsbt };
};
