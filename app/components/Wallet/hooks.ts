import { address as AddressUtils, networks } from "bitcoinjs-lib";
import { create } from "zustand";

import { AccountInfo } from "@/lib/types";
import { detectAccountType } from "@/lib/utils/address-helpers";

import { Wallet } from "@/global";

interface WalletState {
  modalOpen: boolean;
  setModalOpen: (open: boolean) => void;
  walletName: string;
  connector?: Wallet;
  account?: AccountInfo;
  connect: (wallet: "unisat" | "wizz") => Promise<void>;
  disconnect: () => void;
}

export const useWallet = create<WalletState>((set) => ({
  modalOpen: false,
  setModalOpen: (open: boolean) => set({ modalOpen: open }),
  walletName: "",
  connector: undefined,
  account: undefined,
  connect: async (wallet: "unisat" | "wizz") => {
    const connector = window[wallet];

    if (!connector) {
      throw new Error(`${wallet} wallet not installed`);
    }

    const network = await connector.getNetwork();

    if (network === "testnet") {
      throw new Error("Testnet not supported");
    }

    const account = await connector.requestAccounts();
    const pubkey = await connector.getPublicKey();
    const script = AddressUtils.toOutputScript(account[0], networks.bitcoin);

    set({
      walletName: wallet,
      connector,
      account: {
        address: account[0],
        network: networks.bitcoin,
        pubkey: Buffer.from(pubkey, "hex"),
        script,
        type: detectAccountType(account[0]),
      },
    });

    connector.on("accountsChanged", () => {
      set({ account: undefined });
    });

    connector.on("networkChanged", () => {
      set({ account: undefined });
    });

    window.localStorage.setItem("wallet", wallet);
  },
  disconnect: () => {
    window.localStorage.removeItem("wallet");
    set({ connector: undefined, account: undefined, walletName: "" });
  },
}));
