import { AtomicalSubtype } from "@/lib/types";

export type RequestNameStatus = {
  status:
    | "verified"
    | "expired_revealed_late"
    | "claimed_by_other"
    | "pending_candidate"
    | "pending_claimed_by_other"
    | string;
  verified_atomical_id?: string;
  claimed_by_atomical_id?: string;
  pending_candidate_atomical_id?: string;
  note?: string;
};

export type MintData = {
  $bitwork: {
    bitworkc?: string;
    bitworkr?: string;
  };
  atomical_id: string;
  atomical_number: number;
  atomical_ref: string;
  confirmed: boolean;
  type: "FT" | "NFT";
  subtype: string;
};

export type AtomicalResponse = {
  atomical_id: string;
  atomical_number: number;
  type: "NFT" | "FT";
};

export interface BaseAtomicalResponse {
  atomical_id: string;
  atomical_number: number;
  atomical_ref: string;
  type: "FT" | "NFT";
  subtype: string;
  mint_info: {
    args: {
      time: number;
    };
    reveal_location_txid: string;
    reveal_location_value: number;
  };
  state?: {
    latest: {
      [key: string]: any;
    };
  };
}

export interface FTResponse extends BaseAtomicalResponse {
  $mint_mode: "fixed" | "perpetual";
  $max_supply: number;
  $mint_height: number;
  $mint_amount: number;
  $max_mints: number;
  $mint_bitworkc?: string;
  $mint_bitworkr?: string;
  $request_ticker_status: {
    status: string;
  };
  $request_ticker: string;
  mint_data: {
    fields: {
      [key: string]: any;
    };
  };
  dft_info?: {
    mint_count: number;
    mint_bitworkc_current?: string;
    mint_bitworkr_current?: string;
  };
  location_summary?: {
    unique_holders: number;
    circulating_supply: number;
  };
}

export interface DMITEMResponse extends BaseAtomicalResponse {
  $request_dmitem: string;
  $parent_container: string;
  $parent_container_name: string;
  $request_dmitem_status: {
    status: string;
  };
  mint_data: {
    fields: {
      [key: string]: any;
    };
  };
  location_info: {
    index: number;
    location: string;
    script: string;
    scripthash: string;
    tx_num: number;
    txid: string;
    value: number;
  }[];
}

export interface REALMResponse extends BaseAtomicalResponse {
  $full_realm_name: string;
  $request_realm: string;
  $request_realm_status: {
    status: string;
  };
  location_info: {
    index: number;
    location: string;
    script: string;
    scripthash: string;
    tx_num: number;
    txid: string;
    value: number;
  }[];
}

export interface CONTAINERResponse extends BaseAtomicalResponse {
  $request_container: string;
  $request_container_status: {
    status: string;
  };
  $container_dmint_status?: {
    dmint: {
      items: number;
    };
  };
  location_info: {
    index: number;
    location: string;
    script: string;
    scripthash: string;
    tx_num: number;
    txid: string;
    value: number;
  }[];
}

export type AtomicalUnionResponse =
  | FTResponse
  | DMITEMResponse
  | REALMResponse
  | CONTAINERResponse;

export const isFT = (
  atomical: Pick<AtomicalUnionResponse, "type" | "subtype">,
): atomical is FTResponse => {
  return atomical.type === "FT" && atomical.subtype !== "direct";
};

export const isDMINT = (
  atomical: Pick<AtomicalUnionResponse, "subtype">,
): atomical is DMITEMResponse => {
  return (
    atomical.subtype === AtomicalSubtype.DMITEM ||
    atomical.subtype === AtomicalSubtype.REQUEST_DMITEM
  );
};

export const isREALM = (
  atomical: Pick<AtomicalUnionResponse, "subtype">,
): atomical is REALMResponse => {
  return (
    atomical.subtype === AtomicalSubtype.REALM ||
    atomical.subtype === AtomicalSubtype.REQUEST_REALM
  );
};

export const isCONTAINER = (
  atomical: Pick<AtomicalUnionResponse, "subtype">,
): atomical is CONTAINERResponse => {
  return (
    atomical.subtype === AtomicalSubtype.CONTAINER ||
    atomical.subtype === AtomicalSubtype.REQUEST_CONTAINER
  );
};
