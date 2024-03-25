import crypto from "crypto-js";

import AxiosInstance from "@/lib/axios";

import { useWallet } from "@/components/Wallet/hooks";

import { AccountAtomical } from "../types";

const { SHA256 } = crypto;

export const useListAtomical = () => {
  const { account, connector } = useWallet();

  const listAtomical = async (data: {
    atomical: AccountAtomical;
    price: number;
    receiver: string;
    description?: string;
    utxo: {
      txid: string;
      vout: number;
      value: number;
    };
  }) => {
    if (!account || !connector) {
      throw new Error("Connect wallet first");
    }

    if (data.price <= 0 || data.price >= 500000000) {
      throw new Error("Price must be between 1 and 500,000,000 sats");
    }

    const { data: unsignedPsbtResp } = await AxiosInstance.post<{
      data: {
        unsignedPsbt: string;
      };
      error: false;
      code: 0;
    }>("/api/offer/create/psbt", {
      price: data.price,
      receiver: data.receiver,
      value: data.utxo.value,
      atomicalId: data.atomical.atomicalId,
      listAccount: account.address,
      tx: data.utxo.txid,
      vout: data.utxo.vout,
      script: account.script.toString("hex"),
      pubkey: account.pubkey.toString("hex"),
    });

    if (unsignedPsbtResp.error) {
      throw new Error(unsignedPsbtResp.code.toString());
    }

    const unsignedPsbtHex = unsignedPsbtResp.data.unsignedPsbt;

    const signedPsbt = await connector.signPsbt(unsignedPsbtHex, {
      autoFinalized: false,
      toSignInputs: [
        {
          index: 0,
          address: account.address,
          sighashTypes: [131],
        },
      ],
    });

    const { data: offerResp } = await AxiosInstance.post("/api/offer/create", {
      atomicalId: data.atomical.atomicalId,
      atomicalNumber: data.atomical.atomicalNumber,
      type: data.atomical.subtype,
      price: data.price,
      listAccount: account.address,
      receiver: data.receiver,
      description: data.description,
      unsignedPsbt: unsignedPsbtHex,
      signedPsbt,
      tx: data.utxo.txid,
      vout: data.utxo.vout,
      value: data.utxo.value,
      realm: data.atomical.requestRealm,
      dmitem: data.atomical.requestDmitem,
      container: data.atomical.parentContainerName,
    });

    if (offerResp.error) {
      throw new Error(offerResp.code.toString());
    }
  };

  const unlistAtomical = async (data: {
    atomicalId: string;
    type: string;
    utxo: {
      txid: string;
      vout: number;
    };
  }) => {
    if (!account || !connector) {
      throw new Error("Connect wallet first");
    }

    if (data.type !== "realm" && data.type !== "dmitem") {
      throw new Error("Invalid type");
    }

    const bid = SHA256(
      `${data.atomicalId}:${data.utxo.txid}:${data.utxo.vout}`,
    ).toString();

    const unsignedMessage = `unlist ${bid} from ${account.address}`;
    const signature = await connector.signMessage(
      unsignedMessage,
      account.type === "p2tr" ? "bip322-simple" : "ecdsa",
    );

    const { data: unlistResp } = await AxiosInstance.post<{
      data: null;
      error: boolean;
      code: number;
    }>("/api/offer/unlist", {
      bid,
      atomicalId: data.atomicalId,
      type: data.type,
      account: account.address,
      pubkey: account.pubkey.toString("hex"),
      script: account.script.toString("hex"),
      signature,
    });

    if (unlistResp.error) {
      throw new Error(unlistResp.code.toString());
    }
  };

  return { listAtomical, unlistAtomical };
};
