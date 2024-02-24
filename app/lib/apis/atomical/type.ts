export type Location = {
  location: string;
  txid: string;
  index: number;
  scripthash: string;
  value: number;
  script: string;
  address?: string;
  atomicals_at_location?: any[];
  tx_num?: number;
  adddress?: string;
};

export type LocationInfo = {
  locations: Location[];
};

export type MintInfo = {
  commit_txid: string;
  commit_index: number;
  commit_location: string;
  commit_tx_num: number;
  commit_height: number;
  reveal_location_txid: string;
  reveal_location_index: number;
  reveal_location: string;
  reveal_location_tx_num: number;
  reveal_location_height: number;
  reveal_location_header: string;
  reveal_location_blockhash: string;
  reveal_location_scripthash: string;
  reveal_location_script: string;
  reveal_location_value: number;
  args?: { [key: string]: any };
  meta?: { [key: string]: any };
  ctx?: { [key: string]: any };
  init?: { [key: string]: any };
  reveal_location_address?: string;
  blockheader_info?: {
    version?: number;
    prevHash?: string;
    merkleRoot?: string;
    timestamp?: number;
    bits?: number;
    nonce?: number;
  };
  $request_realm?: string;
  $request_subrealm?: string;
  $request_container?: string;
  $request_ticker?: string;
  $pid?: string;
  $bitwork?: {
    $bitworkc?: string;
    $bitworkr?: string;
  };
};

export type MintDataSummary = {
  fields: { [key: string]: any };
};

export interface StateInfo {}

export type RuleSet = {
  pattern: string;
  outputs: Array<{
    v: number;
    s: string;
  }>;
};

export type ApplicableRule = {
  rule_set_txid: string;
  rule_set_height: number;
  rule_valid_from_height: number;
  matched_rule: RuleSet;
};

export type SubrealmCandidate = {
  tx_num: number;
  atomical_id: string;
  txid: string;
  commit_height: number;
  reveal_location_height: number;
  payment?: string;
  payment_type: string;
  make_payment_from_height: number;
  payment_due_no_later_than_height: string;
  applicable_rule?: ApplicableRule;
};

export type RequestSubrealmStatus = {
  status:
    | "verified"
    | "expired_revealed_late"
    | "expired_payment_not_received"
    | "claimed_by_other"
    | "invalid_request_subrealm_no_matched_applicable_rule"
    | "pending_awaiting_confirmations_payment_received_prematurely"
    | "pending_awaiting_confirmations_for_payment_window"
    | "pending_awaiting_confirmations"
    | "pending_awaiting_payment"
    | string;
  verified_atomical_id?: string;
  claimed_by_atomical_id?: string;
  pending_candidate_atomical_id?: string;
  pending_claimed_by_atomical_id?: string;
  note?: string;
};

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

export type NameCandidate = {
  tx_num: number;
  atomical_id: string;
  txid: string;
  commit_height: number;
  reveal_location_height: number;
};

export type MintData = {
    $bitwork: {
        bitworkc?: string
        bitworkr?: string
    }
    atomical_id: string
    atomical_number: number
    atomical_ref: string
    confirmed: boolean
    type: "FT" | "NFT";
    subtype: string;
};

export type AtomicalResponse = {
  atomical_id: string;
  atomical_number: number;
  type: "NFT" | "FT";
};
