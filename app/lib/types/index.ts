export type UTXO = {
  txid: string;
  vout: number;
  value: number;
  script_pubkey: string;
};

export type AtomicalPreviewItem = {
  atomical_id: string;
  atomical_number: number;
  type: "FT" | "NFT";
  subtype: string;
  realm?: string;
  ticker?: string;
  container?: string;
  contentType?: string;
  content?: string;
};
