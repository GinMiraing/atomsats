export interface Wallet {
  requestAccounts: () => Promise<string[]>;
  getAccounts: () => Promise<string[]>;
  getNetwork: () => Promise<"livenet" | "testnet">;
  getPublicKey: () => Promise<string>;
  signPsbt: (
    psbtHex: string,
    options?: {
      autoFinalized: boolean;
      toSignInputs: {
        index: number;
        address?: string;
        publicKey?: string;
        sighashTypes?: number[];
        disableTweakSigner?: boolean;
      }[];
    },
  ) => Promise<string>;
  on(event: "accountsChanged", handler: (accounts: string[]) => void): void;
  on(
    event: "networkChanged",
    handler: (network: "livenet" | "testnet") => void,
  ): void;
  removeListener(
    event: "accountsChanged",
    handler: (accounts: string[]) => void,
  ): void;
  removeListener(
    event: "networkChanged",
    handler: (network: "livenet" | "testnet") => void,
  ): void;
}

declare global {
  interface Window {
    unisat?: Wallet;
    wizz?: Wallet;
  }
}

export {};
