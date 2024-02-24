import { type Network, networks } from "bitcoinjs-lib";
import { createContext, useCallback, useContext, useState } from "react";

import { Wallet } from "@/global";

export type WalletContextType = {
  account: string;
  network: Network;
  connector: Wallet | null;
  connect: (wallet: "unisat" | "wizz") => void;
  disconnect: () => void;
};

export const useWallet = () => {
  const context = useContext(WalletContext);

  if (!context) {
    throw new Error("useWallet must be used within a WalletProvider");
  }

  return context;
};

const WalletContext = createContext<WalletContextType | null>(null);

export const WalletProvider: React.FC<{
  children: React.ReactNode;
}> = ({ children }) => {
  const [account, setAccount] = useState("");
  const [network, setNetwork] = useState(networks.bitcoin);
  const [connector, setConnector] = useState<Wallet | null>(null);

  const accountChanged = useCallback((accounts: string[]) => {
    setAccount(accounts[0]);
  }, []);

  const networkChanged = useCallback((network: string) => {
    setNetwork(network === "livenet" ? networks.bitcoin : networks.testnet);
  }, []);

  const connect = useCallback(async (wallet: "unisat" | "wizz") => {
    if (connector) {
      return;
    }

    if (wallet === "unisat" && !window.unisat) {
      throw new Error("Unisat wallet not installed");
    }

    if (wallet === "wizz" && !window.wizz) {
      throw new Error("Wizz wallet not installed");
    }

    const walletInstance = wallet === "unisat" ? window.unisat! : window.wizz!;

    const account = await walletInstance.requestAccounts();
    const network = await walletInstance.getNetwork();

    walletInstance.on("accountsChanged", accountChanged);
    walletInstance.on("networkChanged", networkChanged);

    setAccount(account[0]);
    setNetwork(network === "livenet" ? networks.bitcoin : networks.testnet);
    setConnector(walletInstance);
  }, []);

  const disconnect = useCallback(() => {
    if (connector) {
      connector.removeListener("accountsChanged", accountChanged);
      connector.removeListener("networkChanged", networkChanged);
    }

    setAccount("");
    setNetwork(networks.bitcoin);
    setConnector(null);
  }, []);

  return (
    <WalletContext.Provider
      value={{ account, network, connector, connect, disconnect }}
    >
      {children}
    </WalletContext.Provider>
  );
};
