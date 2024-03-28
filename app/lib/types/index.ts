import { Network } from "bitcoinjs-lib";

export type UTXO = {
  txid: string;
  vout: number;
  value: number;
  script_pubkey: string;
};

export type AtomicalPreviewItem = {
  atomicalId: string;
  atomicalNumber: number;
  type: "FT" | "NFT";
  subtype: string;
  timestamp: number;
  realm?: string;
  ticker?: string;
  container?: string;
  contentType?: string;
  content?: string;
};

export type AtomicalItemInAddressPage = {
  atomicalId: string;
  atomicalNumber: number;
  type: "FT" | "NFT";
  subtype: string;
  realm?: string;
  ticker?: string;
  amount?: number;
  container?: string;
  contentType?: string;
  content?: string;
};

export enum AtomicalSubtype {
  REALM = "realm",
  REQUEST_REALM = "request_realm",
  CONTAINER = "container",
  REQUEST_CONTAINER = "request_container",
  SUBREALM = "subrealm",
  REQUEST_SUBREALM = "request_subrealm",
  DMITEM = "dmitem",
  REQUEST_DMITEM = "request_dmitem",
}

export type AtomicalTokenPrismaSchema = {
  id: number;
  atomical_id: string;
  atomical_number: number;
  name: string;
  bitworkc: string;
  bitworkr: string;
  status: number;
  mint_mode: number;
  deploy_time: number;
  total_supply: bigint;
  circulating_supply: bigint;
  mint_amount: bigint;
  is_hot: boolean;
  rank: number;
  holders: number;
  minted: bigint;
  update_at: number;
  icon_url: string;
};

export type AtomicalDMITEMPrismaSchema = {
  id: number;
  atomical_id: string;
  atomical_number: number;
  container: string;
  dmitem: string;
  status: number;
  update_at: number;
};

export type AccountInfo = {
  address: string;
  network: Network;
  type:
    | "unknown"
    | "p2ms"
    | "p2pk"
    | "p2pkh"
    | "p2wpkh"
    | "p2wsh"
    | "p2sh"
    | "p2tr";
  pubkey: Buffer;
  script: Buffer;
};

export type BitworkInfo = {
  inputBitwork: string;
  hexBitwork: string;
  prefix: string;
  ext: number | undefined;
};
