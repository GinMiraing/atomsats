import crypto from "crypto-js";

import { useWallet } from "@/components/Wallet/hooks";

import AxiosInstance from "../axios";

const { SHA256 } = crypto;

export const useLikeOffer = () => {
  const { account, connector, setModalOpen } = useWallet();

  const likeOffer = async (id: number) => {
    if (!account || !connector) {
      setModalOpen(true);
      return;
    }

    const signature = await connector.signMessage(
      `liked ${SHA256(id.toString()).toString()} by ${account.address}`,
      account.type === "p2tr" ? "bip322-simple" : "ecdsa",
    );

    const { data } = await AxiosInstance.post<{
      data: null;
      error: boolean;
      code: number;
    }>("/api/offer/favor", {
      id,
      event: "like",
      account: account.address,
      pubkey: account.pubkey.toString("hex"),
      script: account.script.toString("hex"),
      signature,
    });

    if (data.error) {
      throw new Error(data.code.toString());
    }
  };

  const unlikeOffer = async (id: number) => {
    if (!account || !connector) {
      setModalOpen(true);
      return;
    }

    const signature = await connector.signMessage(
      `unliked ${SHA256(id.toString()).toString()} by ${account.address}`,
      account.type === "p2tr" ? "bip322-simple" : "ecdsa",
    );

    const { data } = await AxiosInstance.post<{
      data: null;
      error: boolean;
      code: number;
    }>("/api/offer/favor", {
      id,
      event: "unlike",
      account: account.address,
      pubkey: account.pubkey.toString("hex"),
      script: account.script.toString("hex"),
      signature,
    });

    if (data.error) {
      throw new Error(data.code.toString());
    }
  };

  return {
    likeOffer,
    unlikeOffer,
  };
};
